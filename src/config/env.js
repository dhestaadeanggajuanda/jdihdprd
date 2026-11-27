// Variabel .env aplikasi: JDIH_NEWS_FILTER (kata kunci berita) dan
// JDIH_FOOTER_CONTACT (alamat dan kontak di footer).
// Nilai ditanam ke bundel saat build (publik), jadi jangan isi rahasia.
// Quasar 3 hanya meneruskan variabel berawalan JDIH_ ke klien.

import { stripControl } from '@/utils/chars.js'

export const DEFAULT_NEWS_FILTER = ['produk hukum', 'peraturan daerah', 'dprd']

export const NEWS_FILTER_LIMITS = Object.freeze({
  maxTerms: 6,
  minLength: 2,
  maxLength: 40
})

// Huruf, angka, spasi, dan tanda hubung saja. Mencegah karakter yang bermakna
// bagi pencarian WordPress atau URL (tanda kutip, &, =, #, dan sebagainya).
const TERM_RE = /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u

/**
 * Mengubah nilai mentah JDIH_NEWS_FILTER menjadi daftar kata kunci aman.
 * - Quasar dapat mengubah nilai mirip angka, jadi selalu dicast ke string.
 * - Dipisah koma, dirapikan, entri tidak valid dibuang, duplikat dibuang.
 * - Kosong atau seluruhnya tidak valid: kembali ke DEFAULT_NEWS_FILTER.
 */
export function parseNewsFilter(raw) {
  const { maxTerms, minLength, maxLength } = NEWS_FILTER_LIMITS
  const text = raw === undefined || raw === null ? '' : String(raw)
  const seen = new Set()
  const terms = []
  for (const part of text.split(',')) {
    const term = part.replace(/\s+/g, ' ').trim()
    if (term.length < minLength || term.length > maxLength) continue
    if (!TERM_RE.test(term)) continue
    const key = term.toLocaleLowerCase('id-ID')
    if (seen.has(key)) continue
    seen.add(key)
    terms.push(term)
    if (terms.length === maxTerms) break
  }
  return terms.length > 0 ? terms : [...DEFAULT_NEWS_FILTER]
}

export const NEWS_FILTER = parseNewsFilter(import.meta.env.JDIH_NEWS_FILTER)

export const CONTACT_LIMITS = Object.freeze({ maxLines: 6, maxLength: 160 })

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/
const PHONE_RE = /^\+?[\d\s().-]{6,24}$/

/**
 * Mengubah JDIH_FOOTER_CONTACT menjadi baris footer. Baris dipisah "|".
 * Setiap baris adalah teks polos; alamat surel dan nomor telepon yang
 * berdiri sendiri menjadi tautan mailto: atau tel:. Karakter kendali dibuang,
 * baris kosong dibuang, dan jumlah serta panjang baris dibatasi. Kosong = tidak
 * ada kolom Kontak.
 * @returns {{ text: string, href: string | null }[]}
 */
export function parseContact(raw) {
  const { maxLines, maxLength } = CONTACT_LIMITS
  const text = raw === undefined || raw === null ? '' : String(raw)
  const lines = []
  for (const part of text.split('|')) {
    const line = stripControl(part, ' ').replace(/\s+/g, ' ').trim()
    if (line === '' || line.length > maxLength) continue
    let href = null
    if (EMAIL_RE.test(line)) href = `mailto:${line}`
    else if (PHONE_RE.test(line)) href = `tel:${line.replace(/[^\d+]/g, '')}`
    lines.push({ text: line, href })
    if (lines.length === maxLines) break
  }
  return lines
}

export const CONTACT_LINES = parseContact(import.meta.env.JDIH_FOOTER_CONTACT)

export const APP_VERSION = String(import.meta.env.JDIH_APP_VERSION ?? '0.0.0')

