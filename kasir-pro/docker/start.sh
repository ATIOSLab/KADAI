#!/bin/sh
set -eu

node ./docker/wait-for-db.cjs

echo "Applying Prisma schema..."
npx prisma db push --accept-data-loss

if [ "${RUN_SEED_ON_START:-false}" = "true" ] || [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "RUN_SEED_ON_START=true -> running minimal seed"
  npm run db:seed
fi

if [ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ] && [ -n "${APP_BASE_URL:-}" ]; then
  echo "Syncing Telegram webhook..."
  npm run bot:webhook:sync || echo "Telegram webhook sync skipped/failed; app will continue."
fi

exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
