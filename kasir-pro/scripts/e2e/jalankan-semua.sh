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

# Cari interpreter Python 3 yang benar-benar jalan. Di Windows, 'python' sering
# menunjuk alias Microsoft Store yang hanya mencetak "Python was not found".
BIN=""
for c in "${PYTHON:-}" python3 python py; do
  [ -z "$c" ] && continue
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)' >/dev/null 2>&1; then
    BIN="$c"
    break
  fi
done
if [ -z "$BIN" ]; then
  echo "Python 3 tidak ditemukan. Set PYTHON=/path/ke/python3 lalu ulangi."
  exit 2
fi
echo "python: $BIN ($("$BIN" -V 2>&1))"

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