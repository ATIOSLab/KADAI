export const APP_ROLES = ["ADMIN", "MANAGER", "CASHIER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ADMIN_ONLY_ROLES = ["ADMIN"] as const;
export const ADMIN_MANAGER_ROLES = ["ADMIN", "MANAGER"] as const;
export const ADMIN_CASHIER_ROLES = ["ADMIN", "CASHIER"] as const;
export const ALL_AUTHENTICATED_ROLES = ["ADMIN", "MANAGER", "CASHIER"] as const;

type RouteAccessRule = {
  path: string;
  roles: readonly AppRole[];
};

const dashboardRouteRules: RouteAccessRule[] = [
  { path: "/profile", roles: ALL_AUTHENTICATED_ROLES },
  { path: "/settings", roles: ADMIN_ONLY_ROLES },
  { path: "/finance", roles: ADMIN_MANAGER_ROLES },
  { path: "/reports", roles: ADMIN_MANAGER_ROLES },
  { path: "/activity-log", roles: ADMIN_MANAGER_ROLES },
  { path: "/dashboard", roles: ADMIN_MANAGER_ROLES },
  { path: "/products", roles: ADMIN_MANAGER_ROLES },
  { path: "/inventory/restock", roles: ADMIN_MANAGER_ROLES },
  { path: "/inventory/adjustments", roles: ADMIN_MANAGER_ROLES },
  { path: "/inventory", roles: ALL_AUTHENTICATED_ROLES },
  { path: "/sales", roles: ALL_AUTHENTICATED_ROLES },
  { path: "/pos", roles: ADMIN_CASHIER_ROLES },
  { path: "/tables", roles: ADMIN_MANAGER_ROLES },
  { path: "/kds", roles: ALL_AUTHENTICATED_ROLES },
];

type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

function decodeBase64(value: string) {
  if (typeof atob === "function") {
    return atob(value);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }

  throw new Error("Base64 decoding is not available in this runtime.");
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function hasRequiredRole(
  role: string | null | undefined,
  allowedRoles: readonly AppRole[]
) {
  return !!role && allowedRoles.includes(role as AppRole);
}

export function getDefaultPathForRole(role: string | null | undefined) {
  return role === "CASHIER" ? "/pos" : "/dashboard";
}

export function getAllowedRolesForPath(pathname: string) {
  const matchedRule = [...dashboardRouteRules]
    .sort((left, right) => right.path.length - left.path.length)
    .find((rule) =>
      pathname === rule.path || pathname.startsWith(`${rule.path}/`)
    );

  return matchedRule?.roles ?? null;
}

export function canAccessPath(pathname: string, role: string | null | undefined) {
  const allowedRoles = getAllowedRolesForPath(pathname);

  if (!allowedRoles) {
    return true;
  }

  return hasRequiredRole(role, allowedRoles);
}

export function parseSessionCookie(
  value?: string | null
): SessionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64(value)) as Partial<SessionPayload>;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string" ||
      !isAppRole(parsed.role)
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}
