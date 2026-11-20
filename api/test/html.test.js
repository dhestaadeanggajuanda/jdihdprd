import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanHtml } from '../src/html.js'

test('mempertahankan struktur baca yang aman', () => {
  assert.equal(
    cleanHtml(
      '<h4>Judul</h4><p>Teks <strong>tebal</strong>.</p><ol><li>Satu</li></ol>'
    ),
    '<h4>Judul</h4><p>Teks <strong>tebal</strong>.</p><ol><li>Satu</li></ol>'
  )
})

test('membuang skrip beserta isinya, gaya, bingkai, gambar, formulir, dan svg', () => {
  const out = cleanHtml(
    '<p>a</p><script>window.__xss=1</script><style>body{display:none}</style><iframe src="https://x.test"></iframe>' +
      '<img src=x onerror=alert(1)><svg onload=alert(1)></svg><form action="https://evil.test"><input name=x></form><object data=x></object>'
  )
  assert.equal(out, '<p>a</p>')
})

test('membuang atribut event, style, id, class, dan data-*', () => {
  assert.equal(
    cleanHtml(
      '<p onclick="x()" style="color:red" id="a" class="b" data-x="1">t</p>'
    ),
    '<p>t</p>'
  )
})

test('tautan: hanya https, mailto, tel', () => {
  const out = cleanHtml(
    '<a href="javascript:alert(1)">1</a><a href="JaVaScRiPt:alert(1)">2</a><a href="data:text/html,x">3</a>' +
      '<a href="http://x.test">4</a><a href="//x.test">5</a><a href="https://x.test/a">ok</a><a href="mailto:a@b.id">m</a><a href="tel:+62561">t</a>'
  )
  assert.ok(!/javascript:|data:|http:\/\/|\/\/x\.test"/i.test(out), out)
  assert.ok(
    out.includes('href="https://x.test/a"') &&
      out.includes('mailto:a@b.id') &&
      out.includes('tel:+62561')
  )
})

test('<h1> diturunkan menjadi <h2>', () => {
  assert.equal(cleanHtml('<h1>Judul</h1>'), '<h2>Judul</h2>')
})

test('payload XSS kanonik tidak menyisakan skrip atau handler', () => {
  for (const p of [
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    '"><script>alert(1)</script>',
    '<iframe srcdoc="<script>alert(1)</script>">',
    '<details open ontoggle=alert(1)>',
    '<body onload=alert(1)>',
    '<math><mtext><table><mglyph><style><img src onerror=alert(1)>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<p style="background:url(javascript:alert(1))">x</p>'
  ]) {
    const out = cleanHtml(p)
    assert.ok(
      !/\son\w+\s*=|<script|<iframe|<svg|<img|javascript:|<style|<body/i.test(
        out
      ),
      `${p} -> ${out}`
    )
  }
})

test('nilai bukan string menjadi string kosong', () => {
  for (const v of [null, undefined, 42, {}])
    assert.equal(typeof cleanHtml(v), 'string')
  assert.equal(cleanHtml(null), '')
})
