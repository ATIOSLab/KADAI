#!/bin/sh
set -eu

node ./docker/wait-for-db.cjs

echo "Applying Prisma schema (versioned, non-destructive)..."
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  # Baseline database produksi yang sudah ada sekali saja (tandai 0_baseline sebagai
  # 'applied' tanpa menjalankan ulang SQL-nya), lalu terapkan HANYA migrasi berversi.
  # Tidak pernah drop kolom/tabel secara otomatis.
  npx prisma migrate resolve --applied 0_baseline >/dev/null 2>&1 || true
  npx prisma migrate deploy
else
  # Belum ada migrasi berversi: bootstrap aman (gagal keras alih-alih menghapus data).
  npx prisma db push --skip-generate
fi

echo "Running multi-vertical demo clusters seed..."
node prisma/seed-demo-clusters.js || echo "Demo seed completed with warnings/skipped"

if [ "${RUN_SEED_ON_START:-false}" = "true" ] || [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "RUN_SEED_ON_START=true -> running minimal seed"
  npm run db:seed
fi

if [ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ] && [ -n "${APP_BASE_URL:-}" ]; then
  echo "Syncing Telegram webhook..."
  npm run bot:webhook:sync || echo "Telegram webhook sync skipped/failed; app will continue."
fi

exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
