import { describe, it, expect } from 'vitest'
import {
  isValidId,
  isValidSlug,
  parseListQuery,
  toRouteQuery,
  toApiParams,
  countActiveFilters,
  DEFAULT_FILTERS
} from '@/utils/validators.js'

describe('parameter rute', () => {
  it('ID hanya angka 1 sampai 10 digit', () => {
    expect(isValidId('7')).toBe(true)
    expect(isValidId('1234567890')).toBe(true)
    for (const v of [
      '',
      '0x1',
      '1;DROP',
      '../1',
      '12345678901',
      '-1',
      '1.5',
      ' 1',
      7,
      null
    ]) {
      expect(isValidId(v), String(v)).toBe(false)
    }
  })
  it('slug huruf kecil, angka, tanda hubung', () => {
    expect(isValidSlug('dasar-hukum')).toBe(true)
    for (const v of [
      'Dasar',
      'a b',
      'a/b',
      '../x',
      '',
      'a'.repeat(121),
      'a_b'
    ]) {
      expect(isValidSlug(v), v).toBe(false)
    }
  })
})

describe('parseListQuery', () => {
  it('nilai kosong memberi bawaan', () => {
    expect(parseListQuery({})).toEqual(DEFAULT_FILTERS)
  })

  it('menerima nilai valid', () => {
    const f = parseListQuery({
      q: 'retribusi pasar',
      tipe: 'peraturan',
      jenis: 'perda',
      status: 'berlaku',
      diubah: '1',
      nomor: '7',
      tahun_dari: '2012',
      tahun_sampai: '2023',
      subyek: 'pajak',
      sort: 'nomor',
      page: '3'
    })
    expect(f).toMatchObject({
      q: 'retribusi pasar',
      jenis: 'perda',
      status: 'berlaku',
      diubah: true,
      nomor: '7',
      tahun_dari: '2012',
      tahun_sampai: '2023',
      sort: 'nomor',
      page: 3
    })
  })

  it('membuang nilai tidak valid dan kembali ke bawaan', () => {
    const f = parseListQuery({
      q: 'a',
      tipe: 'rahasia',
      jenis: 'Perda;DROP',
      status: 'x',
      nomor: '<script>',
      tahun_dari: '20x2',
      tahun_sampai: '1800',
      sort: 'acak',
      page: '-5'
    })
    expect(f).toEqual(DEFAULT_FILTERS)
  })

  it('membatasi halaman dan panjang kata kunci, membuang karakter kendali', () => {
    expect(parseListQuery({ page: '1001' }).page).toBe(1)
    expect(parseListQuery({ page: '1000' }).page).toBe(1000)
    expect(parseListQuery({ q: 'x'.repeat(500) }).q).toHaveLength(100)
    expect(parseListQuery({ q: 'pa\u0000jak\npasar' }).q).toBe('pa jak pasar')
  })

  it('parameter berulang (larik) memakai nilai pertama', () => {
    expect(
      parseListQuery({ jenis: ['perda', 'perwali'], page: ['2', '9'] })
    ).toMatchObject({
      jenis: 'perda',
      page: 2
    })
  })
})

describe('kueri URL dan API', () => {
  it('toRouteQuery tidak menulis nilai bawaan', () => {
    expect(toRouteQuery(DEFAULT_FILTERS)).toEqual({})
    expect(
      toRouteQuery({ ...DEFAULT_FILTERS, q: 'pasar', page: 2, diubah: true })
    ).toEqual({
      q: 'pasar',
      page: '2',
      diubah: '1'
    })
  })
  it('toApiParams selalu memuat tipe, halaman, dan per_page', () => {
    expect(
      toApiParams({ ...DEFAULT_FILTERS, q: 'pasar' }, { perPage: 10 })
    ).toEqual({
      q: 'pasar',
      tipe: 'peraturan',
      page: 1,
      per_page: 10
    })
  })
  it('countActiveFilters tidak menghitung kata kunci, tipe, dan urutan', () => {
    expect(
      countActiveFilters({ ...DEFAULT_FILTERS, q: 'x', sort: 'nomor' })
    ).toBe(0)
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        jenis: 'perda',
        tahun_dari: '2012',
        tahun_sampai: '2023'
      })
    ).toBe(2)
  })
})
