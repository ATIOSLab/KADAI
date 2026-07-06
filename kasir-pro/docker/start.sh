#!/bin/sh
set -eu

node ./docker/wait-for-db.cjs

echo "Applying Prisma schema..."

if [ "${RESET_DB_ON_START:-false}" = "true" ]; then
  echo "RESET_DB_ON_START=true -> resetting database schema"
  npx prisma db push --force-reset
elif [ -d "prisma/migrations" ] && [ "$(find prisma/migrations -mindepth 1 -maxdepth 1 | wc -l)" -gt 0 ]; then
  echo "Applying Prisma migrations with prisma migrate deploy..."
  npm run db:migrate:deploy
else
  echo "No Prisma migrations found -> falling back to prisma db push"
  npx prisma db push
fi

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
  echo "RUN_SEED_ON_START=true -> running minimal seed"
  npm run db:seed
fi

if [ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ] && [ -n "${APP_BASE_URL:-}" ]; then
  echo "Syncing Telegram webhook..."
  npm run bot:webhook:sync || echo "Telegram webhook sync skipped/failed; app will continue."
fi

exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