/**
 * Mengubah JDIH_WHATSAPP menjadi nomor WhatsApp berformat internasional tanpa
 * "+" (bentuk yang dipakai tautan wa.me), misalnya `6281234567890`.
 * - Spasi, tanda hubung, titik, dan tanda kurung dibuang; "+" di awal boleh.
 * - Awalan "0" (nomor lokal Indonesia) menjadi "62"; awalan "00" dibuang.
 * - Hanya 8 sampai 15 angka (batas E.164) yang diterima. Selain itu kosong,
 *   dan tombol WhatsApp tidak ditampilkan.
 * @returns {string}
 */
export function parseWhatsapp(raw) {
  const text = raw === undefined || raw === null ? '' : String(raw).trim()
  if (text === '' || !/^[\s(]*\+?[\s\d().-]+$/.test(text)) return ''
  let digits = text.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : ''
}

export const WHATSAPP = parseWhatsapp(import.meta.env.JDIH_WHATSAPP)

// Jalur layanan Asisten pada origin yang sama (diteruskan nginx, lihat
// docs/deploy/frontend-baota.md). Alamat penuh sengaja tidak diterima: origin
// lain akan butuh perubahan CSP (connect-src) di dua tempat.
const ASISTEN_PATH_RE = /^\/[\w.~-]+(?:\/[\w.~-]+){0,4}$/

/**
 * Mengubah JDIH_ASISTEN_URL menjadi jalur POST layanan Asisten, mis.
 * `/asisten/chat`. Kosong atau tidak valid (alamat penuh, awalan "//", "..",
 * kueri): kosong, dan tombol Asisten, panelnya, serta butir kebijakannya tidak
 * dirender.
 * @returns {string}
 */
export function parseAsistenUrl(raw) {
  const text = raw === undefined || raw === null ? '' : String(raw).trim()
  if (!ASISTEN_PATH_RE.test(text)) return ''
  if (text.split('/').some(part => part === '.' || part === '..')) return ''
  return text
}

export const ASISTEN_URL = parseAsistenUrl(import.meta.env.JDIH_ASISTEN_URL)

export const KEBIJAKAN_MAX_LENGTH = 200

/**
 * Isian naskah kebijakan yang hanya diketahui instansi (kontak, tanggal, masa
 * simpan, lokasi pemrosesan). Teks polos, karakter kendali dibuang, dibatasi
 * panjangnya. Kosong = naskah menampilkan penanda "[diisi instansi]".
 */
export function parseKebijakan(raw = {}) {
  const clean = value => {
    const text = value === undefined || value === null ? '' : String(value)
    const out = stripControl(text, ' ').replace(/\s+/g, ' ').trim()
    return out.length > KEBIJAKAN_MAX_LENGTH ? '' : out
  }
  return {
    berlaku: clean(raw.berlaku),
    diperbarui: clean(raw.diperbarui),
    kontak: clean(raw.kontak),
    simpanLog: clean(raw.simpanLog),
    asistenLokasi: clean(raw.asistenLokasi),
    asistenSimpan: clean(raw.asistenSimpan)
  }
}

export const KEBIJAKAN = parseKebijakan({
  berlaku: import.meta.env.JDIH_KEBIJAKAN_BERLAKU,
  diperbarui: import.meta.env.JDIH_KEBIJAKAN_DIPERBARUI,
  kontak: import.meta.env.JDIH_KEBIJAKAN_KONTAK,
  simpanLog: import.meta.env.JDIH_KEBIJAKAN_SIMPAN_LOG,
  asistenLokasi: import.meta.env.JDIH_ASISTEN_LOKASI,
  asistenSimpan: import.meta.env.JDIH_ASISTEN_SIMPAN
})

/**
 * Naskah kebijakan dianggap lengkap bila semua isian yang dipakainya terisi.
 * Selama belum, halaman memberi label "Naskah contoh" dan penanda pada isian
 * yang kosong.
 */
export function isKebijakanLengkap(
  k = KEBIJAKAN,
  { asisten = ASISTEN_URL !== '' } = {}
) {
  const wajib = [k.berlaku, k.diperbarui, k.kontak, k.simpanLog]
  if (asisten) wajib.push(k.asistenLokasi, k.asistenSimpan)
  return wajib.every(v => v !== '')
}
