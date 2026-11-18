"""Verifikasi lanjutan (v3): sisa butir yang belum terbukti + bentuk respons asli."""

import json
import os
import time
import urllib.request
import urllib.error

BASE = os.environ.get("KADAI_BASE", "http://127.0.0.1:3110")
TOK_MGR = os.environ["KADAI_TOKEN_MANAGER"]
TOK_KSR = os.environ["KADAI_TOKEN_KASIR"]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
PIN = "999222"
hasil = []


def req(method, path, body=None, tok=TOK_MGR, extra=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", "Cookie": f"session={tok}", "Origin": BASE, "User-Agent": UA, **(extra or {})}
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:300]}


def catat(nama, lulus, info=""):
    hasil.append((nama, lulus, info))
    print(("LULUS " if lulus else "GAGAL ") + nama + (f" — {info}" if info else ""))


def bersihkan(tok, siapa):
    st, r = req("GET", "/api/pos/shifts", tok=tok)
    sid = ((r.get("data") or {}).get("currentShift") or {}).get("shift", {}).get("id")
    if sid:
        st2, lap = req("GET", f"/api/pos/shifts/{sid}", tok=tok)
        ec = float((lap.get("data") or {}).get("shift", {}).get("expectedCash") or 0)
        st3, _ = req("POST", f"/api/pos/shifts/{sid}", {"actualCash": ec}, tok)
        print(f"laci {siapa} {sid} ditutup -> HTTP {st3} (kas diharapkan {ec})")
    return sid


for tok, siapa in ((TOK_MGR, "manager"), (TOK_KSR, "kasir")):
    bersihkan(tok, siapa)

st, out = req("GET", "/api/outlets")
o = (out if isinstance(out, list) else out.get("data") or out.get("outlets") or [])[0]
OUT = o["id"]


def pilih_produk(tok, outlet, butuh=1):
    st, r = req("GET", f"/api/products?limit=100&outletId={outlet}", tok=tok)
    items = (r.get("data") or [])
    if not items:
        raise SystemExit("tidak ada produk di tenant")
    return items


def produk_termahal(items, butuh):
    for p in sorted(items, key=lambda x: float(x.get("currentSellingPrice") or 0), reverse=True):
        if float(p.get("totalStock") or 0) >= butuh:
            return p["id"], p["name"], float(p["currentSellingPrice"])
    raise SystemExit("tidak ada produk berharga cukup & berstok cukup")


ITEMS = pilih_produk(TOK_MGR, OUT)
GERINDA, GERINDA_NAMA, GERINDA_HARGA = produk_termahal(ITEMS, 1)
# ambang bukti bayar: total belanja harus >= 250.000 sesuai harga jual server
GERINDA_QTY = max(1, int(250001 / GERINDA_HARGA) + (0 if 250001 % GERINDA_HARGA == 0 else 1))
MGR_SALE_PID = ITEMS[0]["id"]
MGR_SALE_NAMA = ITEMS[0]["name"]
MODAL = 200000

# ============ A. aturan bukti bayar non-tunai >= 250.000 ============
st, a1 = req("POST", "/api/sales", {
    "outletId": OUT, "paymentType": "QRIS", "paidAmount": 0, "idempotencyKey": f"v3-a1-{time.time()}",
    "items": [{"productId": GERINDA, "productName": GERINDA_NAMA, "quantity": GERINDA_QTY, "unitPrice": GERINDA_HARGA}],
})
catat("non-tunai >= 250rb tanpa referensi ditolak", st == 400 and a1.get("code") == "NON_CASH_REFERENCE_REQUIRED", f"HTTP {st} {a1.get('code') or a1.get('error')}")

st, a2 = req("POST", "/api/sales", {
    "outletId": OUT, "paymentType": "QRIS", "paidAmount": 0, "paymentRef": "QR-2026-000777",
    "idempotencyKey": f"v3-a2-{time.time()}",
    "items": [{"productId": GERINDA, "productName": GERINDA_NAMA, "quantity": GERINDA_QTY, "unitPrice": GERINDA_HARGA}],
})
A2 = a2.get("data", {})
catat("non-tunai >= 250rb dengan referensi diterima", st in (200, 201) and float(A2.get("totalAmount") or 0) >= 250000,
      f"HTTP {st} total={A2.get('totalAmount')} referensi tercatat={A2.get('paymentRef')}")

