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
