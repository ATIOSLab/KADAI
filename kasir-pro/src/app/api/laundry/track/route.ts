import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Kredensial pelacakan:
// - `token`: token QR acak (trackingToken) — tidak bisa ditebak.
// - `code` : nomor resi (jobCode) — HANYA valid bila disertai `phone`/`customerPhone`.
// Batas panjang kredensial mencegah abuse/enumerasi massal.
const MAX_CREDENTIAL_LENGTH = 64;
const MIN_PHONE_DIGITS = 8;

const JOB_INCLUDE = {
  outlet: {
    select: {
      name: true,
      address: true,
      phone: true,
    },
  },
  sale: {
    select: {
      invoiceNumber: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: {
            select: {
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.LaundryJobOrderInclude;

type TrackedJob = Prisma.LaundryJobOrderGetPayload<{ include: typeof JOB_INCLUDE }>;

// Normalisasi nomor HP: hanya digit, prefix 62 -> 0, agar toleran format.
function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const credential = (searchParams.get("token") || searchParams.get("code") || "").trim();
    const phone = (searchParams.get("phone") || searchParams.get("customerPhone") || "").trim();

    if (!credential) {
      return NextResponse.json(
        { error: "Token pelacakan atau nomor resi diperlukan" },
        { status: 400 }
      );
    }

    if (credential.length > MAX_CREDENTIAL_LENGTH || phone.length > MAX_CREDENTIAL_LENGTH) {
      return NextResponse.json(
        { error: "Kredensial pelacakan tidak valid" },
        { status: 400 }
      );
    }

    let job: TrackedJob | null = null;

    if (phone) {
      // Jalur nomor resi: wajib pasangan resi + nomor HP pemesan.
      const expectedPhone = normalizePhone(phone);
      if (expectedPhone.length < MIN_PHONE_DIGITS) {
        return NextResponse.json(
          { error: "Nomor HP pelacakan tidak valid" },
          { status: 400 }
        );
      }

      const candidate = await prisma.laundryJobOrder.findFirst({
        where: {
          OR: [{ jobCode: credential.toUpperCase() }, { trackingToken: credential }],
        },
        include: JOB_INCLUDE,
      });

      // Nomor HP dibandingkan setelah normalisasi. Resi ada tapi HP tidak cocok
      // menghasilkan 404 identik dengan resi tidak ada, sehingga endpoint tidak
      // jadi oracle untuk memetakan resi tenant lain.
      if (candidate && normalizePhone(candidate.customerPhone) === expectedPhone) {
        job = candidate;
      }
    } else {
      // Jalur token QR acak: kredensial rahasia tunggal.
      job = await prisma.laundryJobOrder.findFirst({
        where: { trackingToken: credential },
        include: JOB_INCLUDE,
      });
    }

    if (!job) {
      return NextResponse.json(
        { error: "Nomor resi atau pesanan laundry tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobCode: job.jobCode,
        trackingToken: job.trackingToken,
        serviceType: job.serviceType,
        status: job.status,
        paymentStatus: job.paymentStatus,
        weightKg: job.weightKg ? Number(job.weightKg) : null,
        itemCount: job.itemCount,
        fragrance: job.fragrance,
        rackLocation: job.rackLocation,
        specialNotes: job.specialNotes,
        estimatedDoneAt: job.estimatedDoneAt,
        receivedAt: job.receivedAt,
        washedAt: job.washedAt,
        driedAt: job.driedAt,
        ironedAt: job.ironedAt,
        readyAt: job.readyAt,
        pickedUpAt: job.pickedUpAt,
        totalAmount: Number(job.totalAmount),
        downPayment: Number(job.downPayment),
        remainingAmount: Number(job.remainingAmount),
        customerName: job.customerName,
        customerPhone: job.customerPhone ? job.customerPhone.replace(/(\d{4})\d+(\d{3})/, "$1****$2") : null,
        outlet: job.outlet,
        invoiceNumber: job.sale.invoiceNumber,
        items: job.sale.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unit: i.product.unit,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    });
  } catch (error: any) {
    console.error("GET /api/laundry/track error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status pelacakan laundry" },
      { status: 500 }
    );
  }
}
