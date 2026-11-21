// Rute API v1 (hanya GET dan HEAD). Kontrak: docs/api/openapi.yaml.
import {
  listQuery,
  pageQuery,
  idParams,
  lampiranParams,
  slugParams,
  responses
} from './schemas.js'
import {
  listDokumen,
  getDokumenRow,
  loadLampiran,
  getLampiran,
  loadRelasi,
  loadSubyek,
  loadPengarang,
  referensiJenis,
  puuKategori,
  koleksi,
  statistik,
  configValues
} from './repo.js'
import { toRingkas, toDetail } from './mappers.js'
import { TIPE_ID, TIPE_NAMA, ID_TIPE } from './sql.js'
import { titleCase, toInt } from './util.js'
import { cleanHtml } from './html.js'
import {
  resolveLampiran,
  isRestricted,
  openLocal,
  attachmentName,
  contentTypeOf,
  safeFileName,
  extOf,
  IMAGE_EXT
} from './files.js'

const HALAMAN = [
  {
    slug: 'sekilas-sejarah',
    judul: 'Sekilas Sejarah',
    key: 'sekilas-sejarah',
    jenis: 'html'
  },
  {
    slug: 'dasar-hukum',
    judul: 'Dasar Hukum',
    key: 'dasar-hukum',
    jenis: 'html'
  },
  { slug: 'visi', judul: 'Visi', key: 'visi', jenis: 'html' },
  { slug: 'misi', judul: 'Misi', key: 'misi', jenis: 'html' },
  {
    slug: 'jdih-instansi',
    judul: 'JDIH Instansi',
    key: 'strukturjdih',
    jenis: 'berkas',
    grup: 'Struktur Organisasi'
  },
  {
    slug: 'bagian-hukum',
    judul: 'Biro/Bagian Hukum',
    key: 'strukturbaghukum',
    jenis: 'berkas',
    grup: 'Struktur Organisasi'
  },
  {
    slug: 'sk-tim-pengelola',
    judul: 'SK Tim Pengelola',
    key: 'timpengelola',
    jenis: 'html'
  },
  { slug: 'sop', judul: 'SOP', key: 'sop', jenis: 'berkas' }
]
const KOLEKSI_DESKRIPSI = {
  1: 'Peraturan perundang-undangan',
  2: 'Buku dan kajian hukum',
  3: 'Artikel dan majalah hukum',
  4: 'Putusan pengadilan'
}
const KOLEKSI_NAMA = {
  1: 'Peraturan',
  2: 'Monografi',
  3: 'Artikel',
  4: 'Putusan'
}

const meta = (cfg, extra = {}) =>
  cfg.sample ? { sample: true, ...extra } : extra
const pagedMeta = (cfg, page, perPage, total) => ({
  page,
  per_page: perPage,
  total,
  total_pages: Math.ceil(total / perPage),
  ...(cfg.sample ? { sample: true } : {})
})

