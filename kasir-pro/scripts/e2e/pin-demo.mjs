// Hitung PIN supervisor demo secara deterministik — identik dengan demoPin()
// di prisma/seed-demo-clusters.js dan src/lib/demo-seeder.ts.
// Pemakaian:
//   KADAI_DEMO_PIN_SECRET=<secret> node scripts/e2e/pin-demo.mjs manager.resto@kadai.com
import { createHmac } from "node:crypto";

const email = process.argv[2];
const secret = process.env.KADAI_DEMO_PIN_SECRET;
if (!email || !secret) {
  console.error("Pemakaian: KADAI_DEMO_PIN_SECRET=<secret> node scripts/e2e/pin-demo.mjs <email>");
  process.exit(1);
}
const pin = String(
  parseInt(createHmac("sha256", secret).update(email).digest("hex").slice(0, 12), 16) % 1000000
).padStart(6, "0");
process.stdout.write(pin);
