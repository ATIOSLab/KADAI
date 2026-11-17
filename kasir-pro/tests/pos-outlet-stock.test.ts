import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const productsRoute = read("src/app/api/products/route.ts");
const sessionRoute = read("src/app/api/auth/session/route.ts");
const sessionLib = read("src/lib/session.ts");
const posPage = read("src/app/(pos)/pos/page.tsx");
const search = read("src/components/pos/product-search.tsx");

test("katalog bisa diminta per cabang, dan cabang divalidasi milik tenant", () => {
  // Layar kasir menampilkan stok & harga FIFO. Tanpa filter cabang, kasir
  // cabang PIK melihat dan memakai harga/stok cabang Menteng.
  assert.match(productsRoute, /const outletIdParam = searchParams\.get\("outletId"\)/);
  assert.match(
    productsRoute,
    /prisma\.outlet\.findFirst\(\{\s*where: \{ id: outletIdParam, storeId: scope\.storeId \}/
  );
  assert.match(productsRoute, /\.\.\.\(outletFilter \? \{ outletId: outletFilter \} : \{\}\)/);
});

test("sesi menyertakan cabang pengguna untuk layar kasir", () => {
  assert.match(sessionLib, /outletId: z\.string\(\)\.nullish\(\)/);
  assert.match(sessionRoute, /select: \{ outletId: true \}/);
  assert.match(sessionRoute, /outletId: dbUser\?\.outletId \?\? null/);
});

test("layar kasir meneruskan cabang pengguna ke daftar produk", () => {
  assert.match(posPage, /<ProductSearch outletId=\{user\?\.outletId \?\? null\} \/>/);
  assert.match(search, /params\.set\("outletId", outletId\)/);
  assert.match(search, /debouncedSearch, outletId\]/);
});