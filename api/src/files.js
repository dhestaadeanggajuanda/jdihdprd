// Lampiran: jalur berkas SELALU berasal dari database di sisi server, tidak pernah
// dari klien. Klien hanya memberi ID dokumen dan ID lampiran.
import { constants } from 'node:fs'
import { open, realpath } from 'node:fs/promises'
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

const OPEN_ACCESS = /^(terbuka|open|publik|public|umum|bebas)$/
const NO_RESTRICTION = /^(tidak|tanpa|none|no|terbuka|open)\b/

/**
 * Lampiran dibatasi kecuali kedua kolom jelas menyatakan sebaliknya (gagal-tertutup).
 * `akses_lampiran`: kosong atau "-" (tidak dinyatakan) atau nilai terbuka eksplisit; nilai
 * lain, termasuk yang tidak dikenal ("hanya anggota", "login", "1", "tidak terbuka"), dibatasi.
 * `pembatasan_lampiran`: kosong, "-", atau pernyataan "tanpa pembatasan"; isi lain = dibatasi.
 */
export function isRestricted(akses, pembatasan) {
  const a = String(akses ?? '')
    .trim()
    .toLowerCase()
  const p = String(pembatasan ?? '')
    .trim()
    .toLowerCase()
  if (a !== '' && a !== '-' && !OPEN_ACCESS.test(a)) return true
  if (p !== '' && p !== '-' && !NO_RESTRICTION.test(p)) return true
  return false
}

/**
 * Membuka berkas lokal di dalam `dir` (mencegah keluar folder lewat symlink).
 *
 * Berkas DIBUKA di sini (bukan oleh createReadStream yang membuka belakangan), sehingga semua
 * kegagalan membuka muncul sebelum respons dimulai dan penanganan galat tidak bercampur dengan
 * header unduhan.
 *  - tidak ada / bukan berkas biasa / di luar folder / symlink -> null (pemanggil menjawab 404)
 *  - EACCES/EPERM (berkas ada tetapi proses tidak boleh membacanya: salah izin atau pemilik pada
 *    volume) -> dilempar ulang: itu kesalahan konfigurasi server (500 dan tercatat di log), bukan
 *    "tidak ditemukan".
 */
export async function openLocal(dir, name) {
  if (!dir || !safeFileName(name)) return null
  let handle
  try {
    const root = await realpath(dir)
    const full = await realpath(join(root, name))
    if (!full.startsWith(root + sep)) return null
    // O_NOFOLLOW: jalur sudah kanonik; bila komponen akhirnya berubah menjadi symlink di antara
    // realpath dan open, pembukaan gagal (ELOOP) alih-alih mengikuti tautan keluar folder.
    handle = await open(full, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    const info = await handle.stat()
    if (!info.isFile()) {
      await handle.close()
      return null
    }
    return { stream: handle.createReadStream(), size: info.size }
  } catch (err) {
    await handle?.close().catch(() => {})
    if (err?.code === 'EACCES' || err?.code === 'EPERM') throw err
    return null
  }
}

export function attachmentName(name) {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
