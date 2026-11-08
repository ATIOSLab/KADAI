import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code");

    if (!token) {
      return NextResponse.json(
        { error: "Token pelacakan atau nomor resi diperlukan" },
        { status: 400 }
      );
    }

    const job = await prisma.laundryJobOrder.findFirst({
      where: {
        OR: [
          { trackingToken: token },
          { jobCode: token.toUpperCase() },
        ],
      },
      include: {
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
      },
    });

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
