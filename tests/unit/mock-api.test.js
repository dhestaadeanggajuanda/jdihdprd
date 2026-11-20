import { describe, it, expect } from 'vitest'
import { DOKUMEN, JENIS } from '../../dev/mock-api/data.js'
import { handle, pdfBytes } from '../../dev/mock-api/handlers.js'
import {
  dokumenList,
  dokumenDetail,
  ringkasan,
  statistik,
  referensi,
  halamanList,
  halaman
} from '@/services/normalizers.js'

const q = (s = '') => new URLSearchParams(s)
const get = (path, search) => handle('GET', path, q(search))

describe('data contoh konsisten dengan mockup', () => {
  it('173 dokumen: 128 peraturan, 14 monografi, 9 artikel, 22 putusan', () => {
    const count = t => DOKUMEN.filter(d => d.tipe === t).length
    expect(DOKUMEN).toHaveLength(173)
    expect([
      count('peraturan'),
      count('monografi'),
      count('artikel'),
      count('putusan')
    ]).toEqual([128, 14, 9, 22])
  })
  it('41 Perda dan jumlah per jenis sesuai', () => {
    for (const j of JENIS)
      expect(DOKUMEN.filter(d => d.jenisKode === j.kode)).toHaveLength(j.jumlah)
  })
  it('status peraturan: 108 berlaku, 12 berlaku-diubah, 8 dicabut', () => {
    const p = DOKUMEN.filter(d => d.tipe === 'peraturan')
    expect(p.filter(d => d.status === 'dicabut')).toHaveLength(8)
    expect(p.filter(d => d.status === 'berlaku' && d.diubah)).toHaveLength(12)
    expect(p.filter(d => d.status === 'berlaku' && !d.diubah)).toHaveLength(108)
  })
  it('nomor unik per jenis dan tahun', () => {
    const seen = new Set()
    for (const d of DOKUMEN.filter(x => x.tipe === 'peraturan')) {
      const k = `${d.jenisKode}:${d.tahun}:${d.nomor}`
      expect(seen.has(k), k).toBe(false)
      seen.add(k)
    }
  })
})

describe('rute API palsu lolos penormal klien', () => {
  it('daftar dokumen dengan filter dan halaman', () => {
    const r = get('/dokumen', 'tipe=peraturan&jenis=perda&per_page=6&page=1')
    const { items, meta } = dokumenList(r.body)
    expect(items).toHaveLength(6)
    expect(meta).toMatchObject({
      total: 41,
      totalPages: 7,
      perPage: 6,
      sample: true
    })
    const dicabut = dokumenList(
      get('/dokumen', 'jenis=perda&status=dicabut').body
    )
    expect(dicabut.meta.total).toBe(3)
    const diubah = dokumenList(get('/dokumen', 'jenis=perda&diubah=1').body)
    expect(diubah.meta.total).toBe(5)
  })
  it('pencarian kata kunci dan nomor/tahun', () => {
    expect(
      dokumenList(get('/dokumen', 'q=retribusi pasar').body).items.length
    ).toBeGreaterThan(0)
    const nt = dokumenList(get('/dokumen', 'q=7/2019&jenis=perda').body)
    expect(nt.items.map(i => `${i.nomor}/${i.tahun}`)).toEqual(['7/2019'])
    expect(dokumenList(get('/dokumen', 'q=zzzzzz').body).items).toHaveLength(0)
  })
  it('detail dokumen kurasi berelasi', () => {
    const d3 = DOKUMEN.find(d => d.kurasi === 'd3')
    const detail = dokumenDetail(get(`/dokumen/${d3.id}`).body.data)
    expect(detail).toMatchObject({
      nomor: '7',
      tahun: 2019,
      status: 'berlaku',
      diubah: true,
      dilihat: 128
    })
    expect(detail.relasi.diubahOleh).toHaveLength(1)
    expect(detail.relasi.mencabut).toHaveLength(1)
    expect(detail.lampiran.map(l => l.peran)).toEqual(['utama', 'abstrak'])
  })
  it('ringkasan, statistik, referensi, halaman', () => {
    expect(
      ringkasan(get('/ringkasan').body).koleksi.map(k => k.jumlah)
    ).toEqual([128, 14, 9, 22])
    const s = statistik(get('/statistik').body)
    expect(s.kpi).toMatchObject({
      total: 173,
      peraturanBerlaku: 120,
      peraturanTotal: 128
    })
    expect(
      s.perTahun.filter(t => t.tahun >= 2015).reduce((n, t) => n + t.jumlah, 0)
    ).toBe(163)
    expect(s.perTahun.find(t => t.tahun === 2023).jumlah).toBe(24)
    expect(referensi(get('/referensi/jenis-peraturan').body)).toHaveLength(8)
    expect(halamanList(get('/halaman').body)).toHaveLength(8)
    expect(halaman(get('/halaman/dasar-hukum').body).isiHtml).toContain('<ol>')
  })
  it('galat: tidak ada, metode salah, mode error', () => {
    expect(get('/dokumen/99999').status).toBe(404)
    expect(get('/nama-ngawur').status).toBe(404)
    expect(handle('POST', '/dokumen', q()).status).toBe(405)
    expect(handle('GET', '/dokumen', q(), 'error').status).toBe(503)
  })
  it('lampiran hanya untuk ID yang cocok dan berupa PDF', () => {
    const d = DOKUMEN[0]
    const ok = get(`/dokumen/${d.id}/lampiran/f${d.id}`)
    expect(ok.status).toBe(200)
    expect(ok.binary.bytes.subarray(0, 5).toString()).toBe('%PDF-')
    expect(get(`/dokumen/${d.id}/lampiran/f999`).status).toBe(404)
    expect(get(`/dokumen/${d.id}/lampiran/..%2f..%2fetc`).status).toBe(404)
    expect(pdfBytes('x').length).toBeGreaterThan(100)
  })
})
