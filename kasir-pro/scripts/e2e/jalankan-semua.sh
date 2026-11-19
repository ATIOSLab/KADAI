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

LOG_DIR="${E2E_LOG_DIR:-scripts/e2e/.logs/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$LOG_DIR"
echo "log: $LOG_DIR (base $KADAI_BASE)"

GAGAL=0
FLAKY=()

jalankan_suite() {  # $1 = nama suite, $2 = berkas log
  local s="$1" log="$2"
  echo "==== $s"
  $BIN "scripts/e2e/$s.py" 2>&1 | tee "$log"
  return "${PIPESTATUS[0]}"
}

for s in regresi-siklus-kas regresi-bukti-bayar regresi-pin-supervisor regresi-master-data regresi-rute-api; do
  log="$LOG_DIR/$s.log"
  if ! jalankan_suite "$s" "$log"; then
    echo "---- $s gagal; ulang sekali (gangguan transien?). Log pertama: $log"
    sleep 3
    log2="$LOG_DIR/$s.retry.log"
    if jalankan_suite "$s" "$log2"; then
      echo "---- $s LULUS pada percobaan kedua — FLAKY, bukan regresi kode"
      FLAKY+=("$s")
    else
      echo "---- $s gagal DUA KALI — regresi nyata. Log: $log2"
      GAGAL=1
    fi
  fi
done

echo
if [ "${#FLAKY[@]}" -gt 0 ]; then
  echo "FLAKY (lulus setelah diulang): ${FLAKY[*]}"
fi
if [ "$GAGAL" -eq 0 ]; then
  echo "SELURUH REGRESI E2E LULUS ($KADAI_BASE)"
else
  echo "ADA REGRESI E2E GAGAL ($KADAI_BASE) — lihat $LOG_DIR"
fi
exit $GAGAL