// Mengubah payload API menjadi bentuk yang dipakai UI, dengan validasi.
// Kolom yang tidak dikenal dibuang (allowlist). Lihat docs/api/openapi.yaml.

import {
  SchemaError,
  object,
  list,
  text,
  optionalText,
  integer,
  bool,
  oneOf,
  isoDate,
  opaqueId
} from '@/utils/schema.js'
import { TIPE } from '@/utils/validators.js'

const STATUS = ['berlaku', 'dicabut']
const PERAN = ['utama', 'abstrak', 'lampiran']

function berkas(v, where) {
  if (v === null || v === undefined) return null
  const o = object(v, where)
  return {
    lampiranId: opaqueId(o.lampiran_id, `${where}.lampiran_id`),
    ukuran: integer(o.ukuran, `${where}.ukuran`, { required: false }),
    tipe: 'pdf'
  }
}

export function dokumenRingkas(raw, where = 'dokumen') {
  const o = object(raw, where)
  return {
    id: opaqueId(o.id, `${where}.id`),
    tipe: oneOf(o.tipe, TIPE, `${where}.tipe`),
    jenis: text(o.jenis, `${where}.jenis`, { max: 120 }),
    singkatan: optionalText(o.singkatan, `${where}.singkatan`, { max: 30 }),
    nomor: optionalText(o.nomor, `${where}.nomor`, { max: 20 }),
    tahun: integer(o.tahun, `${where}.tahun`, {
      min: 1800,
      max: 2200,
      required: false
    }),
    judul: optionalText(o.judul, `${where}.judul`, { max: 600 }) ?? '',
    status: oneOf(o.status, STATUS, `${where}.status`, { fallback: null }),
    diubah: bool(o.diubah),
    riwayat: optionalText(o.riwayat, `${where}.riwayat`, { max: 300 }),
    tanggalPenetapan: isoDate(o.tanggal_penetapan),
    pemrakarsa: optionalText(o.pemrakarsa, `${where}.pemrakarsa`, { max: 200 }),
    berkas: berkas(o.berkas, `${where}.berkas`)
  }
}

function relasiItem(raw, where) {
  const o = object(raw, where)
  return {
    id: opaqueId(o.id, `${where}.id`),
    jenis: text(o.jenis, `${where}.jenis`, { max: 120 }),
    nomor: optionalText(o.nomor, `${where}.nomor`, { max: 20 }),
    tahun: integer(o.tahun, `${where}.tahun`, {
      min: 1800,
      max: 2200,
      required: false
    }),
    judul: optionalText(o.judul, `${where}.judul`, { max: 600 }) ?? '',
    status: oneOf(o.status, STATUS, `${where}.status`, { fallback: null })
  }
}

const relasiList = (v, where) =>
  v === undefined || v === null
    ? []
    : list(v, where, { max: 50 }).map((r, i) => relasiItem(r, `${where}[${i}]`))

