import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/session";
import { verifySupervisorPin } from "@/lib/rbac/pin";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pin, action = "OVERRIDE" } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN wajib diisi" }, { status: 400 });
    }

    const verification = await verifySupervisorPin(pin);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "PIN Supervisor tidak valid" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Diotorisasi oleh ${verification.supervisor?.name} (${verification.supervisor?.role})`,
      supervisor: verification.supervisor,
    });
  } catch (error) {
    console.error("POST /api/auth/verify-pin error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi PIN" },
      { status: 500 }
    );
  }
}
