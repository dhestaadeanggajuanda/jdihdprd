import { describe, it, expect } from 'vitest'
import {
  parseWhatsapp,
  parseAsistenUrl,
  parseKebijakan,
  isKebijakanLengkap,
  KEBIJAKAN_MAX_LENGTH
} from '@/config/env.js'

describe('parseWhatsapp (JDIH_WHATSAPP)', () => {
  it('menerima nomor internasional dan membuang pemisah', () => {
    expect(parseWhatsapp('6281234567890')).toBe('6281234567890')
    expect(parseWhatsapp('+62 812-3456-7890')).toBe('6281234567890')
    expect(parseWhatsapp('(+62) 812.3456.7890')).toBe('6281234567890')
  })

  it('mengubah awalan 0 (nomor lokal) menjadi 62 dan membuang awalan 00', () => {
    expect(parseWhatsapp('081234567890')).toBe('6281234567890')
    expect(parseWhatsapp('0062 812 3456 7890')).toBe('6281234567890')
  })

  it('kosong atau tidak terdefinisi: kosong (tombol tidak tampil)', () => {
    for (const v of [undefined, null, '', '   ']) {
      expect(parseWhatsapp(v)).toBe('')
    }
  })

  it('menolak huruf, panjang di luar batas E.164, dan sisipan URL', () => {
    for (const v of [
      'abc',
      '62812abc',
      '1234567', // 7 angka
      '1234567890123456', // 16 angka
      'https://wa.me/6281234567890',
      '6281234567890?text=x',
      '62812<script>',
      '0'
    ]) {
      expect(parseWhatsapp(v), String(v)).toBe('')
    }
  })

  it('nilai mirip angka dari Quasar tetap dicast ke string', () => {
    expect(parseWhatsapp(6281234567890)).toBe('6281234567890')
  })
})

describe('parseAsistenUrl (JDIH_ASISTEN_URL)', () => {
  it('menerima jalur satu origin', () => {
    expect(parseAsistenUrl('/asisten/chat')).toBe('/asisten/chat')
    expect(parseAsistenUrl('  /asisten/chat  ')).toBe('/asisten/chat')
    // Nilai dari berkas .env bisa membawa baris baru di ujung.
    expect(parseAsistenUrl('/asisten/chat\n')).toBe('/asisten/chat')
    expect(parseAsistenUrl('/chat')).toBe('/chat')
  })

  it('kosong atau tidak terdefinisi: kosong (Asisten tidak dirender)', () => {
    for (const v of [undefined, null, '', '   ']) {
      expect(parseAsistenUrl(v)).toBe('')
    }
  })

  it('menolak alamat penuh, jalur relatif protokol, penelusuran naik, dan kueri', () => {
    for (const v of [
      'https://asisten.contoh.go.id/chat',
      'http://localhost:8000/chat',
      '//evil.test/chat',
      '/asisten/../api/v1',
      '/asisten/./chat',
      '/asisten/chat?x=1',
      '/asisten/chat#x',
      '/asisten//chat',
      'asisten/chat',
      '/',
      '/a b',
      '/asisten/ch\nat',
      'javascript:alert(1)'
    ]) {
      expect(parseAsistenUrl(v), String(v)).toBe('')
    }
  })
})

describe('parseKebijakan dan isKebijakanLengkap', () => {
  const penuh = {
    berlaku: '1 Januari 2027',
    diperbarui: '1 Januari 2027',
    kontak: 'Sekretariat DPRD, jdih@contoh.go.id',
    simpanLog: '90 hari',
    asistenLokasi: 'server instansi',
    asistenSimpan: '30 hari'
  }

  it('merapikan spasi dan membuang karakter kendali', () => {
    expect(parseKebijakan({ kontak: '  a \t b\n' }).kontak).toBe('a b')
    expect(parseKebijakan({ kontak: 'x\u0000y' }).kontak).toBe('x y')
  })

  it('mengosongkan isian yang terlalu panjang atau tidak terdefinisi', () => {
    expect(
      parseKebijakan({ kontak: 'a'.repeat(KEBIJAKAN_MAX_LENGTH + 1) }).kontak
    ).toBe('')
    expect(parseKebijakan({}).kontak).toBe('')
    expect(parseKebijakan().berlaku).toBe('')
    expect(parseKebijakan({ kontak: 123 }).kontak).toBe('123')
  })

  it('lengkap bila semua isian yang dipakai terisi', () => {
    const k = parseKebijakan(penuh)
    expect(isKebijakanLengkap(k, { asisten: true })).toBe(true)
    expect(isKebijakanLengkap(k, { asisten: false })).toBe(true)
  })

  it('isian Asisten hanya wajib bila Asisten aktif', () => {
    const k = parseKebijakan({
      ...penuh,
      asistenLokasi: '',
      asistenSimpan: ''
    })
    expect(isKebijakanLengkap(k, { asisten: false })).toBe(true)
    expect(isKebijakanLengkap(k, { asisten: true })).toBe(false)
  })

  it('satu isian umum kosong membuat naskah masih "contoh"', () => {
    for (const kunci of ['berlaku', 'diperbarui', 'kontak', 'simpanLog']) {
      const k = parseKebijakan({ ...penuh, [kunci]: '' })
      expect(isKebijakanLengkap(k, { asisten: false }), kunci).toBe(false)
    }
  })
})
