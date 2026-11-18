import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { evaluateVoidGuard, resolveShiftCoveringSale } from "../src/lib/void-policy";

const repoRoot = path.join(import.meta.dirname, "..");

test("void di laci yang masih terbuka bukan koreksi susulan", () => {
  const d = evaluateVoidGuard({ shiftStatus: "OPEN", isSupervisor: false });
  assert.equal(d.allowed, true);
  assert.equal(d.isLateVoid, false);
});

test("transaksi tanpa laci tidak dianggap koreksi susulan", () => {
  const d = evaluateVoidGuard({ shiftStatus: null, isSupervisor: false });
  assert.equal(d.allowed, true);
  assert.equal(d.isLateVoid, false);
});

test("kasir tidak boleh membatalkan transaksi dari laci yang sudah ditutup", () => {
  const d = evaluateVoidGuard({ shiftStatus: "CLOSED", isSupervisor: false });
  assert.equal(d.allowed, false);
  assert.equal(d.isLateVoid, true);
  assert.equal(d.code, "VOID_REQUIRES_SUPERVISOR_AFTER_SHIFT_CLOSED");
  assert.match(d.message ?? "", /Manager\/Admin/);
});

test("manager/admin boleh, tetapi tetap ditandai sebagai koreksi susulan", () => {
  const d = evaluateVoidGuard({ shiftStatus: "CLOSED", isSupervisor: true });
  assert.equal(d.allowed, true);
  assert.equal(d.isLateVoid, true);
});

test("alasan koreksi susulan wajib benar-benar menjelaskan", () => {
  const schema = readFileSync(path.join(repoRoot, "src/lib/validators/sale.ts"), "utf8");
  const block = schema.slice(schema.indexOf("voidSaleAfterCloseSchema"));

  assert.match(block, /min\(15/);
});

test("rute void menegakkan aturan koreksi susulan di dalam transaksi", () => {
  const route = readFileSync(
    path.join(repoRoot, "src/app/api/sales/[id]/void/route.ts"),
    "utf8"
  );

  assert.match(route, /evaluateVoidGuard\(/);
  assert.match(route, /voidSaleAfterCloseSchema\.safeParse/);
  assert.match(route, /VOID_AFTER_CLOSE_REASON_REQUIRED/);
  // Penanda laci harus di dalam transaksi pembatalan yang sama.
  assert.match(route, /prisma\.\$transaction\(async \(tx\) => \{[\s\S]*markShiftLateVoid\(tx,/);
  // shift wajib ikut diambil bersama transaksi.
  assert.match(route, /shift: \{ select: \{ id: true, status: true \} \}/);
});

test("laci menyimpan jejak koreksi susulan di skema dan migrasi", () => {
  const schema = readFileSync(path.join(repoRoot, "prisma/schema.prisma"), "utf8");
  const migration = path.join(
    repoRoot,
    "prisma/migrations/20261118170000_cash_shift_late_void/migration.sql"
  );

  assert.match(schema, /lateVoidCount\s+Int\s+@default\(0\)/);
  assert.match(schema, /lastLateVoidAt\s+DateTime\?/);
  assert.ok(existsSync(migration), "migrasi penanda koreksi susulan wajib ada");

  const sql = readFileSync(migration, "utf8");
  assert.match(sql, /ADD COLUMN "lateVoidCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /ADD COLUMN "lastLateVoidAt" TIMESTAMP\(3\)/);
});

test("laci dicari lewat rentang waktu bila transaksi belum menempel ke laci", async () => {
  const sale = {
    storeId: "store-1",
    cashierId: "kasir-1",
    createdAt: new Date("2026-11-18T03:00:00.000Z"),
  };
  let dipanggil = 0;
  let arg: any = null;
  const db = {
    cashShift: {
      findFirst: async (a: unknown) => {
        dipanggil += 1;
        arg = a;
        return { id: "shift-1", status: "CLOSED" };
      },
    },
  } as never;

  const hasil = await resolveShiftCoveringSale(db, sale);
  assert.equal(hasil?.status, "CLOSED");
  assert.equal(dipanggil, 1);
  assert.equal(arg.where.storeId, "store-1");
  assert.equal(arg.where.cashierId, "kasir-1");
  assert.equal(arg.where.openedAt.lte, sale.createdAt);
  // Laci yang belum ditutup juga sah mencakup transaksi.
  assert.ok(
    arg.where.OR.some((c: any) => c.closedAt === null),
    "laci yang masih terbuka harus ikut dipertimbangkan"
  );
  assert.ok(
    arg.where.OR.some((c: any) => c.closedAt?.gte instanceof Date),
    "laci yang ditutup setelah transaksi harus ikut dipertimbangkan"
  );
});

test("transaksi tanpa toko atau kasir tidak menebak laci", async () => {
  let dipanggil = 0;
  const db = {
    cashShift: {
      findFirst: async () => {
        dipanggil += 1;
        return null;
      },
    },
  } as never;

  const hasil = await resolveShiftCoveringSale(db, {
    storeId: null,
    cashierId: null,
    createdAt: new Date(),
  });
  assert.equal(hasil, null);
  assert.equal(dipanggil, 0);
});

test("laci dibuka di cabang yang sama dengan transaksi", () => {
  const shiftRoute = readFileSync(
    path.join(repoRoot, "src/app/api/pos/shifts/route.ts"),
    "utf8"
  );
  const saleRoute = readFileSync(path.join(repoRoot, "src/app/api/sales/route.ts"), "utf8");
  const resolver = readFileSync(path.join(repoRoot, "src/lib/outlet-resolution.ts"), "utf8");

  // Satu sumber kebenaran untuk cabang, dipakai penjualan dan laci.
  assert.match(saleRoute, /resolveDefaultOutletId\(tx,/);
  assert.match(shiftRoute, /resolveDefaultOutletId\(prisma,/);
  assert.match(resolver, /isMain: true, isActive: true, storeId/);

  // Penjualan tetap menempel ke laci tingkat toko (outletId kosong) milik kasir.
  assert.match(saleRoute, /OR: \[\{ outletId: effectiveOutletId \}, \{ outletId: null \}\]/);
});

test("cetak ulang Z-Report tertutup tetap menampilkan koreksi susulan", () => {
  const route = readFileSync(
    path.join(repoRoot, "src/app/api/pos/shifts/[id]/route.ts"),
    "utf8"
  );

  // Snapshot angka tetap dibekukan, hanya penanda koreksi yang ditempel.
  assert.match(route, /const snapshot = shift\.reportJson as unknown as ShiftReport/);
  assert.match(route, /lateVoidCount: shift\.lateVoidCount/);
  assert.match(route, /lastLateVoidAt: shift\.lastLateVoidAt/);
});

test("riwayat shift dan cetak ulang Z-Report menampilkan koreksi susulan", () => {
  const history = readFileSync(
    path.join(repoRoot, "src/app/api/pos/shifts/history/route.ts"),
    "utf8"
  );
  const page = readFileSync(
    path.join(repoRoot, "src/app/(dashboard)/shifts/page.tsx"),
    "utf8"
  );

  assert.match(history, /lateVoidCount: true/);
  assert.match(page, /koreksi susulan/i);
  assert.match(page, /Koreksi susulan/);
});