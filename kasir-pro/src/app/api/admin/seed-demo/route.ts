import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { ProductType, StationType, UserRole } from "@prisma/client";
import path from "path";

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

    const seedPath = path.resolve(process.cwd(), "prisma/seed-demo-clusters.js");
    const demoModule = require(seedPath);
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
