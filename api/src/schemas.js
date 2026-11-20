// Skema JSON Fastify. Skema respons adalah ALLOWLIST kolom (OWASP API3): Fastify
// hanya menyerialisasi properti yang tercantum di sini.

const str = { type: 'string' }
const strN = { type: ['string', 'null'] }
const intN = { type: ['integer', 'null'] }

export const listQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    q: { type: 'string', minLength: 2, maxLength: 100 },
    tipe: {
      type: 'string',
      enum: ['peraturan', 'monografi', 'artikel', 'putusan'],
      default: 'peraturan'
    },
    jenis: { type: 'string', pattern: '^[a-z0-9-]{1,80}$' },
    status: { type: 'string', enum: ['berlaku', 'dicabut'] },
    diubah: { type: 'string', enum: ['1'] },
    nomor: { type: 'string', pattern: '^[0-9A-Za-z/.-]{1,20}$' },
    tahun_dari: { type: 'integer', minimum: 1900, maximum: 2100 },
    tahun_sampai: { type: 'integer', minimum: 1900, maximum: 2100 },
    subyek: { type: 'string', maxLength: 60 },
    sort: {
      type: 'string',
      enum: ['terbaru', 'nomor', 'populer'],
      default: 'terbaru'
    },
    page: { type: 'integer', minimum: 1, maximum: 1000, default: 1 },
    per_page: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
  }
}

export const pageQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, maximum: 1000, default: 1 },
    per_page: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
  }
}

export const idParams = {
  type: 'object',
  properties: { id: { type: 'string', pattern: '^\\d{1,10}$' } },
  required: ['id']
}
export const lampiranParams = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^\\d{1,10}$' },
    lampiranId: { type: 'string', pattern: '^\\d{1,10}$' }
  },
  required: ['id', 'lampiranId']
}
export const slugParams = (name = 'slug') => ({
  type: 'object',
  properties: { [name]: { type: 'string', pattern: '^[a-z0-9-]{1,120}$' } },
  required: [name]
})

const berkas = {
  type: ['object', 'null'],
  properties: { lampiran_id: str, ukuran: intN }
}

export const dokumenRingkas = {
  type: 'object',
  properties: {
    id: str,
    tipe: str,
    jenis: str,
    singkatan: strN,
    nomor: strN,
    tahun: intN,
    judul: str,
    status: strN,
    diubah: { type: 'boolean' },
    riwayat: strN,
    tanggal_penetapan: strN,
    pemrakarsa: strN,
    berkas
  }
}

const relasi = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: str,
      jenis: str,
      nomor: strN,
      tahun: intN,
      judul: str,
      status: strN
    }
  }
}

export const dokumenDetail = {
  type: 'object',
  properties: {
    ...dokumenRingkas.properties,
    tanggal_pengundangan: strN,
    tempat_terbit: strN,
    bahasa: strN,
    sumber: strN,
    bidang_hukum: strN,
    dilihat: { type: 'integer' },
    diunduh: { type: 'integer' },
    kutipan: strN,
    status_keterangan: strN,
    riwayat_status: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tanggal: strN,
          keterangan: str,
          saat_ini: { type: 'boolean' }
        }
      }
    },
    relasi: {
      type: 'object',
      properties: {
        mencabut: relasi,
        dicabut_oleh: relasi,
        mengubah: relasi,
        diubah_oleh: relasi
      }
    },
    teu: {
      type: 'array',
      items: { type: 'object', properties: { nama: str, jenis: str } }
    },
    subjek: { type: 'array', items: str },
    lampiran: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: str, nama: str, ukuran: intN, peran: str }
      }
    }
  }
}

const meta = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    per_page: { type: 'integer' },
    total: { type: 'integer' },
    total_pages: { type: 'integer' },
    sample: { type: 'boolean' }
  }
}
const metaTanda = {
  type: 'object',
  properties: { sample: { type: 'boolean' } }
}
const wrap = data => ({ type: 'object', properties: { data, meta: metaTanda } })
const acuan = {
  type: 'array',
  items: {
    type: 'object',
    properties: { kode: str, nama: str, jumlah: { type: 'integer' } }
  }
}
const hitung = {
  type: 'array',
  items: {
    type: 'object',
    properties: { nama: str, jumlah: { type: 'integer' } }
  }
}

export const responses = {
  list: {
    200: {
      type: 'object',
      properties: { data: { type: 'array', items: dokumenRingkas }, meta }
    }
  },
  detail: { 200: wrap(dokumenDetail) },
  acuan: { 200: wrap(acuan) },
  ringkasan: {
    200: wrap({
      type: 'object',
      properties: {
        koleksi: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tipe: str,
              nama: str,
              deskripsi: strN,
              jumlah: { type: 'integer' },
              berlaku: intN,
              dicabut: intN
            }
          }
        },
        terbaru: { type: 'array', items: dokumenRingkas }
      }
    })
  },
  statistik: {
    200: wrap({
      type: 'object',
      properties: {
        kpi: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            peraturan_berlaku: { type: 'integer' },
            peraturan_total: { type: 'integer' },
            dilihat_30h: { type: 'integer' },
            diunduh_30h: { type: 'integer' }
          }
        },
        per_koleksi: hitung,
        status_peraturan: {
          type: 'object',
          properties: {
            berlaku: { type: 'integer' },
            berlaku_diubah: { type: 'integer' },
            dicabut: { type: 'integer' }
          }
        },
        per_jenis: hitung,
        per_tahun: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tahun: { type: 'integer' },
              jumlah: { type: 'integer' },
              berjalan: { type: 'boolean' }
            }
          }
        }
      }
    })
  },
  halamanList: {
    200: wrap({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: str,
          judul: str,
          grup: strN,
          tingkat: { type: 'integer' }
        }
      }
    })
  },
  halaman: {
    200: wrap({
      type: 'object',
      properties: {
        slug: str,
        judul: str,
        isi_html: str,
        diperbarui: strN,
        berkas: {
          type: ['object', 'null'],
          properties: { tipe: str, nama: str }
        }
      }
    })
  }
}
