// Fungsi bantu murni.

// ASCII saja, sama persis dengan ekspresi SQL JENIS_KODE di sql.js.
export const slugify = s =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const ACRONYMS = new Set([
  'DPRD',
  'DPR',
  'DPD',
  'MPR',
  'UU',
  'RI',
  'PP',
  'PERPPU',
  'PERPRES',
  'KEPPRES',
  'INPRES',
  'SE',
  'PTUN',
  'TUN',
  'MA',
  'MK',
  'PN',
  'PT',
  'PTA',
  'DKI',
  'APBD',
  'APBN',
  'RPJMD',
  'RKPD',
  'BUMD',
  'BUMN',
  'RT',
  'RW',
  'II',
  'III',
  'IV',
  'VI',
  'VII',
  'VIII',
  'IX',
  'KUHP',
  'KUHPer',
  'PUU',
  'JDIH',
  'NKRI'
])
const SMALL = new Set([
  'dan',
  'atau',
  'di',
  'ke',
  'dari',
  'yang',
  'untuk',
  'pada',
  'dengan',
  'atas',
  'tentang',
  'dalam'
])

/** "PERATURAN DAERAH KOTA" -> "Peraturan Daerah Kota"; singkatan umum tetap huruf besar. */
export function titleCase(value) {
  const s = String(value ?? '').trim()
  if (s === '') return ''
  let first = true
  return s.toLowerCase().replace(/[\p{L}\p{N}]+/gu, w => {
    const up = w.toUpperCase()
    const out = ACRONYMS.has(up)
      ? up
      : !first && SMALL.has(w)
        ? w
        : w[0].toUpperCase() + w.slice(1)
    first = false
    return out
  })
}

/** Judul yang seluruhnya huruf besar diubah menjadi huruf judul; selain itu apa adanya. */
export function tidyTitle(value) {
  const s = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  const letters = s.replace(/[^\p{L}]/gu, '')
  if (letters.length > 6 && letters === letters.toUpperCase())
    return titleCase(s)
  return s
}

/** Membuang awalan "... Nomor X Tahun Y tentang " bila judul sudah memuatnya. */
export function stripSubjectPrefix(judul) {
  const m = /^.{0,120}?\bnomor\s+\S+\s+tahun\s+\d{4}\s+tentang\s+(.+)$/is.exec(
    judul
  )
  return m ? m[1].trim() : judul
}

// Karakter khusus LIKE di-escape agar masukan pengguna tidak menjadi pola. Karakter escape
// SENGAJA "|", bukan backslash: dengan sql_mode NO_BACKSLASH_ESCAPES, `ESCAPE '\\'` berupa dua
// karakter dan kueri gagal (500). Pasangannya: `ESCAPE '|'` di repo.js.
export const LIKE_ESCAPE_CHAR = '|'
export const likeEscape = s => String(s).replace(/[|%_]/g, m => `|${m}`)

export function parseIdList(value) {
  return [
    ...new Set(
      String(value ?? '')
        .split(/[,;\s]+/)
        .map(x => Number(x))
        .filter(n => Number.isInteger(n) && n > 0 && n < 2_147_483_647)
    )
  ].slice(0, 20)
}

export const toInt = (v, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : d
}

export const dateOnly = v =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null

const bersih = v => {
  const s = String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return s === '' || s === '-' ? null : s
}
export const cleanText = bersih
