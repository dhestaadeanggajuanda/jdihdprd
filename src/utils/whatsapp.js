// Tautan WhatsApp. Hanya tautan https://wa.me/<nomor>?text=... (tanpa skrip,
// tanpa SDK): WhatsApp baru dibuka saat pengguna menekannya.
import { stripControl } from './chars.js'

export const PESAN_BAWAAN =
  'Halo, saya ingin bertanya tentang JDIH DPRD Kota Singkawang.'
export const PESAN_MAX = 400

/**
 * @param {string} nomor nomor internasional tanpa "+" (sudah lolos parseWhatsapp)
 * @param {string} [pesan] pesan awal; kosong = pesan bawaan
 * @returns {string} tautan, atau '' bila nomor tidak valid
 */
export function whatsappUrl(nomor, pesan = PESAN_BAWAAN) {
  if (!/^[1-9]\d{7,14}$/.test(String(nomor ?? ''))) return ''
  const teks = stripControl(String(pesan ?? ''), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PESAN_MAX)
  return `https://wa.me/${nomor}?text=${encodeURIComponent(teks || PESAN_BAWAAN)}`
}

/**
 * Pesan awal untuk halaman dokumen: judul dan tautan dokumen. Judul dipotong
 * agar pesan tidak melewati batas.
 */
export function pesanDokumen(judul, url) {
  const j = stripControl(String(judul ?? ''), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
  if (!j) return PESAN_BAWAAN
  return `Halo, saya ingin bertanya tentang ${j}. ${url ?? ''}`.trim()
}