# tunai besar tanpa referensi harus tetap boleh
st, a3 = req("POST", "/api/sales", {
    "outletId": OUT, "paymentType": "CASH", "paidAmount": 1000000, "idempotencyKey": f"v3-a3-{time.time()}",
    "items": [{"productId": GERINDA, "productName": GERINDA_NAMA, "quantity": GERINDA_QTY, "unitPrice": GERINDA_HARGA}],
})
catat("tunai besar tidak wajib referensi", st in (200, 201), f"HTTP {st}")

# ============ B. kasir dilarang koreksi susulan, manager boleh ============
st, sh = req("POST", "/api/pos/shifts", {"openingCash": MODAL}, TOK_KSR)
SH_K = ((sh.get("data") or {}).get("shift") or {}).get("id")
catat("kasir buka laci", bool(SH_K), f"HTTP {st}")

st, s = req("POST", "/api/sales", {
    "outletId": OUT, "paymentType": "CASH", "paidAmount": 1000000, "idempotencyKey": f"v3-b-{time.time()}",
    "items": [{"productId": MGR_SALE_PID, "productName": MGR_SALE_NAMA, "quantity": 1, "unitPrice": 10000}],
}, TOK_KSR)
SB = s.get("data", {})
SALE_K = SB.get("id")
TOTAL_K = float(SB.get("totalAmount") or 0)
catat("kasir jual tunai", st in (200, 201) and TOTAL_K > 0, f"HTTP {st} total={TOTAL_K}")

st, ck = req("POST", f"/api/pos/shifts/{SH_K}", {"actualCash": MODAL + TOTAL_K}, TOK_KSR)
catat("kasir tutup laci kas sesuai", st in (200, 201) and (ck.get("data") or {}).get("varianceStatus") == "BALANCED",
      f"HTTP {st} status={(ck.get('data') or {}).get('varianceStatus')}")

st, vk = req("POST", f"/api/sales/{SALE_K}/void", {"reason": "kasir mencoba koreksi setelah laci tutup"}, TOK_KSR)
catat("kasir DILARANG koreksi susulan", st in (400, 403, 409),
      f"HTTP {st} {vk.get('code') or vk.get('error')}")

st, vm = req("POST", f"/api/sales/{SALE_K}/void", {"reason": "transaksi batal, barang dikembalikan ke rak"})
VM = vm.get("data", {})
print("  bentuk respons koreksi manager:", json.dumps(VM)[:320])
catat("manager boleh mengoreksi transaksi bekas laci kasir", st in (200, 201), f"HTTP {st}")

# penanda di laci kasir
st, zk = req("GET", f"/api/pos/shifts/{SH_K}", tok=TOK_KSR)
ZK = zk.get("data", {})
catat("laci kasir ditandai koreksi susulan", (ZK.get("shift") or {}).get("lateVoidCount") == 1,
      f"lateVoid={(ZK.get('shift') or {}).get('lateVoidCount')} reprint={(ZK.get('shift') or {}).get('reprintCount')}")

# ============ C. bentuk angka Z-Report ============
print("  kunci laporan laci kasir:", [k for k in ZK.keys() if k not in ("shift", "store", "cashier")])

# ============ D. koreksi tanpa PIN oleh manager: apakah PIN diwajibkan? ============
st, s2 = req("POST", "/api/sales", {
    "outletId": OUT, "paymentType": "CASH", "paidAmount": 1000000, "idempotencyKey": f"v3-d-{time.time()}",
    "items": [{"productId": MGR_SALE_PID, "productName": MGR_SALE_NAMA, "quantity": 1, "unitPrice": 10000}],
})
S2 = s2.get("data", {})
st, sh2 = req("POST", "/api/pos/shifts", {"openingCash": MODAL})
SH2 = ((sh2.get("data") or {}).get("shift") or {}).get("id")
st, c2 = req("POST", f"/api/pos/shifts/{SH2}", {"actualCash": MODAL + float(S2.get("totalAmount") or 0)})
st, vpn = req("POST", f"/api/sales/{S2.get('id')}/void", {"reason": "koreksi tanpa pin oleh kepala toko"})
catat("koreksi susulan oleh manager tercatat", vpn is not None and st in (200, 201), f"HTTP {st}")

bersihkan(TOK_MGR, "manager")
bersihkan(TOK_KSR, "kasir")

lulus = sum(1 for _, l, _ in hasil if l)
print(f"\nRINGKASAN v3: {lulus}/{len(hasil)} lulus")
for nama, l, info in hasil:
    if not l:
        print(f"  gagal: {nama} — {info}")
