

export const APP_ROLES = [
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "INVENTORY",
  "ACCOUNTANT",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ADMIN_ONLY_ROLES = ["ADMIN"] as const;
export const ADMIN_MANAGER_ROLES = ["ADMIN", "MANAGER"] as const;
export const ADMIN_CASHIER_ROLES = ["ADMIN", "MANAGER", "CASHIER"] as const;
export const POS_ROLES = ["ADMIN", "MANAGER", "CASHIER"] as const;
export const KDS_ROLES = ["ADMIN", "MANAGER", "KITCHEN"] as const;
export const INVENTORY_ROLES = ["ADMIN", "MANAGER", "INVENTORY"] as const;
export const FINANCE_ROLES = ["ADMIN", "MANAGER", "ACCOUNTANT"] as const;
export const ALL_AUTHENTICATED_ROLES = [
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "INVENTORY",
  "ACCOUNTANT",
] as const;

type RouteAccessRule = {
  path: string;
  roles: readonly AppRole[];
};

const dashboardRouteRules: RouteAccessRule[] = [
  { path: "/profile", roles: ALL_AUTHENTICATED_ROLES },
  { path: "/settings", roles: ADMIN_ONLY_ROLES },
  { path: "/demo-requests", roles: ADMIN_ONLY_ROLES },
  { path: "/finance/tax", roles: FINANCE_ROLES },
  { path: "/finance", roles: FINANCE_ROLES },
  { path: "/reports", roles: FINANCE_ROLES },
  { path: "/activity-log", roles: ADMIN_MANAGER_ROLES },
  { path: "/dashboard", roles: ADMIN_MANAGER_ROLES },
  { path: "/products", roles: ["ADMIN", "MANAGER", "INVENTORY"] },
  { path: "/suppliers", roles: INVENTORY_ROLES },
  { path: "/customers", roles: ADMIN_CASHIER_ROLES },
  { path: "/outlets", roles: ADMIN_MANAGER_ROLES },
  { path: "/inventory/restock", roles: INVENTORY_ROLES },
  { path: "/inventory/adjustments", roles: INVENTORY_ROLES },
  { path: "/inventory/transfers", roles: INVENTORY_ROLES },
  { path: "/inventory", roles: INVENTORY_ROLES },
  { path: "/sales", roles: ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"] },
  { path: "/pos", roles: POS_ROLES },
  { path: "/tables", roles: ADMIN_MANAGER_ROLES },
  { path: "/kds", roles: KDS_ROLES },
];

export type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

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
  switch (role) {
    case "CASHIER":
      return "/pos";
    case "KITCHEN":
      return "/kds";
    case "INVENTORY":
      return "/inventory";
    case "ACCOUNTANT":
      return "/finance";
    default:
      return "/dashboard";
  }
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

