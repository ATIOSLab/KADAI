#!/usr/bin/env python
"""Regresi CRUD data induk: pemasok, pelanggan, cabang, dan satuan.

Menembak HTTP sungguhan ke server KADAI. Yang dibuktikan:

  1. pemasok bisa dinonaktifkan lewat DELETE, hilang dari daftar default,
     tetap terlihat dengan ?includeInactive=1, dan bisa diaktifkan lagi lewat
     PUT isActive (dulu tombol "Nonaktifkan" tidak berefek apa pun);
  2. pelanggan: kasir ditolak (403), manager boleh; nonaktif bisa diaktifkan lagi;
  3. cabang utama tidak bisa dinonaktifkan (409 MAIN_OUTLET_PROTECTED);
  4. satuan: ganti nama menyebar ke produk yang memakainya; satuan yang masih
     dipakai tidak bisa dihapus (409 UNIT_IN_USE); satuan tak terpakai dihapus.

Prasyarat: server produksi lokal + akun demo. Lihat README.md di folder ini.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Any

BASE = os.environ.get("KADAI_BASE", "http://127.0.0.1:3110")
TOK_MGR = os.environ.get("KADAI_TOKEN_MANAGER", "")
TOK_KASIR = os.environ.get("KADAI_TOKEN_KASIR", "")

lulus = 0
gagal = 0


def req(method: str, path: str, token: str, body: Any = None) -> tuple[int, Any]:
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Cookie", f"session={token}")
    r.add_header("Origin", BASE)
    if data is not None:
        r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"error": raw[:200]}


def catat(nama, ok, detail=""):
    global lulus, gagal
    if ok:
        lulus += 1
        print(f"  LULUS  {nama} {detail}")
    else:
        gagal += 1
        print(f"  GAGAL  {nama} {detail}")


# Akhiran unik per jalannya uji supaya pengulangan tidak bentrok dengan baris
# yang ditinggalkan percobaan sebelumnya (nama/telepon bisa unik di DB).
SUFIKS = uuid.uuid4().hex[:6]
NOMOR = f"0812{uuid.uuid4().int % 10_000_000:07d}"

if not TOK_MGR or not TOK_KASIR:
    sys.exit("KADAI_TOKEN_MANAGER dan KADAI_TOKEN_KASIR wajib diisi")

print("== PEMASOK ==")
st, d = req("POST", "/api/suppliers", TOK_MGR, {"name": f"CV Uji CRUD {SUFIKS}", "phone": NOMOR})
sup = (d.get("data") or {})
sid = sup.get("id")
catat("buat pemasok", st in (200, 201) and bool(sid), f"HTTP {st}")

st, d = req("GET", "/api/suppliers?search=" + urllib.parse.quote(f"CV Uji CRUD {SUFIKS}"), TOK_MGR)
ids = [s["id"] for s in (d.get("data") or [])]
catat("pemasok muncul di daftar", sid in ids, f"{len(ids)} baris")

st, d = req("DELETE", f"/api/suppliers?id={sid}", TOK_MGR)
catat("nonaktifkan pemasok", st == 200 and d.get("success") is not False, f"HTTP {st}")

st, d = req("GET", "/api/suppliers?search=" + urllib.parse.quote(f"CV Uji CRUD {SUFIKS}"), TOK_MGR)
ids = [s["id"] for s in (d.get("data") or [])]
catat("pemasok nonaktif hilang dari daftar default", sid not in ids, f"{len(ids)} baris")

st, d = req("GET", "/api/suppliers?search=" + urllib.parse.quote(f"CV Uji CRUD {SUFIKS}") + "&includeInactive=1", TOK_MGR)
baris = [s for s in (d.get("data") or []) if s["id"] == sid]
catat("pemasok nonaktif tetap terlihat dengan includeInactive=1",
      len(baris) == 1 and baris[0].get("isActive") is False,
      f"isActive={baris[0].get('isActive') if baris else 'tidak ada'}")

st, d = req("PUT", "/api/suppliers", TOK_MGR, {"id": sid, "isActive": True})
catat("aktifkan lagi lewat PUT isActive (dulu tidak berefek)", st == 200, f"HTTP {st}")

st, d = req("GET", "/api/suppliers?search=" + urllib.parse.quote(f"CV Uji CRUD {SUFIKS}"), TOK_MGR)
ids = [s["id"] for s in (d.get("data") or [])]
catat("pemasok kembali muncul setelah diaktifkan", sid in ids, f"{len(ids)} baris")

print("\n== PELANGGAN ==")
st, d = req("POST", "/api/customers", TOK_MGR, {"name": f"Pelanggan Uji CRUD {SUFIKS}", "phone": NOMOR})
cid = (d.get("data") or {}).get("id")
catat("buat pelanggan", st in (200, 201) and bool(cid), f"HTTP {st}")

st, d = req("DELETE", f"/api/customers?id={cid}", TOK_KASIR)
catat("kasir tidak boleh menonaktifkan pelanggan", st == 403, f"HTTP {st}")

st, d = req("DELETE", f"/api/customers?id={cid}", TOK_MGR)
catat("manager menonaktifkan pelanggan", st == 200, f"HTTP {st}")

st, d = req("GET", "/api/customers?search=" + urllib.parse.quote(f"Pelanggan Uji CRUD {SUFIKS}"), TOK_MGR)
ids = [c["id"] for c in (d.get("data") or [])]
catat("pelanggan nonaktif hilang dari daftar default", cid not in ids, f"{len(ids)} baris")

st, d = req("GET", "/api/customers?search=" + urllib.parse.quote(f"Pelanggan Uji CRUD {SUFIKS}") + "&includeInactive=1", TOK_MGR)
baris = [c for c in (d.get("data") or []) if c["id"] == cid]
catat("pelanggan nonaktif terlihat dengan includeInactive=1",
      len(baris) == 1 and baris[0].get("isActive") is False, f"{len(baris)} baris")

st, d = req("PUT", "/api/customers", TOK_MGR, {"id": cid, "isActive": True})
catat("pelanggan bisa diaktifkan kembali", st == 200, f"HTTP {st}")

print("\n== CABANG ==")
st, d = req("GET", "/api/outlets", TOK_MGR)
outlets = d.get("data") or []
utama = [o for o in outlets if o.get("isMain")]
catat("ada cabang utama untuk diuji", len(utama) >= 1, f"{len(utama)} cabang utama")

if utama:
    st, d = req("DELETE", f"/api/outlets?id={utama[0]['id']}", TOK_MGR)
    catat("cabang utama tidak bisa dinonaktifkan",
          st == 409 and d.get("code") == "MAIN_OUTLET_PROTECTED",
          f"HTTP {st} {d.get('code')}")

print("\n== SATUAN ==")
st, d = req("POST", "/api/units", TOK_MGR, {"name": f"krat-{SUFIKS}"})
uid = (d.get("data") or {}).get("id")
catat("buat satuan", st in (200, 201) and bool(uid), f"HTTP {st}")

st, d = req("DELETE", f"/api/units?id={uid}", TOK_MGR)
catat("hapus satuan yang belum dipakai", st == 200, f"HTTP {st}")

# Satuan hanya bisa dipakai kalau menempel di produk, jadi uji pemakaian dibuat
# sendiri: buat satuan, pindahkan satu produk ke satuan itu, lalu uji ganti nama.
st, d = req("POST", "/api/units", TOK_MGR, {"name": f"krat-{SUFIKS}"})
uid = (d.get("data") or {}).get("id")
catat("buat ulang satuan untuk uji pemakaian", st in (200, 201) and bool(uid), f"HTTP {st}")

st, d = req("GET", "/api/products?limit=5", TOK_MGR)
produk = d.get("data") or []
if isinstance(produk, dict):
    produk = produk.get("products") or produk.get("items") or []
catat("ada produk untuk diuji", len(produk) >= 1, f"{len(produk)} produk")

if produk and uid:
    target_produk = produk[0]
    satuan_asli = target_produk.get("unit") or ""
    pid = target_produk["id"]

    st, d = req("PUT", f"/api/products/{pid}", TOK_MGR, {"unit": f"krat-{SUFIKS}"})
    catat("pindahkan produk ke satuan uji", st == 200, f"HTTP {st}")

    st, d = req("GET", "/api/units", TOK_MGR)
    units = d.get("data") or []
    milik = [u for u in units if u.get("id") == uid]
    catat("satuan milik tenant terlihat dan bisa diubah",
          len(milik) == 1 and milik[0].get("bisaDiubah") is True,
          f"{len(milik)} baris")
    catat("penghitung pemakaian satuan benar",
          bool(milik) and (milik[0].get("dipakai") or 0) >= 1,
          f"dipakai={milik[0].get('dipakai') if milik else 'n/a'}")

    st, d = req("DELETE", f"/api/units?id={uid}", TOK_MGR)
    catat("satuan yang masih dipakai tidak bisa dihapus",
          st == 409 and d.get("code") == "UNIT_IN_USE", f"HTTP {st} {d.get('code')}")

    st, d = req("PUT", "/api/units", TOK_MGR, {"id": uid, "name": f"krat-{SUFIKS}-baru"})
    catat("ganti nama satuan", st == 200, f"HTTP {st}")

    st, d = req("GET", "/api/products?search=" + urllib.parse.quote(str(target_produk.get('name', ''))[:12]) + "&limit=50", TOK_MGR)
    produk2 = d.get("data") or []
    if isinstance(produk2, dict):
        produk2 = produk2.get("products") or produk2.get("items") or []
    ikut = [p for p in produk2 if p.get("id") == pid and (p.get("unit") or "") == f"krat-{SUFIKS}-baru"]
    catat("produk ikut memakai nama satuan baru", len(ikut) == 1,
          f"unit={ikut[0].get('unit') if ikut else 'tidak berubah'}")

    # Kembalikan keadaan seperti semula.
    st, d = req("PUT", f"/api/products/{pid}", TOK_MGR, {"unit": satuan_asli or "pcs"})
    st, d = req("DELETE", f"/api/units?id={uid}", TOK_MGR)
    catat("satuan uji bisa dihapus setelah tidak dipakai", st == 200, f"HTTP {st}")

print(f"\nHASIL: {lulus} lulus, {gagal} gagal")
sys.exit(0 if gagal == 0 else 1)