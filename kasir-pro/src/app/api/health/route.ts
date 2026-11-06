import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health probe untuk uptime monitor & load balancer.
 * Cek konektivitas database secara nyata (tidak pernah menandai sehat tanpa bukti).
 * 200 = ok, 503 = degraded.
 */
export async function GET() {
  const startedAt = Date.now();
  let db: "up" | "down" = "down";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    db = "up";
  } catch {
    db = "down";
  }

  const body = {
    status: db === "up" ? "ok" : "degraded",
    service: "kadai-web",
    version: process.env.APP_VERSION || "prod",
    db: { status: db, latencyMs: dbLatencyMs },
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: db === "up" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
