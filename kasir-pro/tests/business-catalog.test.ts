import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  BUSINESS_CATEGORIES,
  BUSINESS_PROFILES,
  BUSINESS_TYPE_KEYS,
  MODULE_KEYS,
  MODULES,
  getBusinessProfile,
  getBusinessTypeLabel,
  getCategoryForType,
  getGatingModulesForRoute,
  getModulesForType,
  getRolesForType,
  isBusinessType,
  isRouteAvailableForBusinessType,
  typesWithModule,
} from "../src/lib/business-catalog";
import { APP_ROLES, getAllowedRolesForPath } from "../src/lib/rbac";
import { navigationSections } from "../src/components/layout/navigation";

const ROOT = path.resolve(__dirname, "..");

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/**
 * Katalog vertikal usaha: menjaga paritas antara enum schema, katalog,
 * filter menu, dan aturan RBAC. Bug yang dijaga: (1) tipe usaha baru lolos ke
 * schema tanpa modul/peran yang jelas, (2) menu di-hardcode lagi sehingga menu
 * modul bocor ke vertikal yang salah, (3) modul baru muncul di katalog tapi
 * tidak punya aturan RBAC (fail-closed → halaman mati), (4) form pendaftaran
 * dan provisioning kembali menyimpan daftar tipe sendiri.
 */
test("BUSINESS_TYPE_KEYS paritas persis dengan enum BusinessType di schema Prisma", () => {
  const schema = readSrc("prisma/schema.prisma");
  const block = schema.match(/enum BusinessType \{([^}]*)\}/);
  assert.ok(block, "enum BusinessType tidak ditemukan di schema.prisma");
  const values = block[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"))
    .filter((l) => !l.startsWith("@@"));
  assert.deepEqual(values, [...BUSINESS_TYPE_KEYS]);
});

test("setiap tipe usaha punya profil lengkap dan terisi", () => {
  for (const key of BUSINESS_TYPE_KEYS) {
    const p = getBusinessProfile(key);
    assert.equal(p.key, key, `profil ${key} harus memakai key yang sama`);
    assert.ok(p.label.length > 2, `${key}: label terlalu pendek`);
    assert.ok(p.tagline.length > 2, `${key}: tagline kosong`);
    assert.ok(p.description.length > 20, `${key}: deskripsi terlalu pendek`);
    assert.ok(p.examples.length >= 2, `${key}: butuh minimal 2 contoh usaha`);
    assert.ok(p.features.length >= 2, `${key}: butuh minimal 2 fitur khas`);
    assert.ok(p.modules.length > 0, `${key}: daftar modul kosong`);
    assert.ok(p.roles.length > 0, `${key}: daftar peran kosong`);
    assert.ok(["PPN", "PB1"].includes(p.taxMode), `${key}: taxMode tidak dikenal`);
    assert.ok(p.accent.chip && p.accent.ring && p.accent.text && p.accent.border, `${key}: accent tidak lengkap`);
    assert.ok(typeof p.icon === "object" || typeof p.icon === "function", `${key}: ikon tidak valid`);
  }
});

test("setiap tipe usaha berada di tepat satu kategori dan kategori tidak kosong", () => {
  const seen = new Set<string>();
  for (const category of BUSINESS_CATEGORIES) {
    assert.ok(category.types.length > 0, `kategori ${category.key} kosong`);
    assert.ok(category.label.length > 2, `kategori ${category.key}: label kosong`);
    for (const typeKey of category.types) {
      assert.ok(!seen.has(typeKey), `tipe ${typeKey} terdaftar di dua kategori`);
      seen.add(typeKey);
      assert.equal(getCategoryForType(typeKey).key, category.key);
    }
  }
  assert.deepEqual([...seen].sort(), [...BUSINESS_TYPE_KEYS].sort());
});

test("MODULES terdaftar lengkap dengan path absolut dan label manusiawi", () => {
  for (const key of MODULE_KEYS) {
    const m = MODULES[key];
    assert.ok(m, `modul ${key} tidak ada di registry MODULES`);
    assert.equal(m.key, key);
    assert.ok(m.path.startsWith("/"), `modul ${key}: path harus absolut`);
    assert.ok(m.label.length > 2, `modul ${key}: label kosong`);
    assert.ok(m.description.length > 10, `modul ${key}: deskripsi kosong`);
  }
  assert.equal(Object.keys(MODULES).length, MODULE_KEYS.length);
});

