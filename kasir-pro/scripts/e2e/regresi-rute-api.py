#!/usr/bin/env python3
"""Sapuan rute API KADAI.

Menemukan seluruh `src/app/api/**/route.ts`, lalu memanggil setiap rute dengan
GET:

1. tanpa sesi  -> harus ditolak (401/403/307/404/405), tidak boleh 200 berisi data
2. sesi manager -> tidak boleh ada 5xx dan tidak boleh 401 (sesi harus sah)

Rute publik yang memang boleh diakses tanpa sesi ada di ALLOW_ANON.

Pemakaian:
    export KADAI_BASE=https://kadai.asia
    export KADAI_TOKEN_MANAGER="<cookie session manager>"
    python scripts/e2e/regresi-rute-api.py            # cari rute dari repo
    python scripts/e2e/regresi-rute-api.py daftar.txt # atau pakai daftar rute

Keluar dengan kode 1 bila ada pelanggaran.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE = os.environ.get("KADAI_BASE", "http://localhost:3000").rstrip("/")
UA = os.environ.get(
    "KADAI_UA",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
)
TOK_MGR = os.environ.get("KADAI_TOKEN_MANAGER", "")

# Rute yang memang publik (health check & katalog paket untuk halaman harga).
ALLOW_ANON = {"/api/health", "/api/public/plans"}
# Rute webhook/cron punya autentikasi sendiri (shared secret), bukan cookie.
SHARED_SECRET_PREFIX = ("/api/cron/", "/api/webhooks/", "/api/payments/callback",
                        "/api/admin/seed-demo", "/api/bot")

AKAR = Path(__file__).resolve().parents[2]
API_DIR = AKAR / "src" / "app" / "api"

HASIL = []


def catat(nama, lulus, detail=""):
    HASIL.append((nama, lulus, detail))
    print(f"{'LULUS' if lulus else 'GAGAL'}  {nama}{(' — ' + detail) if detail else ''}")


def temukan_rute():
    if len(sys.argv) > 1:
        return [b.strip() for b in Path(sys.argv[1]).read_text().splitlines() if b.strip()]
    if not API_DIR.is_dir():
        raise SystemExit(f"direktori rute tidak ditemukan: {API_DIR}")
    rute = []
    for f in API_DIR.rglob("route.ts"):
        rel = f.parent.relative_to(API_DIR).as_posix()
        rute.append("/api" + ("" if rel == "." else "/" + rel))
    return sorted(rute)


def normalisasi(rute):
    """Ganti segmen dinamis [id] dengan nilai contoh supaya bisa dipanggil."""
    return re.sub(r"\[[^\]]+\]", "cm0000000000000000000000", rute)


def panggil(rute, token=None):
    h = {"User-Agent": UA, "Accept": "application/json", "Origin": BASE}
    if token:
        h["Cookie"] = f"session={token}"
    req = urllib.request.Request(BASE + rute, headers=h, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read(4000).decode("utf-8", "replace"), r.url
    except urllib.error.HTTPError as e:
        return e.code, e.read(4000).decode("utf-8", "replace"), e.url
    except Exception as e:  # noqa: BLE001 - koneksi/timeout
        return 0, str(e), ""


def main():
    rute = temukan_rute()
    if not rute:
        raise SystemExit("tidak ada rute untuk diuji")
    dinamis = [r for r in rute if "[" in r]
    statis = [r for r in rute if "[" not in r]
    print(f"BASE={BASE} rute={len(rute)} (statis {len(statis)}, dinamis {len(dinamis)})")
    if not TOK_MGR:
        raise SystemExit("KADAI_TOKEN_MANAGER wajib untuk uji rute dengan sesi")

    bocor, galat, tolak = [], [], 0
    for r in statis:
        st, body, _ = panggil(r)
        if r in ALLOW_ANON:
            catat(f"anon {r} publik sesuai desain", st == 200, f"HTTP {st}")
            continue
        if any(r.startswith(p) for p in SHARED_SECRET_PREFIX):
            tolak += 1
            continue
        if st == 200:
            bocor.append(r)
            catat(f"anon {r} TIDAK membocorkan data", False, f"HTTP 200 {body[:80]}")
        else:
            tolak += 1
    print(f"  anon: {tolak} rute tertutup, {len(bocor)} bocor, {len(rute) - len(statis)} dinamis dilewati")
    catat(f"anon ditolak di {tolak} rute non-publik (0 bocor)", not bocor,
          "; ".join(bocor[:3]))

    for r in rute:
        st, body, _ = panggil(normalisasi(r), TOK_MGR)
        if st >= 500:
            galat.append(f"{r} HTTP {st}")
        elif st == 401:
            galat.append(f"{r} HTTP 401 sesi ditolak")
    print(f"  manager: {len(rute)} rute diuji, {len(galat)} bermasalah")
    catat(f"sesi manager diterima di {len(rute)} rute & tanpa 5xx", not galat,
          "; ".join(galat[:3]))

    lulus = sum(1 for _, ok, _ in HASIL if ok)
    print(f"RINGKASAN: {lulus}/{len(HASIL)} lulus")
    if lulus != len(HASIL):
        print("  gagal: " + "; ".join(f"{n} [{d}]" for n, ok, d in HASIL if not ok))
        sys.exit(1)


if __name__ == "__main__":
    main()