"use client";

const REFERRAL_COOKIE_NAME = "kadai_ref";
const REFERRAL_STORAGE_KEY = "kadai_ref_code";
const REFERRAL_STORAGE_TIME = "kadai_ref_time";
const ATTRIBUTION_WINDOW_DAYS = 30; // Standar Enterprise: 30 Hari Cookie & LocalStorage

/**
 * Menyimpan kode referral dengan dual-persistence (Cookie + LocalStorage)
 * Menggunakan prinsip First-Touch Attribution: jika sudah ada referral sebelumnya
 * dalam masa aktif 30 hari, referral pertama dipertahankan untuk melindungi mitra awal.
 */
export function saveReferralCode(code: string, forceOverride = false) {
  if (typeof window === "undefined" || !code) return;
  const cleanCode = code.trim().toUpperCase();

  // Cek apakah sudah ada referral tersimpan
  const existingCode = getStoredReferralCode();
  if (existingCode && !forceOverride) {
    // Pertahankan hak mitra pertama (First-Touch Attribution)
    return existingCode;
  }

  // 1. Simpan di LocalStorage (Tahan pembersihan cookie browser)
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, cleanCode);
    localStorage.setItem(REFERRAL_STORAGE_TIME, Date.now().toString());
  } catch (e) {
    console.warn("LocalStorage tidak tersedia:", e);
  }

  // 2. Simpan di Document Cookie (Bisa dibaca server & client lintas subdomain/path)
  const maxAge = 60 * 60 * 24 * ATTRIBUTION_WINDOW_DAYS;
  document.cookie = `${REFERRAL_COOKIE_NAME}=${cleanCode}; path=/; max-age=${maxAge}; SameSite=Lax`;

  return cleanCode;
}

/**
 * Mengambil kode referral aktif dari 3 layer hierarki:
 * 1. URL Query Parameter (?ref=...)
 * 2. Document Cookie (kadai_ref)
 * 3. LocalStorage fallback (kadai_ref_code)
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Cek dari URL langsung
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");
    if (refParam) {
      return refParam.trim().toUpperCase();
    }
  } catch {}

  // 2. Cek dari Document Cookie
  try {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [key, value] = c.trim().split("=");
      if (key === REFERRAL_COOKIE_NAME && value) {
        return decodeURIComponent(value).trim().toUpperCase();
      }
    }
  } catch {}

  // 3. Cek dari LocalStorage dengan validasi 30 hari masa kadaluwarsa
  try {
    const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
    const storedTime = localStorage.getItem(REFERRAL_STORAGE_TIME);
    if (storedCode && storedTime) {
      const timeDiff = Date.now() - parseInt(storedTime, 10);
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= ATTRIBUTION_WINDOW_DAYS) {
        return storedCode.trim().toUpperCase();
      } else {
        // Sudah lewat 30 hari, bersihkan
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        localStorage.removeItem(REFERRAL_STORAGE_TIME);
      }
    }
  } catch {}

  return null;
}
