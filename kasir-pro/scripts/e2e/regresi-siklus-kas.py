"""Regresi putaran penuh KADAI v2 — urutan yang benar.

Fokus bukti:
  1. laci A: jual tunai -> tutup -> Z-Report (angka beku)
  2. laci B dibuka LEBIH DULU, baru koreksi susulan -> refund tunai menggerus
     kas diharapkan laci B (uang keluar dari laci yang sedang terbuka)
  3. cetak ulang Z-Report laci A: angka beku + penanda koreksi + penghitung naik
  4. penanda koreksi muncul di Z-Report, tetapi angka omzet tetap beku
"""

import json
import os
import time
import urllib.request
import urllib.error

BASE = os.environ.get("KADAI_BASE", "http://127.0.0.1:3110")
TOK_MGR = os.environ["KADAI_TOKEN_MANAGER"]
TOK_KSR = os.environ["KADAI_TOKEN_KASIR"]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

hasil = []


def sesi(tok):
    return {"Content-Type": "application/json", "Cookie": f"session={tok}", "Origin": BASE, "User-Agent": UA}


def req(method, path, body=None, tok=TOK_MGR, extra=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers={**sesi(tok), **(extra or {})}, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:200]}


def catat(nama, lulus, info=""):
    hasil.append((nama, lulus, info))
    print(("LULUS " if lulus else "GAGAL ") + nama + (f" — {info}" if info else ""))


def buka_laci(tok, modal=200000):
    st, r = req("POST", "/api/pos/shifts", {"openingCash": modal}, tok)
    return ((r.get("data") or {}).get("shift") or {}).get("id"), st


def lap(tok=TOK_MGR):
    st, r = req("GET", "/api/pos/shifts", tok=tok)
    return (r.get("data") or {}).get("currentShift") or {}


def tutup(sid, uang, tok=TOK_MGR):
    return req("POST", f"/api/pos/shifts/{sid}", {"actualCash": uang}, tok)


def jual(tok, tipe, bayar=None, nama=None, ref=None, jumlah=1, key=None, produk=None):
    body = {
        "outletId": OUT,
        "paymentType": tipe,
        "idempotencyKey": key or f"reg2-{tipe}-{time.time()}",
        "items": [{"productId": produk or PID, "productName": "Uji Regresi", "quantity": jumlah, "unitPrice": 10000}],
    }
    if bayar is not None:
        body["paidAmount"] = bayar
    if nama is not None:
        body["customerName"] = nama
    if ref is not None:
        body["paymentRef"] = ref
    return req("POST", "/api/sales", body, tok)


# --- persiapan ---
st, prod = req("GET", "/api/products?limit=1")
p = (prod.get("data") or prod.get("products") or prod.get("items") or [])[0]
st, out = req("GET", "/api/outlets")
o = (out if isinstance(out, list) else out.get("data") or out.get("outlets") or [])[0]
PID, OUT = p["id"], o["id"]
MODAL = 200000
GERINDA = "cmwm2f2fq0018s9mgpugnakqm"  # harga 385.000, dipakai untuk uji ambang bukti bayar

# tutup laci yang masih terbuka
for tok, siapa in ((TOK_MGR, "manager"), (TOK_KSR, "kasir")):
    cur = lap(tok)
    sid = (cur.get("shift") or {}).get("id")
    if sid:
        st, r = req("GET", f"/api/pos/shifts/{sid}", tok=tok)
        ec = float((r.get("data") or {}).get("shift", {}).get("expectedCash") or 0)
        st2, _ = tutup(sid, ec, tok)
        print(f"laci terbuka milik {siapa} ({sid}) ditutup -> HTTP {st2}")

# --- laci A: jual tunai, tutup ---
SHA, stA = buka_laci(TOK_MGR)
catat("buka laci A", bool(SHA) and stA in (200, 201), f"HTTP {stA}")
st, s1 = jual(TOK_MGR, "CASH", bayar=1000000)
S1 = s1.get("data", {})
TOTAL = float(S1.get("totalAmount") or 0)
catat("penjualan tunai di laci A", st in (200, 201) and TOTAL > 0, f"HTTP {st} total={TOTAL}")
SALE1 = S1.get("id")

st, cA = tutup(SHA, MODAL + TOTAL)
ZA = cA.get("data", {})
catat(
    "laci A tutup kas sesuai",
    st in (200, 201) and ZA.get("varianceStatus") == "BALANCED",
    f"HTTP {st} status={ZA.get('varianceStatus')} kas_diharapkan={ZA.get('expectedCash')}",
)
REV_BEKU = float(ZA.get("totalRevenue") or 0)
VOID_BEKU = float(ZA.get("totalVoided") or 0)
NOMOR_A = (ZA.get("shift") or {}).get("number")
catat("omzet laci A tercatat", REV_BEKU == TOTAL, f"omzet={REV_BEKU} penjualan={TOTAL} nomor={NOMOR_A}")

# --- laci B dibuka lebih dulu supaya refund punya laci ---
SHB, stB = buka_laci(TOK_MGR)
catat("buka laci B sebelum koreksi", bool(SHB) and stB in (200, 201), f"HTTP {stB}")

