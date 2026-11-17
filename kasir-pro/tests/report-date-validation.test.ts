import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const route = readFileSync(path.join(root, "src/app/api/reports/route.ts"), "utf8");

test("format tanggal laporan divalidasi sebelum perbandingan urutan", () => {
  // Pembandingan string membuat tanggal ngawur ("kemarin") dilaporkan sebagai
  // "tanggal mulai melebihi tanggal akhir" - pesan yang menyesatkan.
  const iFormat = route.indexOf("Format tanggal laporan tidak valid (YYYY-MM-DD)");
  const iUrutan = route.indexOf("Tanggal mulai tidak boleh melebihi tanggal akhir");
  assert.ok(iFormat > 0, "pesan format tanggal belum ada");
  assert.ok(iUrutan > 0);
  assert.ok(iFormat < iUrutan, "cek format harus mendahului cek urutan tanggal");
  assert.match(route, /const DATE_ONLY = \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\//);
});