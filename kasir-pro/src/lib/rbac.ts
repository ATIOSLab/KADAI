

export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "INVENTORY",
  "ACCOUNTANT",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

// Operator platform KADAI — satu-satunya role dengan akses /platform/*
export const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"] as const;
// ADMIN_ONLY kini = SUPER_ADMIN + ADMIN (owner tenant): superadmin mewarisi
// seluruh kemampuan admin/owner sehingga dapat menangani dukungan lintas tenant.
export const ADMIN_ONLY_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export const PLATFORM_OR_OWNER_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export const ADMIN_MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;
export const ADMIN_CASHIER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER"] as const;
export const POS_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER"] as const;
export const KDS_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "KITCHEN"] as const;
export const INVENTORY_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "INVENTORY"] as const;
export const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "ACCOUNTANT"] as const;
export const ALL_AUTHENTICATED_ROLES = [
  "SUPER_ADMIN",
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
  { path: "/demo-requests", roles: SUPER_ADMIN_ROLES },
  { path: "/referrals", roles: SUPER_ADMIN_ROLES },
  // Platform KADAI (khusus SUPER_ADMIN)
  { path: "/platform", roles: SUPER_ADMIN_ROLES },
  { path: "/platform/owners", roles: SUPER_ADMIN_ROLES },
  { path: "/platform/subscriptions", roles: SUPER_ADMIN_ROLES },
  { path: "/platform/tenants", roles: SUPER_ADMIN_ROLES },
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
    case "SUPER_ADMIN":
      return "/platform";
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

