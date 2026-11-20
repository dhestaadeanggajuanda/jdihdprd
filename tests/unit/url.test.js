import { describe, it, expect } from 'vitest'
import { safeExternalUrl } from '@/utils/url.js'

const HOSTS = ['mediacenter.singkawangkota.go.id']
const ok = u => safeExternalUrl(u, HOSTS)

describe('safeExternalUrl (allowlist tautan dan gambar)', () => {
  it('menerima https ke host yang terdaftar', () => {
    expect(ok('https://mediacenter.singkawangkota.go.id/berita/x/')).toBe(
      'https://mediacenter.singkawangkota.go.id/berita/x/'
    )
    expect(ok('HTTPS://MediaCenter.SingkawangKota.go.id/a')).toBe(
      'https://mediacenter.singkawangkota.go.id/a'
    )
    expect(ok('https://mediacenter.singkawangkota.go.id:443/a')).toContain('/a')
  })

  it('menolak skema selain https', () => {
    for (const u of [
      'http://mediacenter.singkawangkota.go.id/a',
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://mediacenter.singkawangkota.go.id/',
      'vbscript:msgbox(1)'
    ]) {
      expect(ok(u), u).toBeNull()
    }
  })

  it('menolak URL relatif dan protocol-relative', () => {
    for (const u of [
      '//mediacenter.singkawangkota.go.id/a',
      '/berita',
      'berita/x',
      '?a=1',
      ''
    ]) {
      expect(ok(u), u).toBeNull()
    }
  })

  it('menolak kebingungan subdomain dan host mirip', () => {
    for (const u of [
      'https://mediacenter.singkawangkota.go.id.evil.com/a',
      'https://evilmediacenter.singkawangkota.go.id/a',
      'https://evil.com/mediacenter.singkawangkota.go.id',
      'https://x.mediacenter.singkawangkota.go.id/a',
      'https://singkawangkota.go.id/a'
    ]) {
      expect(ok(u), u).toBeNull()
    }
  })

  it('menolak userinfo, port selain bawaan, titik di akhir host, dan punycode', () => {
    for (const u of [
      'https://user:pass@mediacenter.singkawangkota.go.id/a',
      'https://evil.com@mediacenter.singkawangkota.go.id/a',
      'https://mediacenter.singkawangkota.go.id@evil.com/a',
      'https://mediacenter.singkawangkota.go.id:8443/a',
      'https://mediacenter.singkawangkota.go.id./a',
      'https://xn--mediacenter-singkawangkota-go-id.com/a'
    ]) {
      expect(ok(u), u).toBeNull()
    }
  })

  it('menolak literal IP, IPv6, metadata cloud, dan bentuk IP yang disamarkan', () => {
    for (const u of [
      'https://127.0.0.1/',
      'https://[::1]/',
      'https://[::ffff:127.0.0.1]/',
      'https://2130706433/',
      'https://0x7f000001/',
      'https://0177.0.0.1/',
      'https://0010.0.0.1/',
      'https://169.254.169.254/latest/meta-data/',
      'https://metadata.google.internal/',
      'https://metadata.google.internal./',
      'https://localhost/',
      'https://localhost./',
      'https://100.64.0.1/',
      'https://[fe80::1]/',
      'https://[fc00::1]/'
    ]) {
      expect(ok(u), u).toBeNull()
    }
  })

  it('menolak karakter kendali, backslash, dan nilai bukan string', () => {
    for (const u of [
      'https://mediacenter.singkawangkota.go.id/a\nb',
      'https://mediacenter.singkawangkota.go.id\\@evil.com/',
      'https://mediacenter.singkawangkota.go.id/\u0000',
      null,
      undefined,
      42,
      {},
      'https://mediacenter.singkawangkota.go.id/' + 'a'.repeat(2100)
    ]) {
      expect(ok(u)).toBeNull()
    }
  })
})
