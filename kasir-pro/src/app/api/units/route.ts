import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createUnitSchema } from "@/lib/validators/unit";

function normalizeUnitName(name: string) {
  return name.trim().toLowerCase();
}

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        normalizedName: true,
      },
    });

    return NextResponse.json({ data: units });
  } catch (error) {
    console.error("GET /api/units error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar satuan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createUnitSchema.parse(body);
    const normalizedName = normalizeUnitName(data.name);

    const existingUnit = await prisma.unit.findUnique({
      where: { normalizedName },
      select: {
        id: true,
        name: true,
        normalizedName: true,
      },
    });

    if (existingUnit) {
      return NextResponse.json({ success: true, data: existingUnit });
    }

    const unit = await prisma.unit.create({
      data: {
        name: data.name.trim(),
        normalizedName,
      },
      select: {
        id: true,
        name: true,
        normalizedName: true,
      },
    });

    return NextResponse.json({ success: true, data: unit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/units error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data satuan tidak valid" },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Satuan sudah tersedia" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambahkan satuan baru" },
      { status: 500 }
    );
  }
}
