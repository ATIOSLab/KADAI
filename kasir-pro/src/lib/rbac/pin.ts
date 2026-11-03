import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function verifySupervisorPin(pin: string): Promise<{
  valid: boolean;
  supervisor?: { id: string; name: string; role: string };
  error?: string;
}> {
  if (!pin || pin.length < 4 || pin.length > 8) {
    return { valid: false, error: "PIN harus berupa 4-8 digit angka" };
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
      passwordHash: true,
    },
  });

  if (supervisors.length === 0) {
    return { valid: false, error: "Tidak ada Supervisor / Admin yang aktif" };
  }

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
    } else {
      // If supervisor hasn't set custom PIN yet, default fallback PIN is "123456"
      if (pin === "123456") {
        return {
          valid: true,
          supervisor: { id: s.id, name: s.name, role: s.role },
        };
      }
    }
  }

  return { valid: false, error: "PIN Supervisor salah atau tidak memiliki wewenang" };
}
