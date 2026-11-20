// Logika rute API palsu. Mengikuti docs/api/openapi.yaml.
import {
  DOKUMEN,
  JENIS,
  HALAMAN,
  HALAMAN_UJI,
  PUU,
  RELASI,
  byKurasi,
  TAHUN_BERJALAN
} from './data.js'

const KOLEKSI = [
  {
    tipe: 'peraturan',
    nama: 'Peraturan',
    deskripsi: 'Peraturan perundang-undangan'
  },
  { tipe: 'monografi', nama: 'Monografi', deskripsi: 'Buku dan kajian hukum' },
  { tipe: 'artikel', nama: 'Artikel', deskripsi: 'Artikel dan majalah hukum' },
  { tipe: 'putusan', nama: 'Putusan', deskripsi: 'Putusan pengadilan' }
]
const NAMA_KOLEKSI_STAT = {
  peraturan: 'Peraturan Perundang-undangan',
  monografi: 'Monografi Hukum',
  artikel: 'Artikel dan Majalah Hukum',
  putusan: 'Putusan'
}

const slugify = s =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function ringkas(d) {
  return {
    id: d.id,
    tipe: d.tipe,
    jenis: d.jenis,
    singkatan: d.singkatan,
    nomor: d.nomor,
    tahun: d.tahun,
    judul: d.judul,
    status: d.status,
    diubah: d.diubah,
    riwayat: d.riwayat ?? null,
    tanggal_penetapan: d.tanggal,
    pemrakarsa: d.pemrakarsa,
    berkas: { lampiran_id: `f${d.id}`, ukuran: d.ukuranByte }
  }
}

function relasiItem(d) {
  return {
    id: d.id,
    jenis: d.jenis,
    nomor: d.nomor,
    tahun: d.tahun,
    judul: d.judul,
    status: d.status
  }
}

