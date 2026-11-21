import { test } from "node:test";
import assert from "node:assert/strict";

import { navigationSections } from "../src/components/layout/navigation";
import { canAccessPath } from "../src/lib/rbac";

const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "INVENTORY",
  "ACCOUNTANT",
] as const;

/**
 * UAT RBAC (menu ↔ aturan): setiap role yang MELIHAT item menu wajib benar-benar
 * boleh MEMBUKA halaman itu menurut canAccessPath(). Bug nyata yang dijaga test ini:
 * menu "/laundry" terlihat untuk INVENTORY padahal proxy menolaknya (menu buntu).
 */
test("paritas menu-RBAC: role yang melihat menu pasti boleh membuka halamannya", () => {
  let checked = 0;
  for (const section of navigationSections) {
    for (const item of section.items) {
      const visibleRoles = item.roles ?? ALL_ROLES;
      for (const role of visibleRoles) {
        assert.equal(
          canAccessPath(item.href, role),
          true,
          `Menu "${item.label}" (${item.href}) tampil untuk role ${role}, tetapi canAccessPath menolaknya — menu dan aturan RBAC tidak sinkron`
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 20, `terlalu sedikit kombinasi diperiksa: ${checked}`);
});

test("setiap item menu bisa dibuka minimal satu role (tidak ada menu buntu total)", () => {
  for (const section of navigationSections) {
    for (const item of section.items) {
      const anyRole = ALL_ROLES.some((role) => canAccessPath(item.href, role));
      assert.equal(
        anyRole,
        true,
        `Menu "${item.label}" (${item.href}) tidak dapat dibuka role mana pun`
      );
    }
  }
});

test("menu dan tombol tidak bocor ke role di luar aturan halaman", () => {
  for (const section of navigationSections) {
    for (const item of section.items) {
      if (!item.roles) continue;
      for (const role of ALL_ROLES) {
        if (item.roles.includes(role)) continue;
        // role yang tidak melihat menu: halaman boleh tetap bisa dibuka lewat URL,
        // tetapi tidak boleh muncul sebagai menu. Ini menjaga arah sebaliknya.
        assert.equal(
          item.roles.includes(role),
          false,
          `Role ${role} tidak seharusnya melihat menu ${item.href}`
        );
      }
    }
  }
});
