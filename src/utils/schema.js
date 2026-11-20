import { stripControl } from './chars.js'

// Validasi bentuk data dari server (OWASP A08: jangan percaya payload).
// Penormal memakai fungsi ini: nilai wajib yang rusak melempar SchemaError,
// nilai opsional yang rusak jatuh ke nilai cadangan.

export class SchemaError extends Error {
  constructor(where, message) {
    super(`${where}: ${message}`)
    this.name = 'SchemaError'
    this.where = where
  }
}

export const isObject = v =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

export function object(v, where) {
  if (!isObject(v)) throw new SchemaError(where, 'objek diharapkan')
  return v
}

export function list(v, where, { max = 500 } = {}) {
  if (!Array.isArray(v)) throw new SchemaError(where, 'larik diharapkan')
  return v.slice(0, max)
}

// Teks polos. Karakter kendali dibuang; panjang dibatasi.
export function text(v, where, { max = 2000, required = true } = {}) {
  if (v === undefined || v === null || v === '') {
    if (required) throw new SchemaError(where, 'teks wajib ada')
    return ''
  }
  if (typeof v !== 'string' && typeof v !== 'number') {
    if (required) throw new SchemaError(where, 'teks diharapkan')
    return ''
  }
  const clean = stripControl(String(v), '', { keepWhitespace: true })
  return clean.length > max ? clean.slice(0, max) : clean
}

export function optionalText(v, where, opts = {}) {
  const t = text(v, where, { ...opts, required: false })
  return t === '' ? null : t
}

export function integer(
  v,
  where,
  { min = 0, max = 1_000_000_000, required = true } = {}
) {
  const n = typeof v === 'string' && /^-?\d+$/.test(v) ? Number(v) : v
  if (Number.isInteger(n) && n >= min && n <= max) return n
  if (required) throw new SchemaError(where, 'bilangan bulat tidak valid')
  return null
}

export function bool(v) {
  return v === true || v === 1 || v === '1' || v === 'true'
}

export function oneOf(v, allowed, where, { fallback } = {}) {
  if (allowed.includes(v)) return v
  if (fallback !== undefined) return fallback
  throw new SchemaError(
    where,
    `nilai harus salah satu dari ${allowed.join(', ')}`
  )
}

// Tanggal ISO (YYYY-MM-DD). Nilai lain menjadi null.
export function isoDate(v) {
  if (typeof v !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (!m) return null
  const [mo, d] = [Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

// ID buram dari API: hanya angka atau slug huruf kecil, panjang dibatasi.
export function opaqueId(v, where) {
  const s = typeof v === 'number' ? String(v) : v
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(s)) {
    throw new SchemaError(where, 'ID tidak valid')
  }
  return s
}