function tambahHari(iso, n) {
  const t = new Date(`${iso}T00:00:00Z`)
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

const namaNomor = d => `${d.jenis} Nomor ${d.nomor} Tahun ${d.tahun}`

function detail(d) {
  const rel = d.kurasi ? (RELASI[d.kurasi] ?? {}) : {}
  const lihat = keys => (keys ?? []).map(k => byKurasi(k)).filter(Boolean)
  const mencabut = lihat(rel.mencabut)
  const dicabutOleh = lihat(rel.dicabutOleh)
  const mengubah = lihat(rel.mengubah)
  const diubahOleh = lihat(rel.diubahOleh)
  const peraturan = d.tipe === 'peraturan'

  const riwayat = []
  for (const o of dicabutOleh)
    riwayat.push({
      tanggal: o.tanggal,
      keterangan: `Dicabut oleh ${namaNomor(o)}`,
      saat_ini: true
    })
  for (const o of diubahOleh)
    riwayat.push({
      tanggal: o.tanggal,
      keterangan: `Diubah oleh ${namaNomor(o)}`,
      saat_ini: dicabutOleh.length === 0
    })
  if (peraturan) {
    riwayat.push({
      tanggal: tambahHari(d.tanggal, 1),
      keterangan: `Diundangkan dalam Lembaran Daerah ${d.tahun} (${d.nomor})`,
      saat_ini: riwayat.length === 0
    })
    riwayat.push({
      tanggal: d.tanggal,
      keterangan: 'Ditetapkan',
      saat_ini: false
    })
  }

  let keterangan = null
  if (d.status === 'dicabut') {
    keterangan = dicabutOleh.length
      ? `Tidak berlaku lagi karena dicabut oleh ${namaNomor(dicabutOleh[0])}.`
      : 'Tidak berlaku lagi karena telah dicabut.'
  } else if (d.status === 'berlaku' && diubahOleh.length) {
    keterangan = `Masih berlaku dan telah diubah satu kali oleh ${namaNomor(diubahOleh[0])}. Baca keduanya bersama-sama.`
  } else if (d.status === 'berlaku') {
    keterangan = 'Masih berlaku.'
  }

  const nama = slugify(
    `${d.singkatan ?? d.jenis}-${d.nomor ?? ''}-tahun-${d.tahun}`
  )
  const lampiran = [
    {
      id: `f${d.id}`,
      nama: `${nama}.pdf`,
      ukuran: d.ukuranByte,
      peran: 'utama'
    }
  ]
  if (d.kurasi === 'd3')
    lampiran.push({
      id: `a${d.id}`,
      nama: `abstrak-${nama}.pdf`,
      ukuran: 120 * 1024,
      peran: 'abstrak'
    })

  const kutipan = peraturan
    ? `${d.jenis} Kota Singkawang Nomor ${d.nomor} Tahun ${d.tahun} tentang ${d.judul} (Lembaran Daerah Kota Singkawang Tahun ${d.tahun} Nomor ${d.nomor})`
    : null

  return {
    ...ringkas(d),
    tanggal_pengundangan: peraturan ? tambahHari(d.tanggal, 1) : null,
    tempat_terbit: 'Singkawang',
    bahasa: 'Indonesia',
    sumber: peraturan ? `LD ${d.tahun} (${d.nomor})` : null,
    bidang_hukum: peraturan ? 'Hukum Administrasi Negara' : null,
    dilihat: d.dilihat,
    diunduh: d.diunduh,
    kutipan,
    status_keterangan: keterangan,
    riwayat_status: riwayat,
    relasi: {
      mencabut: mencabut.map(relasiItem),
      dicabut_oleh: dicabutOleh.map(relasiItem),
      mengubah: mengubah.map(relasiItem),
      diubah_oleh: diubahOleh.map(relasiItem)
    },
    teu: peraturan
      ? [
          { nama: 'Kota Singkawang', jenis: 'Nama badan' },
          {
            nama: 'Dewan Perwakilan Rakyat Daerah Kota Singkawang',
            jenis: 'Nama badan'
          }
        ]
      : [],
    subjek: d.subjek,
    lampiran
  }
}

const norm = s =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')

function cocokKata(d, q) {
  const hay = norm(
    `${d.jenis} ${d.singkatan ?? ''} ${d.nomor ?? ''} ${d.tahun} ${d.judul} ${d.nomor ?? ''}/${d.tahun} ${d.subjek.join(' ')}`
  )
  const needle = norm(q)
  const m = /^(\d{1,4})\s*[/\s]\s*(\d{4})$/.exec(needle)
  if (m)
    return String(d.nomor) === String(Number(m[1])) && String(d.tahun) === m[2]
  return needle
    .split(' ')
    .filter(Boolean)
    .every(w => hay.includes(w))
}

function filterDokumen(p) {
  const tipe = p.get('tipe') || 'peraturan'
  let out = DOKUMEN.filter(d => d.tipe === tipe)
  const q = (p.get('q') ?? '').trim()
  if (q) out = out.filter(d => cocokKata(d, q))
  if (p.get('jenis')) out = out.filter(d => d.jenisKode === p.get('jenis'))
  if (p.get('status')) out = out.filter(d => d.status === p.get('status'))
  if (p.get('diubah') === '1') out = out.filter(d => d.diubah)
  if (p.get('nomor')) out = out.filter(d => String(d.nomor) === p.get('nomor'))
  const dari = Number(p.get('tahun_dari')) || 0
  const sampai = Number(p.get('tahun_sampai')) || 9999
  out = out.filter(d => d.tahun >= dari && d.tahun <= sampai)
  if (p.get('subyek'))
    out = out.filter(d =>
      d.subjek.some(s => norm(s).includes(norm(p.get('subyek'))))
    )
  const sort = p.get('sort') || 'terbaru'
  if (sort === 'nomor')
    out = [...out].sort(
      (a, b) => b.tahun - a.tahun || Number(b.nomor) - Number(a.nomor)
    )
  else if (sort === 'populer')
    out = [...out].sort((a, b) => b.dilihat - a.dilihat)
  else out = [...out].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
  return out
}

function paged(items, p, mapper = ringkas) {
  const perPage = Math.min(Math.max(Number(p.get('per_page')) || 10, 1), 50)
  const page = Math.min(Math.max(Number(p.get('page')) || 1, 1), 1000)
  const total = items.length
  const start = (page - 1) * perPage
  return {
    data: items.slice(start, start + perPage).map(mapper),
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
      sample: true
    }
  }
}

