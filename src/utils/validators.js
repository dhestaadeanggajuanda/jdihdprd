import { stripControl } from './chars.js'

// Validasi parameter rute dan kueri sebelum dipakai (OWASP A01/A03/A04).
// Nilai tidak valid dibuang atau diganti bawaan, tidak pernah diteruskan.

export const TIPE = ['peraturan', 'monografi', 'artikel', 'putusan']
export const STATUS = ['berlaku', 'dicabut']
export const SORT = ['terbaru', 'nomor', 'populer']
export const PER_PAGE = 10
export const MAX_PAGE = 1000

export const isValidId = v => typeof v === 'string' && /^\d{1,10}$/.test(v)
export const isValidSlug = v =>
  typeof v === 'string' && /^[a-z0-9-]{1,120}$/.test(v)

// Nilai kueri rute bisa berupa larik (parameter berulang): ambil yang pertama.
export function firstValue(v) {
  const x = Array.isArray(v) ? v[0] : v
  return typeof x === 'string' ? x : ''
}

function cleanText(v, max) {
  return stripControl(firstValue(v), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function pickYear(v) {
  const s = firstValue(v)
  if (!/^\d{4}$/.test(s)) return ''
  const n = Number(s)
  return n >= 1900 && n <= 2100 ? s : ''
}

export const DEFAULT_FILTERS = Object.freeze({
  q: '',
  tipe: 'peraturan',
  jenis: '',
  status: '',
  diubah: false,
  nomor: '',
  tahun_dari: '',
  tahun_sampai: '',
  subyek: '',
  sort: 'terbaru',
  page: 1
})

export function parseListQuery(query = {}) {
  const q = cleanText(query.q, 100)
  const tipe = TIPE.includes(firstValue(query.tipe))
    ? firstValue(query.tipe)
    : DEFAULT_FILTERS.tipe
  const jenis = /^[a-z0-9-]{1,40}$/.test(firstValue(query.jenis))
    ? firstValue(query.jenis)
    : ''
  const status = STATUS.includes(firstValue(query.status))
    ? firstValue(query.status)
    : ''
  const nomor = /^[0-9A-Za-z/.-]{1,20}$/.test(firstValue(query.nomor))
    ? firstValue(query.nomor)
    : ''
  const sort = SORT.includes(firstValue(query.sort))
    ? firstValue(query.sort)
    : DEFAULT_FILTERS.sort
  const pageNum = Number(firstValue(query.page))
  const page =
    Number.isInteger(pageNum) && pageNum >= 1 && pageNum <= MAX_PAGE
      ? pageNum
      : 1

  return {
    q: q.length >= 2 ? q : '',
    tipe,
    jenis,
    status,
    diubah: firstValue(query.diubah) === '1',
    nomor,
    tahun_dari: pickYear(query.tahun_dari),
    tahun_sampai: pickYear(query.tahun_sampai),
    subyek: cleanText(query.subyek, 60),
    sort,
    page
  }
}

// Kueri URL minimal: nilai bawaan tidak ditulis.
export function toRouteQuery(filters) {
  const out = {}
  const f = { ...DEFAULT_FILTERS, ...filters }
  if (f.q) out.q = f.q
  if (f.tipe !== DEFAULT_FILTERS.tipe) out.tipe = f.tipe
  if (f.jenis) out.jenis = f.jenis
  if (f.status) out.status = f.status
  if (f.diubah) out.diubah = '1'
  if (f.nomor) out.nomor = f.nomor
  if (f.tahun_dari) out.tahun_dari = f.tahun_dari
  if (f.tahun_sampai) out.tahun_sampai = f.tahun_sampai
  if (f.subyek) out.subyek = f.subyek
  if (f.sort !== DEFAULT_FILTERS.sort) out.sort = f.sort
  if (f.page > 1) out.page = String(f.page)
  return out
}

// Parameter untuk API (nama sama dengan kueri URL).
export function toApiParams(filters, { perPage = PER_PAGE } = {}) {
  const q = toRouteQuery({ ...filters, page: filters.page ?? 1 })
  return {
    ...q,
    tipe: filters.tipe ?? DEFAULT_FILTERS.tipe,
    page: filters.page ?? 1,
    per_page: perPage
  }
}

// Jumlah filter yang aktif (tanpa kata kunci, tipe, dan urutan).
export function countActiveFilters(f) {
  return [
    f.jenis,
    f.status,
    f.diubah,
    f.nomor,
    f.tahun_dari || f.tahun_sampai,
    f.subyek
  ].filter(Boolean).length
}