export function dokumenDetail(raw) {
  const o = object(raw, 'dokumen')
  const base = dokumenRingkas(o)
  const relasi =
    o.relasi === undefined || o.relasi === null
      ? {}
      : object(o.relasi, 'dokumen.relasi')
  return {
    ...base,
    tanggalPengundangan: isoDate(o.tanggal_pengundangan),
    tempatTerbit: optionalText(o.tempat_terbit, 'dokumen.tempat_terbit', {
      max: 120
    }),
    bahasa: optionalText(o.bahasa, 'dokumen.bahasa', { max: 60 }),
    sumber: optionalText(o.sumber, 'dokumen.sumber', { max: 200 }),
    bidangHukum: optionalText(o.bidang_hukum, 'dokumen.bidang_hukum', {
      max: 200
    }),
    dilihat: integer(o.dilihat, 'dokumen.dilihat', { required: false }),
    diunduh: integer(o.diunduh, 'dokumen.diunduh', { required: false }),
    kutipan: optionalText(o.kutipan, 'dokumen.kutipan', { max: 800 }),
    statusKeterangan: optionalText(
      o.status_keterangan,
      'dokumen.status_keterangan',
      { max: 600 }
    ),
    riwayatStatus:
      o.riwayat_status === undefined || o.riwayat_status === null
        ? []
        : list(o.riwayat_status, 'dokumen.riwayat_status', { max: 50 }).map(
            (r, i) => {
              const e = object(r, `dokumen.riwayat_status[${i}]`)
              return {
                tanggal: isoDate(e.tanggal),
                keterangan: text(
                  e.keterangan,
                  `dokumen.riwayat_status[${i}].keterangan`,
                  { max: 400 }
                ),
                saatIni: bool(e.saat_ini)
              }
            }
          ),
    relasi: {
      mencabut: relasiList(relasi.mencabut, 'relasi.mencabut'),
      dicabutOleh: relasiList(relasi.dicabut_oleh, 'relasi.dicabut_oleh'),
      mengubah: relasiList(relasi.mengubah, 'relasi.mengubah'),
      diubahOleh: relasiList(relasi.diubah_oleh, 'relasi.diubah_oleh')
    },
    teu:
      o.teu === undefined || o.teu === null
        ? []
        : list(o.teu, 'dokumen.teu', { max: 50 }).map((r, i) => {
            const e = object(r, `dokumen.teu[${i}]`)
            return {
              nama: text(e.nama, `dokumen.teu[${i}].nama`, { max: 300 }),
              jenis: text(e.jenis, `dokumen.teu[${i}].jenis`, { max: 100 })
            }
          }),
    subjek:
      o.subjek === undefined || o.subjek === null
        ? []
        : list(o.subjek, 'dokumen.subjek', { max: 30 }).map((s, i) =>
            text(s, `dokumen.subjek[${i}]`, { max: 100 })
          ),
    lampiran:
      o.lampiran === undefined || o.lampiran === null
        ? []
        : list(o.lampiran, 'dokumen.lampiran', { max: 30 }).map((r, i) => {
            const e = object(r, `dokumen.lampiran[${i}]`)
            return {
              id: opaqueId(e.id, `dokumen.lampiran[${i}].id`),
              nama: text(e.nama, `dokumen.lampiran[${i}].nama`, { max: 200 }),
              ukuran: integer(e.ukuran, `dokumen.lampiran[${i}].ukuran`, {
                required: false
              }),
              peran: oneOf(e.peran, PERAN, `dokumen.lampiran[${i}].peran`, {
                fallback: 'lampiran'
              })
            }
          })
  }
}

export function pageMeta(raw) {
  const m = raw === undefined || raw === null ? {} : object(raw, 'meta')
  const page =
    integer(m.page, 'meta.page', { min: 1, max: 100000, required: false }) ?? 1
  const perPage =
    integer(m.per_page, 'meta.per_page', {
      min: 1,
      max: 100,
      required: false
    }) ?? 10
  const total = integer(m.total, 'meta.total', { required: false }) ?? 0
  const totalPages =
    integer(m.total_pages, 'meta.total_pages', {
      min: 0,
      max: 100000,
      required: false
    }) ?? Math.ceil(total / perPage)
  return { page, perPage, total, totalPages, sample: bool(m.sample) }
}

export function dokumenList(payload) {
  const p = object(payload, 'respons')
  return {
    items: list(p.data, 'data', { max: 100 }).map((r, i) =>
      dokumenRingkas(r, `data[${i}]`)
    ),
    meta: pageMeta(p.meta)
  }
}

export function dokumenDetailResponse(payload) {
  const p = object(payload, 'respons')
  return { dokumen: dokumenDetail(p.data), meta: pageMeta(p.meta) }
}

export function ringkasan(payload) {
  const p = object(payload, 'respons')
  const d = object(p.data, 'data')
  return {
    koleksi: list(d.koleksi, 'data.koleksi', { max: 10 }).map((r, i) => {
      const e = object(r, `koleksi[${i}]`)
      return {
        tipe: oneOf(e.tipe, TIPE, `koleksi[${i}].tipe`),
        nama: text(e.nama, `koleksi[${i}].nama`, { max: 80 }),
        deskripsi: optionalText(e.deskripsi, `koleksi[${i}].deskripsi`, {
          max: 120
        }),
        jumlah: integer(e.jumlah, `koleksi[${i}].jumlah`),
        berlaku: integer(e.berlaku, `koleksi[${i}].berlaku`, {
          required: false
        }),
        dicabut: integer(e.dicabut, `koleksi[${i}].dicabut`, {
          required: false
        })
      }
    }),
    terbaru: list(d.terbaru, 'data.terbaru', { max: 12 }).map((r, i) =>
      dokumenRingkas(r, `terbaru[${i}]`)
    ),
    meta: pageMeta(p.meta)
  }
}