const SAMPLE = { sample: true }
const ok = body => ({ status: 200, body })
const problem = (status, title) => ({
  status,
  problem: { type: 'about:blank', title, status }
})

export function pdfBytes(judul, baris = []) {
  const esc = s =>
    String(s)
      .replace(/[\\()]/g, m => `\\${m}`)
      .replace(/[^\x20-\x7E]/g, '?')
  const isi = [
    'BT /F1 18 Tf 56 780 Td (' + esc(judul).slice(0, 70) + ') Tj ET',
    ...baris.map(
      (b, i) =>
        `BT /F1 12 Tf 56 ${740 - i * 20} Td (${esc(b).slice(0, 90)}) Tj ET`
    )
  ].join('\n')
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${isi.length}>>\nstream\n${isi}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'
  ]
  let out = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

/**
 * @returns {{status:number, body?:any, problem?:any, binary?:{bytes:Buffer,name:string}}}
 */
export function handle(method, pathname, params, mode = 'normal') {
  if (method !== 'GET' && method !== 'HEAD')
    return {
      status: 405,
      problem: {
        type: 'about:blank',
        title: 'Metode tidak diizinkan',
        status: 405
      }
    }
  if (mode === 'error') return problem(503, 'Layanan tidak tersedia')

  const parts = pathname.split('/').filter(Boolean)
  const [a, b, c, e] = parts
  const kosong = mode === 'empty'

  if (a === 'ringkasan' && parts.length === 1) {
    const peraturan = DOKUMEN.filter(d => d.tipe === 'peraturan')
    return ok({
      data: {
        koleksi: KOLEKSI.map(k => {
          const set = DOKUMEN.filter(d => d.tipe === k.tipe)
          return {
            ...k,
            jumlah: kosong ? 0 : set.length,
            ...(k.tipe === 'peraturan'
              ? {
                  berlaku: peraturan.filter(d => d.status === 'berlaku').length,
                  dicabut: peraturan.filter(d => d.status === 'dicabut').length
                }
              : {})
          }
        }),
        terbaru: kosong
          ? []
          : [...DOKUMEN]
              .filter(d => d.tipe === 'peraturan')
              .sort((x, y) => (x.tanggal < y.tanggal ? 1 : -1))
              .slice(0, 3)
              .map(ringkas)
      },
      meta: SAMPLE
    })
  }

  if (a === 'dokumen' && parts.length === 1)
    return ok(paged(kosong ? [] : filterDokumen(params), params))

  if (a === 'dokumen' && /^\d{1,10}$/.test(b ?? '') && parts.length === 2) {
    const d = DOKUMEN.find(x => x.id === b)
    return d
      ? ok({ data: detail(d), meta: SAMPLE })
      : problem(404, 'Dokumen tidak ditemukan')
  }

  if (
    a === 'dokumen' &&
    /^\d{1,10}$/.test(b ?? '') &&
    c === 'lampiran' &&
    /^[a-z]\d{1,10}$/.test(e ?? '') &&
    parts.length === 4
  ) {
    const d = DOKUMEN.find(x => x.id === b)
    if (!d || e.slice(1) !== d.id || !'fa'.includes(e[0]))
      return problem(404, 'Berkas tidak ditemukan')
    const judul =
      e[0] === 'a'
        ? `ABSTRAK (CONTOH) - ${d.jenis} ${d.nomor}/${d.tahun}`
        : `${d.jenis} Nomor ${d.nomor} Tahun ${d.tahun}`
    return {
      status: 200,
      binary: {
        bytes: pdfBytes(judul, [
          'DOKUMEN CONTOH untuk pengembangan antarmuka.',
          'Bukan produk hukum DPRD Kota Singkawang.',
          d.judul
        ]),
        name: `${slugify(`${d.singkatan ?? d.jenis}-${d.nomor ?? ''}-${d.tahun}`)}${e[0] === 'a' ? '-abstrak' : ''}.pdf`
      }
    }
  }

  if (a === 'referensi' && b && parts.length === 2) {
    if (b === 'jenis-peraturan')
      return ok({
        data: JENIS.map(j => ({
          kode: j.kode,
          nama: j.nama,
          jumlah: j.jumlah
        })),
        meta: SAMPLE
      })
    if (b === 'status')
      return ok({
        data: [
          { kode: 'berlaku', nama: 'Berlaku' },
          { kode: 'dicabut', nama: 'Dicabut' }
        ],
        meta: SAMPLE
      })
    if (b === 'tipe')
      return ok({
        data: KOLEKSI.map(k => ({
          kode: k.tipe,
          nama: k.nama,
          jumlah: DOKUMEN.filter(d => d.tipe === k.tipe).length
        })),
        meta: SAMPLE
      })
    return problem(404, 'Referensi tidak ditemukan')
  }

  if (a === 'puu' && parts.length === 1)
    return ok({
      data: PUU.map(k => ({ kode: k.kode, nama: k.nama, jumlah: 0 })),
      meta: SAMPLE
    })
  if (a === 'puu' && b && parts.length === 2) {
    if (!PUU.some(k => k.kode === b))
      return problem(404, 'Kategori tidak ditemukan')
    return ok({
      data: [],
      meta: { page: 1, per_page: 10, total: 0, total_pages: 0, sample: true }
    })
  }

  if (a === 'statistik' && parts.length === 1) {
    const peraturan = DOKUMEN.filter(d => d.tipe === 'peraturan')
    const berlaku = peraturan.filter(d => d.status === 'berlaku')
    const tahun = []
    for (let y = 2015; y <= TAHUN_BERJALAN; y++)
      tahun.push({
        tahun: y,
        jumlah: DOKUMEN.filter(d => d.tahun === y).length,
        berjalan: y === TAHUN_BERJALAN
      })
    return ok({
      data: {
        kpi: {
          total: DOKUMEN.length,
          peraturan_berlaku: berlaku.length,
          peraturan_total: peraturan.length,
          dilihat_30h: 2416,
          diunduh_30h: 387
        },
        per_koleksi: KOLEKSI.map(k => ({
          nama: NAMA_KOLEKSI_STAT[k.tipe],
          jumlah: DOKUMEN.filter(d => d.tipe === k.tipe).length
        })).sort((x, y) => y.jumlah - x.jumlah),
        status_peraturan: {
          berlaku: berlaku.filter(d => !d.diubah).length,
          berlaku_diubah: berlaku.filter(d => d.diubah).length,
          dicabut: peraturan.filter(d => d.status === 'dicabut').length
        },
        per_jenis: JENIS.map(j => ({
          nama: j.nama,
          jumlah: peraturan.filter(d => d.jenisKode === j.kode).length
        })).sort((x, y) => y.jumlah - x.jumlah),
        per_tahun: tahun
      },
      meta: SAMPLE
    })
  }

  if (a === 'halaman' && parts.length === 1)
    return ok({
      data: HALAMAN.map(({ slug, judul, grup, tingkat }) => ({
        slug,
        judul,
        grup,
        tingkat
      })),
      meta: SAMPLE
    })
  if (a === 'halaman' && b && parts.length === 2) {
    const h = [...HALAMAN, HALAMAN_UJI].find(x => x.slug === b)
    return h
      ? ok({
          data: {
            slug: h.slug,
            judul: h.judul,
            isi_html: h.isi,
            diperbarui: '2026-11-01'
          },
          meta: SAMPLE
        })
      : problem(404, 'Halaman tidak ditemukan')
  }

  return problem(404, 'Rute tidak ditemukan')
}
