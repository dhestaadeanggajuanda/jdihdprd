import { describe, it, expect } from 'vitest'
import {
  PESAN_BAWAAN,
  PESAN_MAX,
  pesanDokumen,
  whatsappUrl
} from '@/utils/whatsapp.js'

describe('whatsappUrl', () => {
  it('membentuk tautan wa.me dengan pesan ter-encode', () => {
    expect(whatsappUrl('6281234567890', 'Halo & selamat')).toBe(
      'https://wa.me/6281234567890?text=Halo%20%26%20selamat'
    )
  })

  it('pesan kosong memakai pesan bawaan', () => {
    const url = whatsappUrl('6281234567890', '   ')
    expect(url).toBe(
      `https://wa.me/6281234567890?text=${encodeURIComponent(PESAN_BAWAAN)}`
    )
    expect(whatsappUrl('6281234567890')).toBe(url)
  })

  it('nomor tidak valid: kosong (tidak pernah membentuk tautan)', () => {
    for (const n of [
      '',
      null,
      undefined,
      'abc',
      '0812345678',
      '1234567',
      '12345678901234567',
      '62812/../x'
    ]) {
      expect(whatsappUrl(n), String(n)).toBe('')
    }
  })

  it('membuang karakter kendali dan memotong pesan panjang', () => {
    const url = whatsappUrl('6281234567890', `a\r\nb${'x'.repeat(1000)}`)
    const teks = decodeURIComponent(url.split('?text=')[1])
    expect(teks.startsWith('a b')).toBe(true)
    expect(teks.length).toBeLessThanOrEqual(PESAN_MAX)
    expect(url).not.toMatch(/%0[AD]/i)
  })

  it('selalu https://wa.me dan tidak membawa kueri tambahan', () => {
    const url = whatsappUrl('6281234567890', 'a&text=b&phone=1')
    expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
    expect(new URL(url).searchParams.get('phone')).toBeNull()
  })
})

describe('pesanDokumen', () => {
  it('memuat judul dan tautan dokumen', () => {
    expect(
      pesanDokumen('Perda 7/2019', 'https://jdih.contoh.go.id/dokumen/117')
    ).toBe(
      'Halo, saya ingin bertanya tentang Perda 7/2019. https://jdih.contoh.go.id/dokumen/117'
    )
  })

  it('judul kosong memakai pesan bawaan; judul panjang dipotong', () => {
    expect(pesanDokumen('', 'https://x.test/')).toBe(PESAN_BAWAAN)
    expect(pesanDokumen('a'.repeat(500), 'https://x.test/')).toContain(
      'a'.repeat(200)
    )
    expect(pesanDokumen('a'.repeat(500), '').length).toBeLessThan(260)
  })
})
