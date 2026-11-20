import { describe, it, expect } from 'vitest'
import { htmlToText, truncate } from '@/utils/text.js'
import { formatDate, formatNumber, formatBytes } from '@/utils/format.js'

describe('htmlToText', () => {
  it('mendekode entitas WordPress menjadi teks polos', () => {
    expect(htmlToText('Dewan &#8211; Perda &amp; Perwali &#8217;24')).toBe(
      'Dewan – Perda & Perwali ’24'
    )
  })

  it('membuang tag dan tidak pernah menghasilkan markup', () => {
    const out = htmlToText(
      '<p>Halo <b>dunia</b><script>alert(1)</script><img src=x onerror=alert(1)></p>'
    )
    expect(out).toBe('Halo dunia')
    expect(out).not.toMatch(/[<>]/)
  })

  it('tidak mengeksekusi skrip atau memicu pemuatan gambar', () => {
    globalThis.__xss = 0
    htmlToText(
      '<img src="x" onerror="globalThis.__xss=1"><svg onload="globalThis.__xss=1">'
    )
    expect(globalThis.__xss).toBe(0)
  })

  it('nilai bukan string menjadi string kosong', () => {
    for (const v of [null, undefined, 12, {}, ''])
      expect(htmlToText(v)).toBe('')
  })
})

describe('truncate', () => {
  it('memotong di batas kata dan menambah elipsis', () => {
    const t = truncate(
      'satu dua tiga empat lima enam tujuh delapan sembilan sepuluh',
      30
    )
    expect(t.endsWith('…')).toBe(true)
    expect(t.length).toBeLessThanOrEqual(31)
    expect(t).not.toMatch(/\s…$/)
  })
  it('teks pendek tidak berubah', () => {
    expect(truncate('pendek', 50)).toBe('pendek')
  })
})

describe('format', () => {
  it('tanggal Indonesia', () => {
    expect(formatDate('2023-03-14')).toBe('14 Maret 2023')
    expect(formatDate('2019-08-01T10:00:00')).toBe('1 Agustus 2019')
    expect(formatDate('bukan tanggal')).toBe('')
    expect(formatDate('2023-13-01')).toBe('')
  })
  it('angka dengan titik ribuan', () => {
    expect(formatNumber(2416)).toBe('2.416')
    expect(formatNumber(173)).toBe('173')
    expect(formatNumber(1234567)).toBe('1.234.567')
    expect(formatNumber(NaN)).toBe('')
  })
  it('ukuran berkas dengan koma desimal', () => {
    expect(formatBytes(840 * 1024)).toBe('840 KB')
    expect(formatBytes(1.2 * 1024 * 1024)).toBe('1,2 MB')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(-1)).toBe('')
  })
})
