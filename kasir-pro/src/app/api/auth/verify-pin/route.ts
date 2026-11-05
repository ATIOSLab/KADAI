import { NextRequest } from "next/server";
import { getServerSessionUser } from "@/lib/session";
import { verifySupervisorPin } from "@/lib/rbac/pin";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return jsonError("PIN wajib diisi", 400);
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const verification = await verifySupervisorPin(pin, clientIp);

    if (!verification.valid) {
      return jsonError(verification.error || "PIN Supervisor tidak valid", 403);
    }

    return jsonOk(
      { supervisor: verification.supervisor },
      `Diotorisasi oleh ${verification.supervisor?.name} (${verification.supervisor?.role})`
    );
  } catch (error) {
    return handleApiError(error, "POST /api/auth/verify-pin", "Gagal memverifikasi PIN");
  }
}
