// Penyimpanan lokal hanya untuk preferensi tampilan dan notifikasi.
// Tidak pernah menyimpan rahasia atau data pribadi. Bisa gagal (mode privat,
// data situs diblokir): semua akses dibungkus dan punya nilai cadangan.

const PREFIX = 'jdih:'

export function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key)
    return raw === null || raw === undefined ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    globalThis.localStorage?.removeItem(PREFIX + key)
    return true
  } catch {
    return false
  }
}
