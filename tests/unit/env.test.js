import { describe, it, expect } from 'vitest'
import {
  parseNewsFilter,
  DEFAULT_NEWS_FILTER,
  NEWS_FILTER_LIMITS,
  parseContact,
  CONTACT_LIMITS
} from '@/config/env.js'

describe('parseNewsFilter (JDIH_NEWS_FILTER)', () => {
  it('memisah koma dan merapikan spasi', () => {
    expect(parseNewsFilter('produk hukum,  peraturan ,dewan')).toEqual([
      'produk hukum',
      'peraturan',
      'dewan'
    ])
    expect(parseNewsFilter('produk   hukum')).toEqual(['produk hukum'])
  })

  it('kosong atau tidak terdefinisi kembali ke bawaan', () => {
    for (const v of [undefined, null, '', '   ', ',,,']) {
      expect(parseNewsFilter(v)).toEqual(DEFAULT_NEWS_FILTER)
    }
  })

  it('Quasar dapat mengubah nilai mirip angka: tetap dicast ke string', () => {
    expect(parseNewsFilter(2024)).toEqual(['2024'])
  })

  it('membuang entri dengan karakter berbahaya bagi URL atau pencarian', () => {
    const bad = [
      'a"b',
      'x&y=1',
      'a<b>',
      'p#q',
      'a/b',
      "a'b",
      'a%20b',
      'a;b',
      '../x'
    ]
    for (const b of bad) {
      expect(parseNewsFilter(`${b},peraturan`)).toEqual(['peraturan'])
    }
  })

  it('menerima huruf Unicode, angka, dan tanda hubung', () => {
    expect(parseNewsFilter('perda no-3, ekonomi kreatif, APBD 2027')).toEqual([
      'perda no-3',
      'ekonomi kreatif',
      'APBD 2027'
    ])
  })

  it('membatasi panjang entri dan jumlah entri', () => {
    const long = 'a'.repeat(NEWS_FILTER_LIMITS.maxLength + 1)
    expect(parseNewsFilter(`${long},peraturan`)).toEqual(['peraturan'])
    expect(parseNewsFilter('a,peraturan')).toEqual(['peraturan'])
    const many = Array.from({ length: 12 }, (_, i) => `kata${i}`).join(',')
    expect(parseNewsFilter(many)).toHaveLength(NEWS_FILTER_LIMITS.maxTerms)
  })

  it('membuang duplikat tanpa peduli huruf besar-kecil', () => {
    expect(parseNewsFilter('DPRD,dprd,Dprd')).toEqual(['DPRD'])
  })

  it('seluruhnya tidak valid kembali ke bawaan', () => {
    expect(parseNewsFilter('"; DROP,<script>')).toEqual(DEFAULT_NEWS_FILTER)
  })
})

describe('parseContact (JDIH_FOOTER_CONTACT)', () => {
  it('memisah baris dengan "|" dan membuang baris kosong', () => {
    expect(parseContact('Jl. Contoh No. 1||  Singkawang  ')).toEqual([
      { text: 'Jl. Contoh No. 1', href: null },
      { text: 'Singkawang', href: null }
    ])
  })

  it('surel dan telepon yang berdiri sendiri menjadi tautan', () => {
    expect(
      parseContact('jdih@contoh.go.id|(0562) 123 456|+62 562 12345')
    ).toEqual([
      { text: 'jdih@contoh.go.id', href: 'mailto:jdih@contoh.go.id' },
      { text: '(0562) 123 456', href: 'tel:0562123456' },
      { text: '+62 562 12345', href: 'tel:+6256212345' }
    ])
  })

  it('teks yang hanya memuat surel di tengah kalimat tetap teks biasa', () => {
    expect(parseContact('Surel: jdih@contoh.go.id')[0].href).toBeNull()
  })

  it('kosong atau tidak terdefinisi menghasilkan daftar kosong', () => {
    for (const v of [undefined, null, '', '  ', '|||'])
      expect(parseContact(v)).toEqual([])
  })

  it('membuang karakter kendali dan membatasi panjang dan jumlah baris', () => {
    expect(parseContact('A\u0000B')[0].text).toBe('A B')
    expect(parseContact('x'.repeat(CONTACT_LIMITS.maxLength + 1))).toEqual([])
    const many = Array.from({ length: 12 }, (_, i) => `baris ${i}`).join('|')
    expect(parseContact(many)).toHaveLength(CONTACT_LIMITS.maxLines)
  })
})
