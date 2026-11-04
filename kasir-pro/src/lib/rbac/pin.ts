import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/security";

export async function verifySupervisorPin(
  pin: string,
  clientIp?: string
): Promise<{
  valid: boolean;
  supervisor?: { id: string; name: string; role: string };
  error?: string;
}> {
  if (!pin || pin.length < 4 || pin.length > 8) {
    return { valid: false, error: "PIN harus berupa 4-8 digit angka" };
  }

  // A07: Rate limit PIN attempts — prevent brute force
  const rateLimitKey = `pin:${clientIp || "unknown"}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 10 * 60 * 1000, 30 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      valid: false,
      error: rateLimit.locked
        ? `Terlalu banyak percobaan PIN. Coba lagi dalam ${Math.ceil(rateLimit.retryAfterSeconds / 60)} menit.`
        : "Terlalu banyak percobaan PIN.",
    };
  }

  // Find all active managers and admins
  const supervisors = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      supervisorPin: true,
    },
  });

  if (supervisors.length === 0) {
    return { valid: false, error: "Tidak ada Supervisor / Admin yang aktif" };
  }

  // A07: Removed default PIN "123456" fallback — supervisors MUST set a PIN
  // Check each supervisor's PIN
  for (const s of supervisors) {
    if (s.supervisorPin) {
      const match = await bcrypt.compare(pin, s.supervisorPin);
      if (match) {
        return {
          valid: true,
          supervisor: { id: s.id, name: s.name, role: s.role },
        };
      }
    }
  }

  // A09: Log failed PIN attempt
  console.warn(`[SECURITY] Failed supervisor PIN attempt: ip=${clientIp || "unknown"}`);

  return { valid: false, error: "PIN Supervisor salah atau belum disetel" };
}
