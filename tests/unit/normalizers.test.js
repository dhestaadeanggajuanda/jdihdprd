import { describe, it, expect } from 'vitest'
import {
  dokumenRingkas,
  dokumenDetail,
  dokumenList,
  pageMeta,
  statistik
} from '@/services/normalizers.js'
import { SchemaError } from '@/utils/schema.js'
import { statusBadges, judulNomor } from '@/utils/dokumen.js'

const RAW = {
  id: '3',
  tipe: 'peraturan',
  jenis: 'Peraturan Daerah',
  singkatan: 'Perda',
  nomor: '7',
  tahun: 2019,
  judul: 'Retribusi Pelayanan Pasar',
  status: 'berlaku',
  diubah: true,
  riwayat: 'Diubah oleh Peraturan Daerah Nomor 5 Tahun 2022',
  tanggal_penetapan: '2019-08-21',
  pemrakarsa: 'Pemerintah Kota Singkawang',
  berkas: { lampiran_id: 'a1b2', ukuran: 1048576 },
  kolom_internal: 'tidak boleh lolos',
  password_hash: 'rahasia'
}

describe('dokumenRingkas', () => {
  it('memetakan kolom dan membuang kolom yang tidak dikenal (allowlist)', () => {
    const d = dokumenRingkas(RAW)
    expect(d).toMatchObject({
      id: '3',
      tipe: 'peraturan',
      nomor: '7',
      tahun: 2019,
      status: 'berlaku',
      diubah: true,
      tanggalPenetapan: '2019-08-21',
      berkas: { lampiranId: 'a1b2', ukuran: 1048576, tipe: 'pdf' }
    })
    expect(JSON.stringify(d)).not.toMatch(/rahasia|kolom_internal|password/)
  })

  it('status tidak dikenal menjadi null, tipe tidak dikenal menolak', () => {
    expect(dokumenRingkas({ ...RAW, status: 'aneh' }).status).toBeNull()
    expect(() => dokumenRingkas({ ...RAW, tipe: 'rahasia' })).toThrow(
      SchemaError
    )
  })

  it('ID yang berpotensi berbahaya ditolak', () => {
    for (const id of ['../1', '1;DROP', '<script>', '', 'a'.repeat(65), null]) {
      expect(() => dokumenRingkas({ ...RAW, id }), String(id)).toThrow(
        SchemaError
      )
    }
  })

  it('berkas tanpa lampiran_id valid ditolak, tanpa berkas menjadi null', () => {
    expect(() =>
      dokumenRingkas({ ...RAW, berkas: { lampiran_id: '../etc/passwd' } })
    ).toThrow(SchemaError)
    expect(dokumenRingkas({ ...RAW, berkas: null }).berkas).toBeNull()
  })

  it('teks panjang dipotong dan karakter kendali dibuang', () => {
    const d = dokumenRingkas({
      ...RAW,
      judul: 'x'.repeat(5000),
      pemrakarsa: 'A\u0000B'
    })
    expect(d.judul).toHaveLength(600)
    expect(d.pemrakarsa).toBe('AB')
  })
})

describe('dokumenDetail', () => {
  it('mengisi bagian opsional dengan nilai aman', () => {
    const d = dokumenDetail(RAW)
    expect(d.relasi).toEqual({
      mencabut: [],
      dicabutOleh: [],
      mengubah: [],
      diubahOleh: []
    })
    expect(d.lampiran).toEqual([])
    expect(d.subjek).toEqual([])
  })

  it('memetakan relasi, riwayat, lampiran, T.E.U., dan subjek', () => {
    const d = dokumenDetail({
      ...RAW,
      dilihat: 128,
      diunduh: 54,
      riwayat_status: [
        { tanggal: '2022-07-12', keterangan: 'Diubah', saat_ini: true }
      ],
      relasi: {
        diubah_oleh: [
          {
            id: '9',
            jenis: 'Peraturan Daerah',
            nomor: '5',
            tahun: 2022,
            judul: 'Perubahan',
            status: 'berlaku'
          }
        ]
      },
      lampiran: [
        { id: 'z9', nama: 'Perda.pdf', ukuran: 100, peran: 'utama' },
        { id: 'z8', nama: 'x', peran: 'aneh' }
      ],
      teu: [{ nama: 'Kota Singkawang', jenis: 'Nama badan' }],
      subjek: ['RETRIBUSI']
    })
    expect(d.dilihat).toBe(128)
    expect(d.riwayatStatus[0]).toEqual({
      tanggal: '2022-07-12',
      keterangan: 'Diubah',
      saatIni: true
    })
    expect(d.relasi.diubahOleh[0]).toMatchObject({
      id: '9',
      nomor: '5',
      status: 'berlaku'
    })
    expect(d.lampiran[1].peran).toBe('lampiran')
    expect(d.teu).toHaveLength(1)
  })
})

describe('daftar dan meta', () => {
  it('dokumenList menghitung total halaman bila tidak diberikan', () => {
    const { items, meta } = dokumenList({
      data: [RAW],
      meta: { page: 2, per_page: 10, total: 41 }
    })
    expect(items).toHaveLength(1)
    expect(meta).toMatchObject({
      page: 2,
      perPage: 10,
      total: 41,
      totalPages: 5
    })
  })
  it('payload bukan objek ditolak', () => {
    expect(() => dokumenList(null)).toThrow(SchemaError)
    expect(() => dokumenList({ data: 'x' })).toThrow(SchemaError)
  })
  it('pageMeta memberi bawaan dan membaca tanda data contoh', () => {
    expect(pageMeta(undefined)).toMatchObject({
      page: 1,
      total: 0,
      sample: false
    })
    expect(pageMeta({ sample: true }).sample).toBe(true)
  })
})

describe('statistik', () => {
  it('menolak data yang tidak lengkap', () => {
    expect(() => statistik({ data: { kpi: {} } })).toThrow(SchemaError)
  })
})

describe('label dokumen', () => {
  it('status ditampilkan dengan ikon dan teks', () => {
    expect(
      statusBadges({ status: 'berlaku', diubah: true }).map(b => b.label)
    ).toEqual(['Berlaku', 'Diubah'])
    expect(
      statusBadges({ status: 'dicabut', diubah: true }).map(b => b.label)
    ).toEqual(['Dicabut'])
    expect(statusBadges({ status: null, diubah: false })).toEqual([])
    expect(statusBadges({ status: 'dicabut' })[0]).toMatchObject({
      icon: 'x-circle',
      tone: 'bad'
    })
  })
  it('judul nomor', () => {
    expect(
      judulNomor({ jenis: 'Peraturan Daerah', nomor: '7', tahun: 2019 })
    ).toBe('Peraturan Daerah Nomor 7 Tahun 2019')
  })
})
