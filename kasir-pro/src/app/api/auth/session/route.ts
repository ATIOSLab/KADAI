import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sessionUser = getSessionUserFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ambil tipe usaha store aktif untuk adaptasi modular dashboard
  const store = await prisma.store.findFirst({
    select: {
      businessType: true,
      tier: true,
      name: true,
    },
  });

  return NextResponse.json({
    data: {
      ...sessionUser,
      businessType: store?.businessType ?? "FNB_CAFE",
      storeTier: store?.tier ?? "PRO_BUSINESS",
      storeName: store?.name ?? "KADAI Store",
    },
  });
}