export default async function routes(app, { db, cfg }) {
  async function buildList(rows, { withRelasi = true } = {}) {
    const ids = rows.map(r => r.id)
    const [lampiran, relasi] = await Promise.all([
      loadLampiran(db, ids),
      withRelasi ? loadRelasi(db, ids) : Promise.resolve(null)
    ])
    return rows.map(r =>
      toRingkas(r, { lampiran, relasi, redirectHosts: cfg.fileRedirectHosts })
    )
  }

  app.get(
    '/ringkasan',
    { schema: { response: responses.ringkasan } },
    async () => {
      const [kol, terbaru] = await Promise.all([
        koleksi(db),
        listDokumen(
          db,
          { tipe: 'peraturan' },
          { page: 1, perPage: 3, sort: 'terbaru', onlyPromoted: true }
        )
      ])
      const byTipe = new Map(kol.map(r => [toInt(r.tipe), r]))
      return {
        data: {
          koleksi: [1, 2, 3, 4].map(t => {
            const r = byTipe.get(t)
            return {
              tipe: ID_TIPE[t],
              nama: KOLEKSI_NAMA[t],
              deskripsi: KOLEKSI_DESKRIPSI[t],
              jumlah: toInt(r?.jumlah),
              ...(t === 1
                ? { berlaku: toInt(r?.berlaku), dicabut: toInt(r?.dicabut) }
                : {})
            }
          }),
          terbaru: await buildList(terbaru.rows)
        },
        meta: meta(cfg)
      }
    }
  )

  app.get(
    '/dokumen',
    { schema: { querystring: listQuery, response: responses.list } },
    async req => {
      const { page, per_page: perPage, sort, ...filters } = req.query
      const { rows, total } = await listDokumen(db, filters, {
        page,
        perPage,
        sort
      })
      return {
        data: await buildList(rows),
        meta: pagedMeta(cfg, page, perPage, total)
      }
    }
  )

  app.get(
    '/dokumen/:id',
    { schema: { params: idParams, response: responses.detail } },
    async (req, reply) => {
      const id = Number(req.params.id)
      const row = await getDokumenRow(db, id)
      if (!row) return reply.callNotFound()
      const [lampiran, relasi, subyek, pengarang] = await Promise.all([
        loadLampiran(db, [id]),
        loadRelasi(db, [id]),
        loadSubyek(db, id),
        loadPengarang(db, id)
      ])
      return {
        data: toDetail(row, {
          lampiran,
          relasi,
          subyek,
          pengarang,
          redirectHosts: cfg.fileRedirectHosts
        }),
        meta: meta(cfg)
      }
    }
  )

  // Unduhan berkas. Jalur selalu dari database; klien hanya memberi dua ID.
  app.get(
    '/dokumen/:id/lampiran/:lampiranId',
    { schema: { params: lampiranParams } },
    async (req, reply) => {
      const row = await getLampiran(
        db,
        Number(req.params.id),
        Number(req.params.lampiranId)
      )
      if (!row || isRestricted(row.akses_lampiran, row.pembatasan_lampiran))
        return reply.callNotFound()
      const src = resolveLampiran(row.url_lampiran, cfg.fileRedirectHosts)
      if (!src) return reply.callNotFound()

      if (src.kind === 'redirect') {
        reply.header('Cache-Control', 'public, max-age=300')
        return reply.redirect(src.url, 302)
      }

      // Header unduhan (attachment, cache) hanya boleh menempel pada respons berkas yang SUKSES.
      // Bila diatur lebih dulu, galat 404/500 ikut membawanya: peramban menyimpan JSON galat
      // sebagai "berkas.pdf" dan perantara bisa menyimpan galat itu sebagai respons publik.
      const sendHeaders = () => {
        reply.header('Cache-Control', 'public, max-age=300')
        reply.header('Content-Type', contentTypeOf(src.name))
        reply.header('Content-Disposition', attachmentName(src.name))
        reply.header('X-Content-Type-Options', 'nosniff')
      }
      if (cfg.filesMode === 'accel') {
        // nginx menyajikan berkas dari lokasi internal; Node tidak membaca byte berkas.
        sendHeaders()
        reply.header(
          'X-Accel-Redirect',
          `${cfg.filesAccelPrefix}${encodeURIComponent(src.name)}`
        )
        return reply.send('')
      }
      const file = await openLocal(cfg.filesDir, src.name)
      if (!file) return reply.callNotFound()
      sendHeaders()
      reply.header('Content-Length', file.size)
      return reply.send(file.stream)
    }
  )

  app.get(
    '/referensi/:nama',
    { schema: { params: slugParams('nama'), response: responses.acuan } },
    async (req, reply) => {
      const { nama } = req.params
      if (nama === 'jenis-peraturan') {
        const rows = await referensiJenis(db)
        return {
          data: rows.map(r => ({
            kode: r.kode,
            nama: titleCase(r.nama),
            jumlah: toInt(r.jumlah)
          })),
          meta: meta(cfg)
        }
      }
      if (nama === 'status') {
        return {
          data: [
            { kode: 'berlaku', nama: 'Berlaku' },
            { kode: 'dicabut', nama: 'Dicabut' }
          ],
          meta: meta(cfg)
        }
      }
      if (nama === 'tipe') {
        const kol = await koleksi(db)
        const byTipe = new Map(kol.map(r => [toInt(r.tipe), toInt(r.jumlah)]))
        return {
          data: Object.entries(TIPE_ID).map(([kode, id]) => ({
            kode,
            nama: TIPE_NAMA[id],
            jumlah: byTipe.get(id) ?? 0
          })),
          meta: meta(cfg)
        }
      }
      return reply.callNotFound()
    }
  )

  app.get('/puu', { schema: { response: responses.acuan } }, async () => {
    const rows = await puuKategori(db)
    return {
      data: rows.map(r => ({
        kode: r.kode,
        nama: titleCase(r.nama),
        jumlah: toInt(r.jumlah)
      })),
      meta: meta(cfg)
    }
  })

  app.get(
    '/puu/:kategori',
    {
      schema: {
        params: slugParams('kategori'),
        querystring: pageQuery,
        response: responses.list
      }
    },
    async (req, reply) => {
      const kategori = (await puuKategori(db)).find(
        k => k.kode === req.params.kategori
      )
      if (!kategori) return reply.callNotFound()
      const { page, per_page: perPage } = req.query
      const { rows, total } = await listDokumen(
        db,
        { puuTypeId: kategori.id },
        { page, perPage, sort: 'terbaru' }
      )
      // Dokumen PUU bisa bertipe apa pun; tipe tidak dikenal tidak masuk (sudah disaring PUBLISHED).
      return {
        data: await buildList(rows),
        meta: pagedMeta(cfg, page, perPage, total)
      }
    }
  )

  app.get(
    '/statistik',
    { schema: { response: responses.statistik } },
    async () => {
      const tahunBerjalan = new Date().getUTCFullYear()
      const s = await statistik(db, tahunBerjalan)
      const byTipe = new Map(s.tipe.map(r => [toInt(r.tipe), r]))
      const berlaku = toInt(s.status.berlaku)
      const berlakuDiubah = toInt(s.status.berlaku_diubah)
      const dicabut = toInt(s.status.dicabut)
      const nama = {
        1: 'Peraturan Perundang-undangan',
        2: 'Monografi Hukum',
        3: 'Artikel dan Majalah Hukum',
        4: 'Putusan'
      }
      const tahunMap = new Map(
        s.tahun.map(r => [toInt(r.tahun), toInt(r.jumlah)])
      )
      const perTahun = []
      for (let y = tahunBerjalan - 10; y <= tahunBerjalan; y++) {
        perTahun.push({
          tahun: y,
          jumlah: tahunMap.get(y) ?? 0,
          berjalan: y === tahunBerjalan
        })
      }
      return {
        data: {
          kpi: {
            total: s.tipe.reduce((n, r) => n + toInt(r.jumlah), 0),
            peraturan_berlaku: berlaku + berlakuDiubah,
            peraturan_total: toInt(byTipe.get(1)?.jumlah),
            dilihat_30h: toInt(s.hit.dilihat),
            diunduh_30h: toInt(s.hit.diunduh)
          },
          per_koleksi: [1, 2, 3, 4]
            .map(t => ({ nama: nama[t], jumlah: toInt(byTipe.get(t)?.jumlah) }))
            .sort((a, b) => b.jumlah - a.jumlah),
          status_peraturan: { berlaku, berlaku_diubah: berlakuDiubah, dicabut },
          per_jenis: s.jenis.map(r => ({
            nama: titleCase(r.nama),
            jumlah: toInt(r.jumlah)
          })),
          per_tahun: perTahun
        },
        meta: meta(cfg)
      }
    }
  )

  // Halaman Tentang Kami: dari tabel frontend_config. Halaman berbasis berkas
  // (struktur organisasi, SOP) menyimpan nama gambar; disajikan lewat /halaman/:slug/berkas.
  const nilai = async () =>
    configValues(
      db,
      HALAMAN.map(h => h.key)
    )
  const terisi = (h, v) => {
    const isi = String(v.get(h.key) ?? '').trim()
    return h.jenis === 'berkas' ? safeFileName(isi) !== null : isi !== ''
  }

  app.get(
    '/halaman',
    { schema: { response: responses.halamanList } },
    async () => {
      const v = await nilai()
      return {
        data: HALAMAN.filter(h => terisi(h, v)).map(h => ({
          slug: h.slug,
          judul: h.judul,
          grup: h.grup ?? null,
          tingkat: h.grup ? 1 : 0
        })),
        meta: meta(cfg)
      }
    }
  )

  app.get(
    '/halaman/:slug',
    { schema: { params: slugParams(), response: responses.halaman } },
    async (req, reply) => {
      const h = HALAMAN.find(x => x.slug === req.params.slug)
      const v = await nilai()
      if (!h || !terisi(h, v)) return reply.callNotFound()
      const isi = String(v.get(h.key) ?? '').trim()
      const base = { slug: h.slug, judul: h.judul, diperbarui: null }
      if (h.jenis === 'html')
        return {
          data: {
            ...base,
            isi_html: cleanHtml(isi).slice(0, 200_000),
            berkas: null
          },
          meta: meta(cfg)
        }
      const tipe = IMAGE_EXT.has(extOf(isi)) ? 'gambar' : 'pdf'
      return {
        data: { ...base, isi_html: '', berkas: { tipe, nama: isi } },
        meta: meta(cfg)
      }
    }
  )

  app.get(
    '/halaman/:slug/berkas',
    { schema: { params: slugParams() } },
    async (req, reply) => {
      const h = HALAMAN.find(
        x => x.slug === req.params.slug && x.jenis === 'berkas'
      )
      if (!h) return reply.callNotFound()
      const name = safeFileName(String((await nilai()).get(h.key) ?? '').trim())
      if (!name) return reply.callNotFound()
      const file = await openLocal(cfg.pageFilesDir, name)
      if (!file) return reply.callNotFound()
      reply.header('Content-Type', contentTypeOf(name))
      reply.header('Content-Length', file.size)
      reply.header('Cache-Control', 'public, max-age=3600')
      reply.header('X-Content-Type-Options', 'nosniff')
      // Gambar boleh dimuat lintas origin oleh SPA; PDF diunduh.
      reply.header(
        'Content-Disposition',
        IMAGE_EXT.has(extOf(name)) ? 'inline' : attachmentName(name)
      )
      reply.header('Content-Security-Policy', "default-src 'none'; sandbox")
      return reply.send(file.stream)
    }
  )
}