const countRow = (r, where, key) => {
  const e = object(r, where)
  return {
    nama: text(e.nama, `${where}.nama`, { max: 120 }),
    [key]: integer(e[key], `${where}.${key}`)
  }
}

export function statistik(payload) {
  const p = object(payload, 'respons')
  const d = object(p.data, 'data')
  const k = object(d.kpi, 'data.kpi')
  const s = object(d.status_peraturan, 'data.status_peraturan')
  return {
    kpi: {
      total: integer(k.total, 'kpi.total'),
      peraturanBerlaku: integer(k.peraturan_berlaku, 'kpi.peraturan_berlaku'),
      peraturanTotal: integer(k.peraturan_total, 'kpi.peraturan_total'),
      dilihat30h: integer(k.dilihat_30h, 'kpi.dilihat_30h'),
      diunduh30h: integer(k.diunduh_30h, 'kpi.diunduh_30h')
    },
    perKoleksi: list(d.per_koleksi, 'data.per_koleksi', { max: 10 }).map(
      (r, i) => countRow(r, `per_koleksi[${i}]`, 'jumlah')
    ),
    statusPeraturan: {
      berlaku: integer(s.berlaku, 'status.berlaku'),
      berlakuDiubah: integer(s.berlaku_diubah, 'status.berlaku_diubah'),
      dicabut: integer(s.dicabut, 'status.dicabut')
    },
    perJenis: list(d.per_jenis, 'data.per_jenis', { max: 30 }).map((r, i) =>
      countRow(r, `per_jenis[${i}]`, 'jumlah')
    ),
    perTahun: list(d.per_tahun, 'data.per_tahun', { max: 60 }).map((r, i) => {
      const e = object(r, `per_tahun[${i}]`)
      return {
        tahun: integer(e.tahun, `per_tahun[${i}].tahun`, {
          min: 1800,
          max: 2200
        }),
        jumlah: integer(e.jumlah, `per_tahun[${i}].jumlah`),
        berjalan: bool(e.berjalan)
      }
    }),
    meta: pageMeta(p.meta)
  }
}

export function referensi(payload) {
  const p = object(payload, 'respons')
  return list(p.data, 'data', { max: 200 }).map((r, i) => {
    const e = object(r, `referensi[${i}]`)
    return {
      kode: opaqueId(e.kode, `referensi[${i}].kode`),
      nama: text(e.nama, `referensi[${i}].nama`, { max: 120 }),
      jumlah: integer(e.jumlah, `referensi[${i}].jumlah`, { required: false })
    }
  })
}

export function halamanList(payload) {
  const p = object(payload, 'respons')
  return list(p.data, 'data', { max: 50 }).map((r, i) => {
    const e = object(r, `halaman[${i}]`)
    return {
      slug: opaqueId(e.slug, `halaman[${i}].slug`),
      judul: text(e.judul, `halaman[${i}].judul`, { max: 160 }),
      grup: optionalText(e.grup, `halaman[${i}].grup`, { max: 80 }),
      tingkat:
        integer(e.tingkat, `halaman[${i}].tingkat`, {
          min: 0,
          max: 3,
          required: false
        }) ?? 0
    }
  })
}

export function halaman(payload) {
  const p = object(payload, 'respons')
  const e = object(p.data, 'data')
  return {
    slug: opaqueId(e.slug, 'halaman.slug'),
    judul: text(e.judul, 'halaman.judul', { max: 160 }),
    // HTML mentah dari server: WAJIB dibersihkan lewat SafeHtml sebelum tampil.
    isiHtml: text(e.isi_html, 'halaman.isi_html', {
      max: 200_000,
      required: false
    }),
    diperbarui: isoDate(e.diperbarui),
    // Halaman berbasis berkas (struktur organisasi, SOP): hanya tipe dan nama,
    // URL berkas dibentuk klien dari slug (halamanBerkasUrl), bukan dari API.
    berkas:
      e.berkas === undefined || e.berkas === null
        ? null
        : {
            tipe: oneOf(
              object(e.berkas, 'halaman.berkas').tipe,
              ['gambar', 'pdf'],
              'halaman.berkas.tipe'
            ),
            nama: text(e.berkas.nama, 'halaman.berkas.nama', { max: 200 })
          }
  }
}

export { SchemaError }
