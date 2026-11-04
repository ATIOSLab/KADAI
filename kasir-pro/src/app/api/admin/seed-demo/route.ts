import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import { runDemoSeeding } from "@/lib/demo-seeder";

// POST /api/admin/seed-demo
// Secured endpoint: Only authenticated ADMIN or valid setup secret can trigger cluster seeding
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-seed-key");
    const validSecret = process.env.BETTER_AUTH_SECRET || "kadai-seed-secret";
    
    let isAuthorized = false;
    if (authHeader && authHeader === validSecret) {
      isAuthorized = true;
    } else {
      const sessionUser = getSessionUserFromRequest(request);
      if (sessionUser && hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const result = await runDemoSeeding();
    return NextResponse.json({ success: true, message: "Demo clusters seeded successfully!", data: result });
  } catch (error: any) {
    console.error("POST /api/admin/seed-demo error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed demo clusters" }, { status: 500 });
  }
}
