import { NextResponse } from "next/server";

// Public ADMIN creation is unsafe with the current single-store schema.
export async function POST() {
  return NextResponse.json(
    { error: "Registrasi publik dinonaktifkan. Hubungi administrator untuk provisioning akun." },
    { status: 403 }
  );
}

