/**
 * create-superadmin.js — Bootstrap/repair akun SUPER_ADMIN platform KADAI di produksi.
 *
 * Pemakaian:
 *   node scripts/create-superadmin.js --email superadmin@kadai.com --password '<rahasia>' [--name 'Nama']
 *   atau via env: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
 *
 * Aman: tidak pernah mencetak password; akun dibuat dengan role SUPER_ADMIN.
 * Idempoten: jika email sudah ada, role dipastikan SUPER_ADMIN + isActive=true.
 * (Password tidak diubah bila akun sudah ada tanpa flag --reset-password.)
 */
const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--")) {
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
      args[key.slice(2)] = value;
      if (value !== "true") i++;
    }
  }
  return args;
}

async function main() {
  const flags = parseArgs(process.argv);

  const email = flags.email || process.env.SUPERADMIN_EMAIL;
  const password = flags.password || process.env.SUPERADMIN_PASSWORD;
  const name = flags.name || process.env.SUPERADMIN_NAME || "Super Admin Kadai";
  const resetPassword = flags["reset-password"] === "true";

  if (!email) {
    console.error("Wajib: --email <email> (atau env SUPERADMIN_EMAIL)");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Email tidak valid:", email);
    process.exit(1);
  }
  if (!password) {
    console.error("Wajib: --password <password> (atau env SUPERADMIN_PASSWORD)");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password minimal 12 karakter.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing && !resetPassword) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.SUPER_ADMIN, isActive: true, name },
    });
    console.log(`SUPER_ADMIN dipastikan: ${email} (role diperbarui, password dipertahankan).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.SUPER_ADMIN, isActive: true, name, passwordHash },
    });
    console.log(`SUPER_ADMIN diperbarui (password di-reset): ${email}`);
  } else {
    await prisma.user.create({
      data: { name, email, passwordHash, role: UserRole.SUPER_ADMIN, isActive: true },
    });
    console.log(`SUPER_ADMIN dibuat: ${email}`);
  }

  console.log("Selesai. Gunakan kredensial tersebut untuk login ke /platform.");
}

main()
  .catch((error) => {
    console.error("Gagal:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