# --- manager: alasan terlalu pendek harus ditolak ---
st, v1 = req("POST", f"/api/sales/{SALE1}/void", {"reason": "salah"})
catat("alasan koreksi terlalu pendek ditolak", st in (400, 409) and v1.get("code") == "VOID_AFTER_CLOSE_REASON_REQUIRED",
      f"HTTP {st} {v1.get('code') or v1.get('error')}")

# --- manager: koreksi sah ---
st, v2 = req("POST", f"/api/sales/{SALE1}/void", {"reason": "pelanggan batal beli, barang dikembalikan utuh"})
catat("manager boleh koreksi susulan (dengan alasan jelas)", st in (200, 201), f"HTTP {st}")

# --- laci B: refund tunai menggerus kas diharapkan ---
st, zB = req("GET", f"/api/pos/shifts/{SHB}")
DB = zB.get("data", {})
expB = float(DB.get("expectedCash") or 0)
refundB = float(DB.get("totalCashRefunds") or 0)
catat(
    "refund tunai koreksi menggerus kas diharapkan laci B",
    abs(expB - (MODAL - TOTAL)) < 0.01 and abs(refundB - TOTAL) < 0.01,
    f"kas diharapkan={expB} (modal {MODAL} − refund {TOTAL}), total refund laci B={refundB}",
)

st, cB = tutup(SHB, expB)
catat(
    "laci B bisa ditutup pas setelah koreksi",
    st in (200, 201) and (cB.get("data") or {}).get("varianceStatus") == "BALANCED",
    f"HTTP {st} status={(cB.get('data') or {}).get('varianceStatus')}",
)

# --- cetak ulang Z-Report laci A ---
st, r1 = req("GET", f"/api/pos/shifts/{SHA}")
D1 = r1.get("data", {})
rep1 = (D1.get("shift") or {}).get("reprintCount")
catat(
    "cetak ulang Z-Report A menampilkan penanda koreksi",
    st == 200
    and (D1.get("shift") or {}).get("lateVoidCount") == 1
    and (D1.get("shift") or {}).get("lastLateVoidAt") is not None
    and float(D1.get("totalVoided") or 0) == VOID_BEKU,
    f"HTTP {st} reprint={rep1} lateVoid={(D1.get('shift') or {}).get('lateVoidCount')} void tetap={D1.get('totalVoided')}",
)
catat(
    "omzet Z-Report A tetap beku",
    float(D1.get("totalRevenue") or 0) == REV_BEKU,
    f"omzet {REV_BEKU} -> {D1.get('totalRevenue')}",
)
st, r2 = req("GET", f"/api/pos/shifts/{SHA}")
rep2 = (r2.get("data", {}).get("shift") or {}).get("reprintCount")
catat("penghitung cetak ulang naik", rep2 == rep1 + 1, f"{rep1} -> {rep2}")

# --- aturan bukti bayar & lain-lain ---
st, t1 = jual(TOK_MGR, "TEMPO", bayar=0, nama="")
catat("tempo wajib pelanggan", st == 400 and t1.get("code") == "TEMPO_REQUIRES_CUSTOMER", f"HTTP {st} {t1.get('code')}")
st, t2 = jual(TOK_MGR, "TEMPO", bayar=0, nama="Budi Santoso")
catat("tempo dengan pelanggan diterima", st in (200, 201), f"HTTP {st}")
st, t3 = jual(TOK_MGR, "QRIS", bayar=0, jumlah=1, produk=GERINDA)
catat("non-tunai >= 250rb wajib referensi", st == 400 and t3.get("code") == "NON_CASH_REFERENCE_REQUIRED", f"HTTP {st} {t3.get('code') or t3.get('error')}")
st, t4 = jual(TOK_MGR, "QRIS", bayar=0, ref="QR-123456", jumlah=1, produk=GERINDA)
catat("non-tunai >= 250rb dengan referensi diterima", st in (200, 201), f"HTTP {st}")
st, a1 = req("POST", "/api/inventory/adjustment", {"productId": PID, "quantityChange": 0, "reason": "OTHER"})
catat("penyesuaian stok 0 ditolak", st == 400, f"HTTP {st}")
st, _ = req("POST", "/api/cron/billing-referral", {"task": "renewals"}, extra={"x-cron-secret": "kadai-internal-cron-token"})
catat("cron menolak rahasia cadangan lama", st == 403, f"HTTP {st}")
st, _ = req("POST", "/api/cron/billing-referral?secret=uji-cron-9f3a71", {"task": "renewals"})
catat("cron menolak rahasia dari query string", st == 403, f"HTTP {st}")
st, _ = req("POST", "/api/cron/daily-summary", {}, extra={"x-cron-secret": "uji-cron-9f3a71"})
catat("cron menerima rahasia benar", st == 200, f"HTTP {st}")

# tutup laci manager bila masih terbuka
cur = lap(TOK_MGR)
sid = (cur.get("shift") or {}).get("id")
if sid:
    st, r = req("GET", f"/api/pos/shifts/{sid}")
    ec = float((r.get("data") or {}).get("expectedCash") or 0)
    st2, _ = tutup(sid, ec)
    print(f"laci manager terakhir {sid} ditutup -> HTTP {st2}")

lulus = sum(1 for _, l, _ in hasil if l)
print(f"\nRINGKASAN: {lulus}/{len(hasil)} lulus")
for nama, l, info in hasil:
    if not l:
        print(f"  gagal: {nama} — {info}")
