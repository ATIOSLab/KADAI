import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { runDemoSeeding } from "@/lib/demo-seeder";

// POST /api/admin/seed-demo
// Endpoint bootstrap seeding klaster demo.
//
// Otorisasi (TIDAK ada rahasia hardcoded — nilai literal di kode sama dengan
// nilai yang bisa dibaca siapa pun di repo publik, sehingga tidak pernah boleh
// menjadi kredensial yang valid):
//   1. Sesi ADMIN yang login, ATAU
//   2. Header X-Seed-Key yang cocok dengan env SEED_ADMIN_SECRET
//      (perbandingan timing-safe; tanpa env tersebut jalur ini fail-closed).
function samaPersis(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function hasValidSeedSecret(request: NextRequest): boolean {
  const secret = (process.env.SEED_ADMIN_SECRET || "").trim();
  if (!secret) return false; // fail-closed
  const provided = (request.headers.get("x-seed-key") || "").trim();
  return provided.length > 0 && samaPersis(provided, secret);
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    const viaAdminSession =
      !!sessionUser && hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES);

    if (!viaAdminSession && !hasValidSeedSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized: sesi ADMIN atau header X-Seed-Key yang sah diperlukan" },
        { status: 401 }
      );
    }

    const result = await runDemoSeeding();
    return NextResponse.json({
      success: true,
      message: "Demo clusters seeded successfully!",
      data: result,
    });
  } catch (error) {
    console.error("POST /api/admin/seed-demo error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan seeding demo clusters" },
      { status: 500 }
    );
  }
}
