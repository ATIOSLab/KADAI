import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { ProductType, StationType, UserRole } from "@prisma/client";

// POST /api/admin/seed-demo
// Secured endpoint: Only authenticated ADMIN can trigger or verify cluster seeding
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser || !hasRequiredRole(sessionUser.role, ADMIN_ONLY_ROLES)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const demoModule = require("../../../../prisma/seed-demo-clusters.js");
    if (typeof demoModule === "function") {
      await demoModule();
      return NextResponse.json({ success: true, message: "Demo clusters seeded successfully!" });
    }

    return NextResponse.json({ error: "Seed function not found" }, { status: 500 });
  } catch (error: any) {
    console.error("POST /api/admin/seed-demo error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed demo clusters" }, { status: 500 });
  }
}
