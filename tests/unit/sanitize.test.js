import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { sanitizeHtml } from '@/utils/sanitize.js'
import SafeHtml from '@/components/SafeHtml.vue'

const html = s => sanitizeHtml(s)

beforeEach(() => {
  globalThis.__xss = 0
})

describe('sanitizeHtml (isi halaman dari backend)', () => {
  it('mempertahankan struktur baca yang aman', () => {
    const out = html(
      '<h2>Judul</h2><p>Teks <strong>tebal</strong> dan <em>miring</em>.</p><ol><li>Satu</li><li>Dua</li></ol>'
    )
    expect(out).toContain('<h2>Judul</h2>')
    expect(out).toContain('<strong>tebal</strong>')
    expect(out).toContain('<ol><li>Satu</li><li>Dua</li></ol>')
  })

  it('membuang skrip, gaya, bingkai, objek, gambar, formulir, dan svg', () => {
    const out = html(
      '<p>a</p><script>window.__xss=1</script><style>body{display:none}</style>' +
        '<iframe src="https://example.com"></iframe><object data="x"></object><embed src="x">' +
        '<img src=x onerror="window.__xss=1"><svg onload="window.__xss=1"></svg>' +
        '<form action="https://evil.com"><input name="x"></form><math><mi>x</mi></math>'
    )
    for (const tag of [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'img',
      'svg',
      'form',
      'input',
      'math'
    ]) {
      expect(out, tag).not.toMatch(new RegExp(`<${tag}\\b`, 'i'))
    }
    expect(out).toContain('<p>a</p>')
  })

  it('membuang atribut event, style, id, class, dan data-*', () => {
    const out = html(
      '<p onclick="window.__xss=1" style="color:red" id="x" class="y" data-a="b" onmouseover="x()">t</p>'
    )
    expect(out).toBe('<p>t</p>')
  })

  it('tautan: hanya https, mailto, dan tel', () => {
    const out = html(
      '<a href="javascript:window.__xss=1">js</a>' +
        '<a href="JaVaScRiPt:alert(1)">js2</a>' +
        '<a href="data:text/html,<script>alert(1)</script>">data</a>' +
        '<a href="vbscript:x">vb</a>' +
        '<a href="http://example.com">http</a>' +
        '<a href="/relatif">rel</a>' +
        '<a href="https://example.com/a">ok</a>' +
        '<a href="mailto:a@b.id">mail</a>' +
        '<a href="tel:+62561">tel</a>'
    )
    expect(out).not.toMatch(/javascript:|vbscript:|data:|http:\/\//i)
    expect(out).not.toContain('href="/relatif"')
    expect(out).toContain('href="https://example.com/a"')
    expect(out).toContain('href="mailto:a@b.id"')
    expect(out).toContain('href="tel:+62561"')
  })

  it('tautan https dibuka di tab baru dengan rel noopener noreferrer', () => {
    const out = html('<a href="https://example.com/a">x</a>')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('target pada tautan non-https tidak dipertahankan', () => {
    const out = html('<a href="mailto:a@b.id" target="_blank">x</a>')
    expect(out).not.toContain('target=')
  })

  it('payload XSS kanonik tidak menghasilkan kode yang bisa berjalan', () => {
    const payloads = [
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
      '"><script>alert(1)</script>',
      '<iframe srcdoc="<script>alert(1)</script>">',
      '<a href="  javascript:alert(1)">x</a>',
      '<a href="&#106;avascript:alert(1)">x</a>',
      '<details open ontoggle=alert(1)>',
      '<body onload=alert(1)>',
      '<input autofocus onfocus=alert(1)>',
      '<math><mtext><table><mglyph><style><img src onerror=alert(1)>',
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
      '<p style="background:url(javascript:alert(1))">x</p>'
    ]
    for (const p of payloads) {
      const out = html(p)
      expect(out, p).not.toMatch(
        /\son\w+\s*=|<script|<iframe|<svg|<img|javascript:|<style|<input|<body/i
      )
    }
  })

  it('<h1> di dalam isi diturunkan menjadi <h2> (halaman sudah punya <h1>)', () => {
    const out = html('<h1>Judul ganda</h1><p>x</p>')
    expect(out).toBe('<h2>Judul ganda</h2><p>x</p>')
  })

  it('nilai bukan string atau kosong menjadi string kosong', () => {
    for (const v of [null, undefined, 42, {}, '']) expect(html(v)).toBe('')
  })
})

describe('SafeHtml.vue', () => {
  it('menampilkan hasil pembersihan, bukan HTML mentah', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(SafeHtml, {
      html: '<p>aman</p><img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'
    })
    app.mount(host)
    expect(host.querySelector('p')?.textContent).toBe('aman')
    expect(host.querySelector('img')).toBeNull()
    expect(host.querySelector('script')).toBeNull()
    expect(globalThis.__xss).toBe(0)
    app.unmount()
    host.remove()
  })
})
