#!/usr/bin/env bash
# ci-lokal.sh — Replikasi persis job `e2e` GitHub Actions (ci.yml) di mesin
# lokal memakai Postgres throwaway Docker. Jalan sebelum push untuk memastikan
# 5 suite regresi HTTP lulus terhadap stack yang identik dengan CI.
#
# Prasyarat: Docker berjalan, Node >= 22, port 55432 & 3110 bebas.
# Pemakaian:   bash scripts/e2e/ci-lokal.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 2

export DATABASE_URL="postgresql://kadai:kadai-ci@localhost:55432/kadai"
export BETTER_AUTH_SECRET="ci-better-auth-secret-0123456789abcdef0123456789"
export CRON_SECRET="ci-cron-secret-0123456789abcdef"
export ADMIN_SUPERVISOR_PIN="888222"
export ADMIN_PASSWORD="Kadai-CI-2026-seed-admin"
export SUPERADMIN_EMAIL="superadmin.ci@kadai.asia"
export SUPERADMIN_PASSWORD="Kadai-CI-2026-superadmin"

LOG="${E2E_CI_LOG:-scripts/e2e/.logs/ci-lokal-$(date +%Y%m%d-%H%M%S).log}"
mkdir -p "$(dirname "$LOG")"
exec > >(tee "$LOG") 2>&1

DB_CONTAINER="kadai-ci-verify"
NEXT_PID=""

bersihkan() {
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null
  docker rm -f "$DB_CONTAINER" >/dev/null 2>&1
  echo "== bersih-bersih selesai (log: $LOG)"
}
trap bersihkan EXIT

echo "== 1/7 siapkan Postgres throwaway (55432)"
docker rm -f "$DB_CONTAINER" >/dev/null 2>&1
docker run -d --name "$DB_CONTAINER" -e POSTGRES_USER=kadai -e POSTGRES_PASSWORD=kadai-ci -e POSTGRES_DB=kadai -p 55432:5432 postgres:16-alpine >/dev/null
for i in $(seq 1 30); do
  docker exec "$DB_CONTAINER" pg_isready -U kadai >/dev/null 2>&1 && { echo "pg siap (${i}s)"; break; }
  sleep 1
done

echo "== 2/7 migrate deploy"
npx prisma migrate deploy || exit 2

echo "== 3/7 seed inti"
npm run db:seed || exit 2

echo "== 4/7 seed klaster demo + simulasi transaksi"
npm run db:seed:demo || exit 2

echo "== 5/7 build produksi"
npx next build || exit 2

echo "== 6/7 jalankan server lokal & tunggu sehat"
npx next start -p 3110 > /tmp/kadai-next.log 2>&1 &
NEXT_PID=$!
ok=""
for i in $(seq 1 90); do
  if curl -sf http://127.0.0.1:3110/api/health >/dev/null 2>&1; then ok=1; echo "server sehat (${i}s)"; break; fi
  sleep 1
done
if [ -z "$ok" ]; then echo "server tidak sehat:"; tail -40 /tmp/kadai-next.log; exit 2; fi

echo "== 7/7 regresi e2e penuh (5 suite HTTP nyata)"
TOK_MGR="$(node --experimental-strip-types scripts/e2e/mint-sesi.mjs manager.resto@kadai.com)"
TOK_KSR="$(node --experimental-strip-types scripts/e2e/mint-sesi.mjs kasir.resto@kadai.com)"
[ -n "$TOK_MGR" ] && [ -n "$TOK_KSR" ] || { echo "mint sesi gagal — lihat /tmp/kadai-next.log"; exit 2; }
export KADAI_BASE="http://127.0.0.1:3110"
export KADAI_TOKEN_MANAGER="$TOK_MGR"
export KADAI_TOKEN_KASIR="$TOK_KSR"
export KADAI_CRON_SECRET="$CRON_SECRET"
export KADAI_PIN="888222"
bash scripts/e2e/jalankan-semua.sh
RC=$?

echo "== SELESAI RC=$RC (log: $LOG)"
exit $RC