test("modul vertikal (non-universal) hanya tables, kds, catering, laundry", () => {
  const vertical = MODULE_KEYS.filter((k) => !MODULES[k].universal);
  assert.deepEqual([...vertical], ["tables", "kds", "catering", "laundry"]);
});

test("modul universal aktif untuk SEMUA tipe usaha", () => {
  for (const key of MODULE_KEYS) {
    if (!MODULES[key].universal) continue;
    assert.deepEqual(
      typesWithModule(key),
      [...BUSINESS_TYPE_KEYS],
      `modul universal ${key} tidak aktif di semua vertikal`
    );
  }
});

test("pemetaan modul per vertikal tepat (catering/laundry/kds/tables)", () => {
  assert.deepEqual(typesWithModule("catering"), ["CATERING"]);
  assert.deepEqual(typesWithModule("laundry"), ["LAUNDRY"]);
  assert.deepEqual(typesWithModule("kds"), [
    "FNB_CAFE",
    "FNB_RESTAURANT",
    "FNB_WARUNG",
    "CATERING",
  ]);
  // Meja & QR self-order khusus dine-in; katering memakai modul booking.
  assert.deepEqual(typesWithModule("tables"), [
    "FNB_CAFE",
    "FNB_RESTAURANT",
    "FNB_WARUNG",
  ]);
  assert.ok(!getModulesForType("CATERING").some((m) => m.key === "tables"));
  // Laundry punya tipenya sendiri; salon/bengkel (SERVICE) tidak lagi dapat menu Cuci.
  assert.ok(getModulesForType("LAUNDRY").some((m) => m.key === "laundry"));
  assert.ok(!getModulesForType("SERVICE").some((m) => m.key === "laundry"));
});

test("setiap peran staf vertikal valid, unik, dan selalu menyertakan ADMIN", () => {
  for (const key of BUSINESS_TYPE_KEYS) {
    const roles = getRolesForType(key);
    assert.equal(new Set(roles).size, roles.length, `${key}: peran duplikat`);
    for (const role of roles) {
      assert.ok((APP_ROLES as readonly string[]).includes(role), `${key}: peran ${role} tidak dikenal`);
    }
    assert.ok(roles.includes("ADMIN"), `${key}: ADMIN wajib ada agar tenant tidak terkunci`);
  }
  // Peran dapur hanya relevan di vertikal F&B.
  assert.ok(getRolesForType("CATERING").includes("KITCHEN"));
  assert.ok(!getRolesForType("RETAIL").includes("KITCHEN"));
  assert.ok(getRolesForType("PHARMACY").includes("INVENTORY"));
});

test("setiap modul katalog punya aturan RBAC (anti halaman mati karena fail-closed)", () => {
  for (const key of MODULE_KEYS) {
    const rules = getAllowedRolesForPath(MODULES[key].path);
    assert.ok(
      rules && rules.length > 0,
      `modul ${key} (${MODULES[key].path}) tidak punya aturan RBAC di rbac.ts`
    );
  }
});

