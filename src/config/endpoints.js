import {
  API_ORIGIN,
  API_PATH,
  MEDIACENTER_ORIGIN,
  MEDIACENTER_API_PATH
} from './hosts.js'

// Pengembangan: API palsu dilayani oleh server dev pada origin yang sama
// (dev/mock-api). Produksi: selalu HTTPS absolut ke API JDIH, sehingga web dan
// Android (Capacitor, origin https://localhost) memakai jalur yang sama.
const isDev = Boolean(import.meta.env.DEV)

export const API_BASE = isDev ? API_PATH : `${API_ORIGIN}${API_PATH}`
export const MEDIACENTER_BASE = `${MEDIACENTER_ORIGIN}${MEDIACENTER_API_PATH}`

// Origin yang boleh dihubungi (setelah redirect pun) oleh klien HTTP.
export const ALLOWED_FETCH_ORIGINS = [
  isDev ? globalThis.location?.origin : API_ORIGIN,
  MEDIACENTER_ORIGIN
].filter(Boolean)

// Gambar dan tautan berita hanya diterima dari host Media Center.
export const NEWS_HOSTS = [new URL(MEDIACENTER_ORIGIN).hostname]
export const MEDIACENTER_URL = MEDIACENTER_ORIGIN + '/'
