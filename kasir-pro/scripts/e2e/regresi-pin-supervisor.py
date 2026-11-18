"""v4: jalur PIN supervisor untuk kasir (PIN benar diterima, PIN salah ditolak)."""

import json
import os
import time
import urllib.request
import urllib.error

BASE = os.environ.get("KADAI_BASE", "http://127.0.0.1:3110")
TOK_KSR = os.environ["KADAI_TOKEN_KASIR"]
TOK_MGR = os.environ["KADAI_TOKEN_MANAGER"]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
MODAL = 200000
PIN_BENAR = os.environ.get("KADAI_PIN", "888222")  # PIN supervisor (manager/ADMIN) tenant
PIN_SALAH = "111111"


def req(method, path, body=None, tok=TOK_KSR):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", "Cookie": f"session={tok}", "Origin": BASE, "User-Agent": UA}
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:200]}


def siklus(label):
    st, out = req("GET", "/api/outlets", tok=TOK_MGR)
    o = (out if isinstance(out, list) else out.get("data") or out.get("outlets") or [])[0]
    st, ps = req("GET", f"/api/products?limit=100&outletId={o['id']}", tok=TOK_MGR)
    p = (ps.get("data") or [])[0]
    st, sh = req("POST", "/api/pos/shifts", {"openingCash": MODAL})
    sid = ((sh.get("data") or {}).get("shift") or {}).get("id")
    st, s = req("POST", "/api/sales", {
        "outletId": o["id"], "paymentType": "CASH", "paidAmount": 1000000,
        "idempotencyKey": f"v4-{label}-{time.time()}",
        "items": [{"productId": p["id"], "productName": p["name"], "quantity": 1, "unitPrice": float(p.get("currentSellingPrice") or 0)}],
    })
    S = s.get("data", {})
    total = float(S.get("totalAmount") or 0)
    st, c = req("POST", f"/api/pos/shifts/{sid}", {"actualCash": MODAL + total})
    return sid, S.get("id"), total, (c.get("data") or {}).get("varianceStatus")


# PIN salah
sid1, sale1, total1, var1 = siklus("salah")
print(f"laci={sid1} penjualan={sale1} total={total1} status_laci={var1}")
st, r1 = req("POST", f"/api/sales/{sale1}/void", {"reason": "kasir koreksi dengan pin salah", "supervisorPin": "111111"})
print(("LULUS " if st in (400, 403, 401) else "GAGAL ") + f"PIN salah ditolak — HTTP {st} {r1.get('code') or r1.get('error')}")

# PIN benar
sid2, sale2, total2, var2 = siklus("benar")
st, r2 = req("POST", f"/api/sales/{sale2}/void", {"reason": "kasir koreksi disetujui kepala toko", "supervisorPin": "999222"})
print(("LULUS " if st in (200, 201) else "GAGAL ") + f"PIN supervisor benar diterima — HTTP {st} {r2.get('code') or r2.get('error')}")
st, z = req("GET", f"/api/pos/shifts/{sid2}")
Z = z.get("data", {})
print(f"penanda laci: lateVoidCount={(Z.get('shift') or {}).get('lateVoidCount')} totalCashRefunds={Z.get('totalCashRefunds')} totalRevenue={Z.get('totalRevenue')}")

# bersihkan laci terbuka
for tok in (TOK_KSR, TOK_MGR):
    st, r = req("GET", "/api/pos/shifts", tok=tok)
    sid = ((r.get("data") or {}).get("currentShift") or {}).get("shift", {}).get("id")
    if sid:
        st2, lap = req("GET", f"/api/pos/shifts/{sid}", tok=tok)
        ec = float((lap.get("data") or {}).get("shift", {}).get("expectedCash") or 0)
        st3, _ = req("POST", f"/api/pos/shifts/{sid}", {"actualCash": ec}, tok)
        print(f"laci {sid} ditutup -> HTTP {st3}")