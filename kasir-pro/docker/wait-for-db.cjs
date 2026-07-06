const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const maxAttempts = Number(process.env.DB_WAIT_MAX_ATTEMPTS || 30);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection is ready");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `Waiting for database (${attempt}/${maxAttempts}): ${message}`
      );

      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(delayMs);
    }
  }
}

main()
  .catch((error) => {
    console.error("Database readiness check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
