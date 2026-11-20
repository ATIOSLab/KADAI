#!/usr/bin/env python3
"""Sapuan rute API KADAI.

Menemukan seluruh `src/app/api/**/route.ts`, lalu memanggil setiap rute dengan
GET:

1. tanpa sesi  -> harus ditolak (401/403/307/404/405), tidak boleh 200 berisi data
2. sesi manager -> tidak boleh ada 5xx dan tidak boleh 401 (sesi harus sah)
3. sesi kasir   -> tidak boleh ada 5xx/401, DAN status harus mengikuti gate
   peran GET aktual yang diturunkan dari kode (src/lib/rbac.ts + route.ts):
   - rute tanpa gate peran / gate memuat CASHIER  -> kasir boleh 200
   - gate mengecualikan CASHIER                   -> kasir WAJIB 403

Rute publik yang memang boleh diakses tanpa sesi ada di ALLOW_ANON.

Sapuan tambahan untuk metode tulis (POST/PUT/PATCH/DELETE) hanya jalan bila
KADAI_UJI_TULIS=1 — hanya untuk stack throwaway (ci-lokal.sh), karena body
dikirim "{}" dan handler yang lupa memvalidasi bisa menulis baris sampah:
   - anon  -> handler tidak boleh memberi 2xx (celah sesi) atau 5xx
   - kasir -> gate yang mengecualikan kasir WAJIB 403; tanpa 5xx/401

Pemakaian:
    export KADAI_BASE=https://kadai.asia
    export KADAI_TOKEN_MANAGER="<cookie session manager>"
    export KADAI_TOKEN_KASIR="<cookie session kasir>"
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
TOK_KASIR = os.environ.get("KADAI_TOKEN_KASIR", "")

# Rute yang memang publik (health check & katalog paket untuk halaman harga).
ALLOW_ANON = {"/api/health", "/api/public/plans"}
# Endpoint auth yang memang boleh dipanggil tanpa sesi (login publik, logout
# idempoten, registrasi, kode demo kiosk).
WRITE_ANON_ALLOW = {"/api/auth/login", "/api/auth/logout", "/api/auth/register",
                    "/api/auth/verify-demo-code"}
# Rute webhook/cron punya autentikasi sendiri (shared secret), bukan cookie.
SHARED_SECRET_PREFIX = ("/api/cron/", "/api/webhooks/", "/api/payments/callback",
                        "/api/admin/seed-demo", "/api/bot")

AKAR = Path(__file__).resolve().parents[2]
API_DIR = AKAR / "src" / "app" / "api"
RBAC_FILE = AKAR / "src" / "lib" / "rbac.ts"

HASIL = []


def konstanta_peran():
    """Ekspansi konstanta peran dari src/lib/rbac.ts + src/app/api/_lib/*.ts
    -> {NAMA: [ROLE, ...]}."""
    sets = {}
    berkas = [RBAC_FILE] + sorted(API_DIR.glob("_lib/*.ts"))
    for b in berkas:
        t = b.read_text(encoding="utf-8")
        for m in re.finditer(r"export const (\w+) = \[([^\]]*)\]", t):
            nama, isi = m.group(1), m.group(2)
            peran = re.findall(r'"([A-Z_]+)"', isi)
            for ref in re.findall(r"\.\.\.(\w+)", isi):
                peran.extend(sets.get(ref, []))
            sets[nama] = list(dict.fromkeys(peran))
    return sets


SETS = konstanta_peran()


def rute_file(rute):
    rel = rute.removeprefix("/api").strip("/")
    return API_DIR / Path(rel) / "route.ts"


METODE = ("GET", "POST", "PUT", "PATCH", "DELETE")


def metode_di_rute(rute):
    """Metode HTTP yang punya handler di file route."""
    f = rute_file(rute)
    if not f.is_file():
        return []
    t = f.read_text(encoding="utf-8")
    return [m for m in METODE if re.search(rf"export async function {m}\s*\(", t)]


def peran_diizinkan(rute, metode="GET"):
    """Peran yang diizinkan handler <metode> menurut kode. None = tanpa gate."""
    f = rute_file(rute)
    if not f.is_file():
        return None
    t = f.read_text(encoding="utf-8")
    m = re.search(rf"export async function {metode}\s*\(", t)
    if not m:
        return None
    sisa = t[m.end():]
    nxt = re.search(r"\nexport (?:async function|const|default) ", sisa)
    body = sisa[: nxt.start() if nxt else len(sisa)]
    # Hanya bentuk gate `!hasRequiredRole(...)`; assignment non-gate seperti
    # `const isSupervisor = hasRequiredRole(...)` TIDAK dihitung.
    konst = set(re.findall(r"!hasRequiredRole\([^,]+,\s*([A-Z0-9_]+)\)", body))
    peran = set()
    for k in konst:
        peran.update(SETS.get(k, []))
    # Gate dengan literal inline: !hasRequiredRole(role, ["ADMIN","CASHIER"])
    for lit in re.findall(r"!hasRequiredRole\([^,]+,\s*\[([^\]]*)\]\)", body):
        peran.update(re.findall(r'"([A-Z_]+)"', lit))
    if not konst and not peran:
        return None  # tidak ada gate peran di handler ini
    return peran


def peran_diizinkan_get(rute):
    return peran_diizinkan(rute, "GET")


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


def panggil(rute, token=None, metode="GET", body=None):
    h = {"User-Agent": UA, "Accept": "application/json", "Origin": BASE}
    if token:
        h["Cookie"] = f"session={token}"
    if body is not None:
        h["Content-Type"] = "application/json"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + rute, headers=h, method=metode, data=data)
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
    for r in rute:
        if any(r.startswith(p) for p in SHARED_SECRET_PREFIX):
            continue
        st, body, _ = panggil(normalisasi(r))
        if r in ALLOW_ANON:
            catat(f"anon {r} publik sesuai desain", st == 200, f"HTTP {st}")
            continue
        if st == 200:
            bocor.append(r)
            catat(f"anon {r} TIDAK membocorkan data", False, f"HTTP 200 {body[:80]}")
        elif st >= 500:
            galat.append(f"{r} anon HTTP {st}")
        else:
            tolak += 1
    print(f"  anon: {tolak} rute tertutup, {len(bocor)} bocor, {len(galat)} 5xx "
          f"(dinamis ikut diuji dengan ID palsu)")
    catat(f"anon ditolak di {tolak} rute non-publik (0 bocor, 0 5xx)",
          not bocor and not galat, "; ".join((bocor + galat)[:3]))

    for r in rute:
        st, body, _ = panggil(normalisasi(r), TOK_MGR)
        if st >= 500:
            galat.append(f"{r} HTTP {st}")
        elif st == 401:
            galat.append(f"{r} HTTP 401 sesi ditolak")
    print(f"  manager: {len(rute)} rute diuji, {len(galat)} bermasalah")
    catat(f"sesi manager diterima di {len(rute)} rute & tanpa 5xx", not galat,
          "; ".join(galat[:3]))

    if not TOK_KASIR:
        raise SystemExit("KADAI_TOKEN_KASIR wajib untuk uji rute dengan peran kasir")
    galat_kasir, bocor_kasir, tolak_kasir = [], [], []
    harap403 = 0
    for r in rute:
        peran = peran_diizinkan_get(r)
        # None: tanpa GET / tanpa gate yang terdeteksi -> toleran (403 diizinkan,
        # mis. gate lewat tabel aturan yang belum diurai). Set memuat CASHIER:
        # kasir PASTI boleh. Set tanpa CASHIER: kasir PASTI dilarang -> wajib 403.
        pasti_boleh = peran is not None and "CASHIER" in peran
        pasti_larang = peran is not None and "CASHIER" not in peran
        if pasti_larang:
            harap403 += 1
        st, body, _ = panggil(normalisasi(r), TOK_KASIR)
        if st >= 500:
            galat_kasir.append(f"{r} HTTP {st}")
        elif st == 401:
            galat_kasir.append(f"{r} HTTP 401 sesi ditolak")
        elif pasti_larang and st != 403:
            bocor_kasir.append(f"{r} HTTP {st}")
        elif pasti_boleh and st == 403:
            tolak_kasir.append(f"{r} HTTP 403 padahal gate-nya memuat CASHIER")
    print(f"  kasir: {len(rute)} rute diuji, {len(galat_kasir)} bermasalah, "
          f"{len(bocor_kasir)} bocor RBAC, {len(tolak_kasir)} tertolak keliru, "
          f"{harap403} rute non-kasir")
    catat("sesi kasir tanpa 5xx/401 di semua rute", not galat_kasir,
          "; ".join(galat_kasir[:3]))
    catat("kasir WAJIB 403 di rute yang gate-nya mengecualikan kasir",
          not bocor_kasir, "; ".join(bocor_kasir[:3]))
    catat("kasir tidak ditolak di rute yang gate-nya memuat CASHIER", not tolak_kasir,
          "; ".join(tolak_kasir[:3]))

    if os.environ.get("KADAI_UJI_TULIS") == "1":
        if not (BASE.startswith("http://127.0.0.1") or BASE.startswith("http://localhost")):
            raise SystemExit(
                "KADAI_UJI_TULIS=1 HANYA untuk stack lokal; BASE=%s. "
                "Sapuan tulis menembak POST/PUT/PATCH/DELETE dan dilarang "
                "menyentuh apa pun selain 127.0.0.1/localhost." % BASE)
        print("  -- sapuan metode tulis (anon + kasir, body {}) --")
        galat_tulis, terbuka_tulis, bocor_tulis = [], [], []
        n_tulis = 0
        for r in rute:
            if any(r.startswith(p) for p in SHARED_SECRET_PREFIX):
                continue
            for metode in ("POST", "PUT", "PATCH", "DELETE"):
                if metode not in metode_di_rute(r):
                    continue
                n_tulis += 1
                peran = peran_diizinkan(r, metode)
                pasti_larang = peran is not None and "CASHIER" not in peran
                st_a, _, _ = panggil(normalisasi(r), None, metode, {})
                st_k, _, _ = panggil(normalisasi(r), TOK_KASIR, metode, {})
                if st_a >= 500:
                    galat_tulis.append(f"anon {metode} {r} HTTP {st_a}")
                elif 200 <= st_a < 300 and r not in WRITE_ANON_ALLOW:
                    terbuka_tulis.append(f"anon {metode} {r} HTTP {st_a}")
                if st_k >= 500:
                    galat_tulis.append(f"kasir {metode} {r} HTTP {st_k}")
                elif st_k == 401:
                    galat_tulis.append(f"kasir {metode} {r} HTTP 401 sesi ditolak")
                elif pasti_larang and st_k != 403:
                    bocor_tulis.append(f"kasir {metode} {r} HTTP {st_k}")
        print(f"  tulis: {n_tulis} handler diuji, {len(galat_tulis)} 5xx/401, "
              f"{len(terbuka_tulis)} terbuka anon, {len(bocor_tulis)} bocor peran")
        catat("tulis: anon tidak menembus handler (tanpa 2xx/5xx)",
              not terbuka_tulis and not galat_tulis,
              "; ".join((terbuka_tulis + galat_tulis)[:3]))
        catat("tulis: kasir WAJIB 403 di gate non-kasir & tanpa 5xx/401",
              not bocor_tulis and not galat_tulis,
              "; ".join((bocor_tulis + galat_tulis)[:3]))

    lulus = sum(1 for _, ok, _ in HASIL if ok)
    print(f"RINGKASAN: {lulus}/{len(HASIL)} lulus")
    if lulus != len(HASIL):
        print("  gagal: " + "; ".join(f"{n} [{d}]" for n, ok, d in HASIL if not ok))
        sys.exit(1)


if __name__ == "__main__":
    main()