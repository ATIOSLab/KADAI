// Mint cookie sesi KADAI untuk pengujian e2e, tanpa perlu password akun.
//
// Cookie `session` = base64url(payload) + "." + HMAC-SHA256(payload, BETTER_AUTH_SECRET)
// sehingga hanya bisa dibuat oleh pemegang secret tersebut. Payload memuat
// `version` = users.updatedAt; `src/proxy.ts` membandingkannya ke database setiap
// request, jadi setiap perubahan baris user otomatis membatalkan token lama.
//
// Pakai (dari dalam container app, tempat @prisma/client + env tersedia):
//   docker exec -w /app <container> node scripts/e2e/mint-sesi.mjs manager.resto@kadai.asia
//
// Atau dari host dengan DATABASE_URL + BETTER_AUTH_SECRET diekspor:
//   node --experimental-strip-types scripts/e2e/mint-sesi.mjs kasir.resto@kadai.asia
//
// Token berlaku 2 jam (7200 detik).
import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";

const email = process.argv[2];
if (!email) {
  console.error("pemakaian: node scripts/e2e/mint-sesi.mjs <email>");
  process.exit(2);
}
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  console.error("BETTER_AUTH_SECRET tidak ada di environment");
  process.exit(2);
}

const prisma = new PrismaClient();
const u = await prisma.user.findUnique({ where: { email }, include: { store: true } });
if (!u) {
  console.error("akun tidak ditemukan:", email);
  process.exit(1);
}
if (!u.isActive) {
  console.error("akun nonaktif, sesi akan ditolak:", email);
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const body = Buffer.from(
  JSON.stringify({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    version: u.updatedAt.toISOString(),
    storeId: u.storeId ?? u.store?.id ?? undefined,
    storeName: u.store?.name,
    iat: now,
    exp: now + 7200,
  }),
).toString("base64url");
const sig = createHmac("sha256", secret).update(body).digest("base64url");
process.stdout.write(`${body}.${sig}`);
await prisma.$disconnect();