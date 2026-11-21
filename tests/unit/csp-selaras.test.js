// CSP di <meta> (quasar.config.js -> htmlVariables.csp) dan di header nginx
// (deploy/security-headers.conf) harus selaras: header = meta + frame-ancestors (yang tidak bisa
// lewat <meta>). Selisih membuat satu jalur lebih longgar dari yang diaudit.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_ORIGIN, MEDIACENTER_ORIGIN } from '@/config/hosts.js'

// Jalur lewat node:path (bukan new URL): di lingkungan jsdom, URL milik jsdom salah menguraikan jalur file.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const read = p => readFileSync(resolve(ROOT, p), 'utf8')

const parse = csp =>
  new Map(
    csp
      .split(';')
      .map(d => d.trim())
      .filter(Boolean)
      .map(d => {
        const [name, ...values] = d.split(/\s+/)
        return [name, values.sort().join(' ')]
      })
  )

// quasar.config.js memakai `defineConfig` dari #q-app (tidak bisa diimpor di sini), jadi daftar
// direktif produksi dibaca dari sumbernya: elemen larik `csp` yang berupa literal, tanpa yang bergantung
// pada ctx.dev.
function metaCsp() {
  const src = read('quasar.config.js')
  const block = src.match(/const csp = \[([\s\S]*?)\]\.join\('; '\)/)?.[1]
  if (!block) throw new Error('larik csp tidak ditemukan di quasar.config.js')
  const parts = []
  for (const line of block.split('\n')) {
    const m = line.trim().match(/^(["'`])(.*)\1,?$/)
    if (!m) continue // baris `...(ctx.dev ? ...)`
    parts.push(
      m[2]
        .replaceAll('${API_ORIGIN}', API_ORIGIN)
        .replaceAll('${MEDIACENTER_ORIGIN}', MEDIACENTER_ORIGIN)
        .replaceAll(
          "${connect.join(' ')}",
          `'self' ${API_ORIGIN} ${MEDIACENTER_ORIGIN}`
        )
    )
  }
  return parts.join('; ')
}

function headerCsp() {
  const m = read('deploy/security-headers.conf').match(
    /add_header Content-Security-Policy "([^"]+)"/
  )
  if (!m) throw new Error('CSP tidak ditemukan di security-headers.conf')
  return m[1]
}

describe('CSP: meta (index.html) selaras dengan header nginx', () => {
  const meta = parse(metaCsp())
  const header = parse(headerCsp())

  it('semua direktif meta ada di header dengan nilai yang sama', () => {
    expect(meta.size).toBeGreaterThanOrEqual(8)
    for (const [name, value] of meta) {
      expect(header.get(name), name).toBe(value)
    }
  })

  it('header hanya menambah frame-ancestors', () => {
    const extra = [...header.keys()].filter(k => !meta.has(k))
    expect(extra).toEqual(['frame-ancestors'])
    expect(header.get('frame-ancestors')).toBe("'none'")
  })

  it('tidak ada unsafe-eval/unsafe-inline pada script-src, dan koneksi hanya ke dua origin', () => {
    expect(header.get('script-src')).toBe("'self'")
    expect(header.get('connect-src')).toBe(
      ["'self'", API_ORIGIN, MEDIACENTER_ORIGIN].sort().join(' ')
    )
  })
})
