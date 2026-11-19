#!/usr/bin/env bash
# Mint ulang sesi manager & kasir tenant demo di produksi, lalu simpan sebagai
# file token lokal (jangan di-commit). Token KADAI hanya berlaku 2 jam dan mati
# bila baris user berubah — panggil skrip ini sebelum tiap batch e2e.
#
# Kebutuhan: SSH ke host produksi (rezdevops@148.230.98.12) dengan key tanpa
# password, dan nama container app yang sedang berjalan.
#
# Pemakaian:
#   bash scripts/e2e/mint-produksi.sh manager.resto@kadai.asia kasir.resto@kadai.asia
#   export KADAI_TOKEN_MANAGER=$(cat scripts/e2e/.token-manager.txt)
#   export KADAI_TOKEN_KASIR=$(cat scripts/e2e/.token-kasir.txt)
set -euo pipefail

HOST="${KADAI_SSH_HOST:-rezdevops@148.230.98.12}"
CONTAINER="${KADAI_APP_CONTAINER:-netkrida-app-kadai-lambvr-app-1}"
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$#" -lt 2 ]; then
  echo "pemakaian: $0 <email-manager> <email-kasir>"
  exit 2
fi

# Pastikan skrip mint ada di dalam container (image lama belum memuatnya).
scp -q "$DIR/mint-sesi.mjs" "$HOST:/tmp/mint-sesi.mjs"
ssh "$HOST" "docker cp /tmp/mint-sesi.mjs $CONTAINER:/app/scripts/e2e/mint-sesi.mjs >/dev/null 2>&1 || (docker exec $CONTAINER mkdir -p /app/scripts/e2e && docker cp /tmp/mint-sesi.mjs $CONTAINER:/app/scripts/e2e/mint-sesi.mjs)"

for spec in "$1:manager" "$2:kasir"; do
  EMAIL="${spec%:*}"
  ROLE="${spec##*:}"
  ssh "$HOST" "docker exec -w /app $CONTAINER node scripts/e2e/mint-sesi.mjs '$EMAIL' > /tmp/tok-$ROLE.txt"
  scp -q "$HOST:/tmp/tok-$ROLE.txt" "$DIR/.token-$ROLE.txt"
  tr -d '\r\n' < "$DIR/.token-$ROLE.txt" > "$DIR/.token-$ROLE.clean"
  mv "$DIR/.token-$ROLE.clean" "$DIR/.token-$ROLE.txt"
done

echo "token ditulis: $DIR/.token-manager.txt, $DIR/.token-kasir.txt"