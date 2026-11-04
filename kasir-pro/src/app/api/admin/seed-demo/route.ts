import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session";
import { ADMIN_ONLY_ROLES, hasRequiredRole } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { ProductType, StationType, UserRole } from "@prisma/client";
import path from "path";
import fs from "fs";

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

    const candidates = [
      "/app/prisma/seed-demo-clusters.js",
      path.resolve(process.cwd(), "prisma/seed-demo-clusters.js"),
      path.resolve(__dirname, "../../../../prisma/seed-demo-clusters.js")
    ];
    let seedPath = candidates.find(p => fs.existsSync(p));
    if (!seedPath) {
      return NextResponse.json({ error: "File seed-demo-clusters.js tidak ditemukan di container. Candidates: " + JSON.stringify(candidates) }, { status: 500 });
    }
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
