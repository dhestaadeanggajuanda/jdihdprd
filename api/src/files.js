// Lampiran: jalur berkas SELALU berasal dari database di sisi server, tidak pernah
// dari klien. Klien hanya memberi ID dokumen dan ID lampiran.
import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { join, sep } from 'node:path'

const EXT_TYPE = Object.freeze({
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif'
})
export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

// Nama berkas aman: tanpa pemisah jalur, tanpa "..", karakter terbatas, ekstensi diizinkan.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N}._ ()+,%-]{0,198}\.[A-Za-z0-9]{2,5}$/u

export function safeFileName(name) {
  if (typeof name !== 'string' || name.includes('..') || !NAME_RE.test(name))
    return null
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  return EXT_TYPE[ext] ? name : null
}

export const extOf = name => name.slice(name.lastIndexOf('.') + 1).toLowerCase()
export const contentTypeOf = name =>
  EXT_TYPE[extOf(name)] ?? 'application/octet-stream'

/**
 * Menentukan sumber lampiran dari nilai url_lampiran:
 *  - URL https penuh ke host yang diizinkan  -> { kind: 'redirect', url }
 *  - ".../common/dokumen/<berkas>" pada host lain (mis. sisa localhost) atau nama berkas biasa
 *      -> { kind: 'local', name }
 *  - selain itu -> null (tidak disajikan)
 */
export function resolveLampiran(urlLampiran, redirectHosts) {
  const raw = String(urlLampiran ?? '').trim()
  if (raw === '' || raw.length > 600) return null

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    let url
    try {
      url = new URL(raw)
    } catch {
      return null
    }
    if (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      redirectHosts.includes(url.hostname.toLowerCase())
    ) {
      return { kind: 'redirect', url: url.href }
    }
    const m = /\/common\/dokumen\/([^/?#]+)$/.exec(url.pathname)
    let decoded = null
    try {
      decoded = m ? decodeURIComponent(m[1]) : null
    } catch {
      return null // persen-encoding rusak di data: lampiran tidak disajikan, bukan 500
    }
    const name = decoded ? safeFileName(decoded) : null
    return name ? { kind: 'local', name } : null
  }

  // Nama berkas atau jalur relatif: hanya nama berkas terakhir yang dipakai.
  const base = raw.split(/[\\/]/).pop()
  const name = safeFileName(base)
  return name ? { kind: 'local', name } : null
}

/** Lampiran dibatasi bila kolom akses/pembatasan menyatakannya (aturan konservatif). */
export function isRestricted(akses, pembatasan) {
  const a = String(akses ?? '')
    .trim()
    .toLowerCase()
  const p = String(pembatasan ?? '')
    .trim()
    .toLowerCase()
  if (/(tertutup|terbatas|privat|private|dibatasi|restricted|closed)/.test(a))
    return true
  if (p !== '' && p !== '-' && !/^(tidak|tanpa|none|no|terbuka|open)\b/.test(p))
    return true
  return false
}

/** Membuka berkas lokal di dalam `dir` (mencegah keluar folder lewat symlink). */
export async function openLocal(dir, name) {
  if (!dir || !safeFileName(name)) return null
  try {
    const root = await realpath(dir)
    const full = await realpath(join(root, name))
    if (!full.startsWith(root + sep)) return null
    const info = await stat(full)
    if (!info.isFile()) return null
    return { stream: createReadStream(full), size: info.size }
  } catch {
    return null
  }
}

export function attachmentName(name) {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
