// Aturan keamanan pada deploy/baota-locations.conf, dijaga sebagai tes statis supaya perubahan
// berikutnya tidak diam-diam melanggarnya (bukti perilaku nginx sungguhan ada di
// docs/deploy/frontend-baota.md, bagian Pengujian).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Jalur lewat node:path (bukan new URL): di lingkungan jsdom, URL milik jsdom salah menguraikan jalur file.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const read = p => readFileSync(resolve(ROOT, p), 'utf8')
const stripComments = s => s.replace(/(^|\s)#.*$/gm, '$1')

// Pecah isi file menjadi blok `location` tingkat atas { sel, body } (kurung kurawal bersarang
// seperti limit_except ikut ke dalam isi) dan sisa teks di luar blok.
function parseLocations(text) {
  const src = stripComments(text)
  const locs = []
  let rest = ''
  let i = 0
  const re = /location\s+((?:\^~|=|~\*?)\s+)?(\S+)\s*\{/y
  while (i < src.length) {
    re.lastIndex = i
    const m = re.exec(src)
    if (!m) {
      rest += src[i]
      i += 1
      continue
    }
    let depth = 1
    let j = re.lastIndex
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth += 1
      if (src[j] === '}') depth -= 1
      j += 1
    }
    locs.push({
      mod: (m[1] ?? '').trim(),
      path: m[2],
      body: src.slice(re.lastIndex, j - 1)
    })
    i = j
  }
  return { locs, rest: rest.trim() }
}

const raw = read('deploy/baota-locations.conf')
const { locs, rest } = parseLocations(raw)
const byKey = Object.fromEntries(
  locs.map(l => [`${l.mod} ${l.path}`.trim(), l])
)
const HDR_INCLUDE = /include\s+\S*jdih-security-headers\.conf\s*;/

describe('deploy/baota-locations.conf', () => {
  it('hanya berisi location (tanpa direktif di tingkat server)', () => {
    expect(rest).toBe('')
    expect(Object.keys(byKey).sort()).toEqual(
      [
        '/',
        '= /index.html',
        '^~ /api/',
        '^~ /assets/',
        '^~ /backend',
        '^~ /common/dokumen/',
        '^~ /feed/'
      ].sort()
    )
  })

  it('setiap location awalan non-SPA memakai ^~ (kebal terhadap location regex Baota)', () => {
    for (const k of [
      '^~ /api/',
      '^~ /backend',
      '^~ /feed/',
      '^~ /common/dokumen/',
      '^~ /assets/'
    ]) {
      expect(byKey[k], k).toBeDefined()
    }
    // Satu-satunya awalan polos adalah catch-all SPA.
    expect(
      locs.filter(l => l.mod === '' && l.path !== '/').map(l => l.path)
    ).toEqual([])
  })

  it('header keamanan SPA hanya di location SPA, dan di semuanya', () => {
    const spa = ['/', '= /index.html', '^~ /assets/']
    for (const k of spa) expect(byKey[k].body, k).toMatch(HDR_INCLUDE)
    for (const [k, l] of Object.entries(byKey)) {
      if (spa.includes(k)) continue
      expect(l.body, k).not.toMatch(HDR_INCLUDE)
      expect(l.body, k).not.toMatch(/add_header/)
    }
  })

  it('/api/: hanya GET/HEAD, XFF ditimpa $remote_addr, tujuan 127.0.0.1:3000', () => {
    const b = byKey['^~ /api/'].body
    expect(b).toMatch(/limit_except\s+GET\s+HEAD\s*\{\s*deny all;\s*\}/)
    expect(b).toMatch(/proxy_set_header X-Forwarded-For \$remote_addr;/)
    expect(b).not.toMatch(/proxy_add_x_forwarded_for/)
    expect(b).toMatch(/proxy_pass http:\/\/127\.0\.0\.1:3000;/)
  })

  it('ildis_app: tanpa limit_except, proxy_pass tanpa URI, tiga blok memuat baris proxy yang sama', () => {
    const keys = ['^~ /backend', '^~ /feed/', '^~ /common/dokumen/']
    const sections = keys.map(k => {
      const b = byKey[k].body
      expect(b, k).not.toMatch(/limit_except/)
      expect(b, k).toMatch(/proxy_pass http:\/\/127\.0\.0\.1:8080;/)
      return b.replace(/\s+/g, ' ').trim()
    })
    expect(new Set(sections).size).toBe(1)
    // Penanda SALIN-DARI-VHOST-LAMA ada di berkas mentah (tiga pasang).
    expect(raw.match(/>>> SALIN-DARI-VHOST-LAMA/g)?.length).toBe(3)
    expect(raw.match(/<<< SALIN-DARI-VHOST-LAMA/g)?.length).toBe(3)
  })

  it('SPA dan blok LAMA dibatasi penanda: ketiga location SPA berada di dalam SPA-MULAI..SPA-SELESAI', () => {
    const a = raw.indexOf('>>> SPA-MULAI')
    const b = raw.indexOf('<<< SPA-SELESAI')
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    const spa = raw.slice(a, b)
    expect(spa).toMatch(/location \^~ \/assets\/ \{/)
    expect(spa).toMatch(/location = \/index\.html \{/)
    expect(spa).toMatch(/^location \/ \{/m)
    // Di luar paket SPA tidak ada location SPA lagi.
    const outside = raw.slice(0, a) + raw.slice(b)
    expect(outside).not.toMatch(
      /^location (= \/index\.html|\/|\^~ \/assets\/) \{/m
    )
    // Blok LAMA ada, berkomentar seluruhnya.
    const c = raw.indexOf('>>> LAMA-MULAI')
    const d = raw.indexOf('<<< LAMA-SELESAI')
    expect(c).toBeGreaterThan(b)
    expect(d).toBeGreaterThan(c)
    // Isi di antara baris penanda (penandanya sendiri berada di baris komentar).
    const isi = raw.slice(raw.indexOf('\n', c), raw.lastIndexOf('\n', d))
    expect(isi).toMatch(/location \/ \{/)
    for (const line of isi.split('\n').filter(Boolean)) {
      expect(line.startsWith('#'), line).toBe(true)
    }
  })

  it('SPA: fallback ke index.html tanpa $uri/, aset berhash cache panjang, index no-cache', () => {
    expect(byKey['/'].body).toMatch(/try_files \$uri \/index\.html;/)
    expect(byKey['^~ /assets/'].body).toMatch(
      /Cache-Control "public, max-age=31536000, immutable" always/
    )
    expect(byKey['^~ /assets/'].body).toMatch(/try_files \$uri =404;/)
    expect(byKey['= /index.html'].body).toMatch(
      /Cache-Control "no-cache" always/
    )
  })
})

describe('deploy/nginx.conf (pembungkus vhost)', () => {
  const t = stripComments(read('deploy/nginx.conf'))
  it('meng-include baota-locations.conf, tanpa add_header dan tanpa location sendiri', () => {
    expect(t).toMatch(/include\s+\S*baota-locations\.conf\s*;/)
    expect(t).not.toMatch(/add_header/)
    expect(t).not.toMatch(/\blocation\b/)
    expect(t).toMatch(/server_name jdih\.dprd\.singkawangkota\.go\.id;/)
  })
})

describe('deploy/security-headers.conf', () => {
  it('memuat set header yang diharapkan dan tidak melonggarkan CSP', () => {
    const t = read('deploy/security-headers.conf')
    for (const h of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy'
    ]) {
      expect(t, h).toMatch(new RegExp(`add_header ${h} `))
    }
    expect(t).not.toMatch(/unsafe-eval/)
  })
})
