import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";

const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  role: z.nativeEnum(UserRole),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export function parseSessionUser(value?: string | null): SessionUser | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return sessionUserSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function getSessionUserFromRequest(
  request: NextRequest
): SessionUser | null {
  return parseSessionUser(request.cookies.get("session")?.value);
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSessionUser(cookieStore.get("session")?.value);
}
