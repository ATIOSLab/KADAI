#!/usr/bin/env bash
# Jalankan seluruh regresi e2e KADAI terhadap satu base URL.
#
# Pemakaian:
#   export KADAI_BASE=https://kadai.asia
#   export KADAI_TOKEN_MANAGER="<cookie sesi manager>"
#   export KADAI_TOKEN_KASIR="<cookie sesi kasir>"
#   export KADAI_CRON_SECRET="<rahasia cron produksi>"
#   export KADAI_PIN=888222            # PIN supervisor tenant uji
#   bash scripts/e2e/jalankan-semua.sh
#
# Tanpa KADAI_CRON_SECRET uji cron hanya relevan untuk server lokal; tanpa
# KADAI_PIN, uji PIN memakai nilai default seed.
set -uo pipefail

cd "$(dirname "$0")/../.."
BIN=python3
command -v python3 >/dev/null 2>&1 || BIN=python

GAGAL=0
for s in regresi-siklus-kas regresi-bukti-bayar regresi-pin-supervisor regresi-master-data regresi-rute-api; do
  echo "==== $s"
  if ! $BIN "scripts/e2e/$s.py"; then
    GAGAL=1
  fi
done

echo
if [ "$GAGAL" -eq 0 ]; then
  echo "SELURUH REGRESI E2E LULUS ($KADAI_BASE)"
else
  echo "ADA REGRESI E2E GAGAL ($KADAI_BASE)"
fi
exit $GAGAL