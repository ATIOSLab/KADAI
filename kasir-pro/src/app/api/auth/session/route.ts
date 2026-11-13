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
    where: sessionUser.storeId ? { id: sessionUser.storeId } : undefined,
    select: {
      id: true,
      businessType: true,
      tier: true,
      name: true,
    },
  });

  // Deteksi vertikal adaptif berbasis akun demo/profil pengguna
  let activeBusinessType: string = store?.businessType ?? "FNB_CAFE";
  const emailLower = sessionUser.email.toLowerCase();

  if (emailLower.includes("bangunan") || emailLower.includes("material")) {
    activeBusinessType = "BUILDING_SUPPLY";
  } else if (emailLower.includes("apotek") || emailLower.includes("farmasi") || emailLower.includes("medika")) {
    activeBusinessType = "PHARMACY";
  } else if (emailLower.includes("sembako") || emailLower.includes("grosir") || emailLower.includes("retail")) {
    activeBusinessType = "RETAIL";
  } else if (emailLower.includes("barber") || emailLower.includes("laundry") || emailLower.includes("service") || emailLower.includes("klinik")) {
    activeBusinessType = "SERVICE";
  } else if (emailLower.includes("resto")) {
    activeBusinessType = "FNB_RESTAURANT";
  } else if (emailLower.includes("bakso") || emailLower.includes("warung")) {
    activeBusinessType = "FNB_WARUNG";
  } else if (emailLower.includes("cafe") || emailLower.includes("kopi")) {
    activeBusinessType = "FNB_CAFE";
  }

  return NextResponse.json({
    data: {
      ...sessionUser,
      businessType: activeBusinessType,
      storeTier: store?.tier ?? "PRO_BUSINESS",
      storeName: sessionUser.storeName ?? store?.name ?? "KADAI Store",
      storeId: sessionUser.storeId ?? store?.id,
    },
  });
}