test("menu memakai filter turunan katalog, bukan array tipe yang di-hardcode", () => {
  const nav = readSrc("src/components/layout/navigation.ts");
  assert.ok(nav.includes("typesWithModule"), "navigation.ts harus memakai typesWithModule");
  assert.equal(
    (nav.match(/businessTypes: \[/g) ?? []).length,
    0,
    "masih ada businessTypes yang di-hardcode di navigation.ts"
  );
  const filtered = navigationSections
    .flatMap((s) => s.items)
    .filter((i) => i.businessTypes);
  assert.equal(filtered.length, 4);
  const byHref = new Map(filtered.map((i) => [i.href, i.businessTypes]));
  assert.deepEqual(byHref.get("/tables"), typesWithModule("tables"));
  assert.deepEqual(byHref.get("/kds"), typesWithModule("kds"));
  assert.deepEqual(byHref.get("/catering"), typesWithModule("catering"));
  assert.deepEqual(byHref.get("/laundry"), typesWithModule("laundry"));
});

test("halaman pendaftaran memakai katalog (semua vertikal tampil, tanpa hardcode)", () => {
  const page = readSrc("src/app/(auth)/register/page.tsx");
  assert.ok(page.includes("BUSINESS_CATEGORIES"), "register harus iterasi BUSINESS_CATEGORIES");
  assert.ok(page.includes("getModulesForType"), "register harus menampilkan preview modul");
  assert.equal(
    (page.match(/setBusinessType\("/g) ?? []).length,
    0,
    "register masih menyimpan tombol tipe usaha hardcode"
  );
  for (const key of BUSINESS_TYPE_KEYS) {
    assert.ok(
      !page.includes(`"${key}"`),
      `register masih menuliskan tipe ${key} secara literal`
    );
  }
});

test("provisioning platform memakai katalog dan label manusiawi", () => {
  const page = readSrc("src/app/(dashboard)/platform/owners/page.tsx");
  assert.ok(page.includes("BUSINESS_CATEGORIES"));
  assert.ok(page.includes("getBusinessTypeLabel"));
  assert.ok(!page.includes("BIZ_OPTIONS"), "BIZ_OPTIONS lama harus sudah dihapus");
});

test("validator platform mengambil enum dari katalog (anti drift)", () => {
  const validator = readSrc("src/lib/validators/platform.ts");
  assert.ok(validator.includes("BUSINESS_TYPE_KEYS"));
  assert.ok(!validator.includes('enum([\n          "RETAIL"'));
});

test("jalur demo self-serve (form + API) memakai katalog, tanpa tipe legacy", () => {
  const page = readSrc("src/app/demo/page.tsx");
  assert.ok(page.includes("BUSINESS_CATEGORIES"), "form demo harus iterasi katalog");
  assert.ok(page.includes("DEFAULT_BUSINESS_TYPE"));
  for (const legacy of ["FNB_RESTO", "CENTRAL_KITCHEN", '"OTHER"']) {
    assert.ok(!page.includes(legacy), `form demo masih memakai tipe legacy ${legacy}`);
  }
  const route = readSrc("src/app/api/demo-requests/route.ts");
  assert.ok(route.includes("BUSINESS_TYPE_KEYS"), "API demo-requests harus memvalidasi enum katalog");
  assert.ok(route.includes("getBusinessTypeLabel"));
  assert.ok(!route.includes("typeLabelMap"), "typeLabelMap lama harus diganti katalog");
});

test("isBusinessType & getBusinessTypeLabel aman untuk data lama/tak dikenal", () => {
  for (const key of BUSINESS_TYPE_KEYS) assert.ok(isBusinessType(key));
  for (const bad of ["FNB_RESTO", "CENTRAL_KITCHEN", "", "fnb_cafe", null, undefined, 42, {}]) {
    assert.equal(isBusinessType(bad), false);
  }
  assert.equal(getBusinessTypeLabel("FNB_CAFE"), "Kafe & Coffee Shop");
  assert.equal(getBusinessTypeLabel("LEGACY_TYPE"), "LEGACY_TYPE");
});

test("katalog bersih dari stub dan memuat seluruh tipe schema", () => {
  const src = readSrc("src/lib/business-catalog.ts");
  assert.ok(!/TODO|FIXME|stub/i.test(src), "katalog masih memuat TODO/FIXME/stub");
  assert.equal(Object.keys(BUSINESS_PROFILES).length, BUSINESS_TYPE_KEYS.length);
});

test("gerbang vertikal mengenali rute halaman & API modul spesifik-vertikal", () => {
  const keysFor = (p: string) => getGatingModulesForRoute(p).map((m) => m.key);
  assert.deepEqual(keysFor("/catering"), ["catering"]);
  assert.deepEqual(keysFor("/catering/abc"), ["catering"]);
  assert.deepEqual(keysFor("/tables"), ["tables"]);
  assert.deepEqual(keysFor("/kds"), ["kds"]);
  assert.deepEqual(keysFor("/laundry"), ["laundry"]);
  assert.deepEqual(keysFor("/api/tables"), ["tables"]);
  assert.deepEqual(keysFor("/api/kds"), ["kds"]);
  assert.deepEqual(keysFor("/api/laundry/jobs"), ["laundry"]);
  assert.deepEqual(keysFor("/api/sales/abc123/catering-status"), ["catering"]);
  assert.deepEqual(keysFor("/api/sales/abc123/catering-payment"), ["catering"]);
  // Rute universal & rute asing tidak pernah menjadi gerbang vertikal.
  for (const p of ["/dashboard", "/pos", "/products", "/reports", "/api/products", "/api/sales", "/api/health", "/x"]) {
    assert.deepEqual(keysFor(p), [], `${p} seharusnya tanpa gerbang vertikal`);
  }
});

test("setiap modul vertikal mengklaim permukaan API-nya (halaman + API sama-sama dijaga)", () => {
  for (const key of MODULE_KEYS) {
    const m = MODULES[key];
    if (m.universal) continue;
    assert.ok(
      (m.apiPaths && m.apiPaths.length > 0) || m.routePattern,
      `modul ${key} tidak mengklaim rute API (apiPaths/routePattern)`
    );
    for (const apiPath of m.apiPaths ?? []) {
      assert.ok(apiPath.startsWith("/api/"), `modul ${key}: apiPath ${apiPath} tidak diawali /api/`);
    }
  }
});

test("keputusan akses vertikal: tolak modul yang tidak dimiliki toko, izinkan selebihnya", () => {
  // CATERING: punya katering & KDS, tidak punya meja QR / laundry.
  assert.equal(isRouteAvailableForBusinessType("/catering", "CATERING"), true);
  assert.equal(isRouteAvailableForBusinessType("/kds", "CATERING"), true);
  assert.equal(isRouteAvailableForBusinessType("/tables", "CATERING"), false);
  assert.equal(isRouteAvailableForBusinessType("/laundry", "CATERING"), false);
  // LAUNDRY (jasa cuci): hanya laundry di antara modul vertikal.
  assert.equal(isRouteAvailableForBusinessType("/laundry", "LAUNDRY"), true);
  assert.equal(isRouteAvailableForBusinessType("/api/laundry/jobs", "LAUNDRY"), true);
  assert.equal(isRouteAvailableForBusinessType("/tables", "LAUNDRY"), false);
  assert.equal(isRouteAvailableForBusinessType("/catering", "LAUNDRY"), false);
  // SERVICE (salon/bengkel) tidak lagi memakai modul cuci.
  assert.equal(isRouteAvailableForBusinessType("/laundry", "SERVICE"), false);
  assert.equal(isRouteAvailableForBusinessType("/api/laundry/jobs", "SERVICE"), false);
  assert.equal(isRouteAvailableForBusinessType("/tables", "SERVICE"), false);
  assert.equal(isRouteAvailableForBusinessType("/catering", "SERVICE"), false);
  assert.equal(isRouteAvailableForBusinessType("/api/sales/s1/catering-status", "SERVICE"), false);
  // Ritel: seluruh modul vertikal tertutup, modul universal tetap terbuka.
  for (const p of ["/tables", "/kds", "/catering", "/laundry"]) {
    assert.equal(isRouteAvailableForBusinessType(p, "RETAIL"), false, `RETAIL masih bisa ${p}`);
  }
  assert.equal(isRouteAvailableForBusinessType("/pos", "RETAIL"), true);
  // Tanpa info vertikal (SUPER_ADMIN / cookie lama) → jangan mengunci (gerbang peran tetap ada).
  for (const p of ["/tables", "/catering", "/laundry"]) {
    assert.equal(isRouteAvailableForBusinessType(p, null), true);
    assert.equal(isRouteAvailableForBusinessType(p, undefined), true);
    assert.equal(isRouteAvailableForBusinessType(p, "LEGACY_UNKNOWN"), true);
  }
});

test("middleware (proxy.ts) menegakkan gerbang vertikal dari katalog, bukan daftar hardcode", () => {
  const proxy = readSrc("src/proxy.ts");
  assert.ok(
    proxy.includes("isRouteAvailableForBusinessType"),
    "proxy.ts tidak memakai gerbang vertikal katalog"
  );
  assert.ok(
    proxy.includes("store: { select: { businessType: true } }"),
    "businessType harus diambil authoritative dari DB, bukan cookie"
  );
  assert.ok(!/businessType === "/.test(proxy), "proxy.ts masih membandingkan businessType literal");
  assert.ok(
    !proxy.includes('"CATERING"') && !proxy.includes('"SERVICE"'),
    "proxy.ts masih memuat tipe usaha hardcode"
  );
});
