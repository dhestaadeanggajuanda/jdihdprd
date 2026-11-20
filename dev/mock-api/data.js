// Data CONTOH untuk pengembangan. Bukan dokumen DPRD nyata.
// Deterministik (benih tetap) dan konsisten dengan angka pada mockup:
// 173 dokumen = 128 peraturan + 14 monografi + 9 artikel + 22 putusan.
// Setiap respons membawa meta.sample = true agar UI menandainya sebagai contoh.

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261120)
const pick = arr => arr[Math.floor(rand() * arr.length)]
const shuffle = arr => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const JENIS = [
  {
    kode: 'perda',
    nama: 'Peraturan Daerah',
    singkatan: 'Perda',
    jumlah: 41,
    pemrakarsa: 'Pemerintah Kota Singkawang',
    dicabut: 3,
    diubah: 5
  },
  {
    kode: 'perwali',
    nama: 'Peraturan Wali Kota',
    singkatan: 'Perwali',
    jumlah: 33,
    pemrakarsa: 'Wali Kota Singkawang',
    dicabut: 2,
    diubah: 3
  },
  {
    kode: 'kepwali',
    nama: 'Keputusan Wali Kota',
    singkatan: 'Kepwali',
    jumlah: 17,
    pemrakarsa: 'Wali Kota Singkawang',
    dicabut: 2,
    diubah: 1
  },
  {
    kode: 'perdprd',
    nama: 'Peraturan DPRD',
    singkatan: 'Peraturan DPRD',
    jumlah: 12,
    pemrakarsa: 'DPRD Kota Singkawang',
    dicabut: 0,
    diubah: 1
  },
  {
    kode: 'kepdprd',
    nama: 'Keputusan DPRD',
    singkatan: 'Kep. DPRD',
    jumlah: 10,
    pemrakarsa: 'DPRD Kota Singkawang',
    dicabut: 1,
    diubah: 1
  },
  {
    kode: 'inswali',
    nama: 'Instruksi Wali Kota',
    singkatan: 'Inswali',
    jumlah: 6,
    pemrakarsa: 'Wali Kota Singkawang',
    dicabut: 0,
    diubah: 0
  },
  {
    kode: 'se',
    nama: 'Surat Edaran',
    singkatan: 'SE',
    jumlah: 5,
    pemrakarsa: 'Wali Kota Singkawang',
    dicabut: 0,
    diubah: 1
  },
  {
    kode: 'perber',
    nama: 'Peraturan Bersama',
    singkatan: 'Perber',
    jumlah: 4,
    pemrakarsa: 'Pemerintah Kota Singkawang',
    dicabut: 0,
    diubah: 0
  }
]

const TOPIK = [
  'Retribusi Pelayanan Kesehatan',
  'Pajak Hotel dan Restoran',
  'Penyelenggaraan Ketertiban Umum',
  'Pengelolaan Sampah Rumah Tangga',
  'Perlindungan Anak',
  'Pengelolaan Keuangan Daerah',
  'Penyelenggaraan Kearsipan',
  'Penataan Pedagang Kaki Lima',
  'Penyelenggaraan Pendidikan',
  'Izin Mendirikan Bangunan',
  'Pengelolaan Air Limbah Domestik',
  'Pelestarian Cagar Budaya',
  'Penyelenggaraan Kepemudaan',
  'Retribusi Penggunaan Aset Daerah',
  'Penanggulangan Bencana',
  'Penyelenggaraan Perhubungan',
  'Ketahanan Pangan',
  'Pengembangan Ekonomi Kreatif',
  'Penyelenggaraan Kesehatan Hewan',
  'Pengelolaan Pasar Rakyat',
  'Pajak Penerangan Jalan',
  'Penyelenggaraan Reklame',
  'Pengendalian Menara Telekomunikasi',
  'Perlindungan Penyandang Disabilitas',
  'Tata Cara Pengadaan Barang dan Jasa',
  'Penyusunan Produk Hukum Daerah',
  'Pembinaan Usaha Mikro',
  'Pengelolaan Taman dan Ruang Terbuka Hijau',
  'Penyelenggaraan Perpustakaan',
  'Pemberian Tambahan Penghasilan',
  'Pemanfaatan Barang Milik Daerah',
  'Penetapan Hari Jadi Kota',
  'Pengelolaan Pelabuhan Perikanan',
  'Penyelenggaraan Pelayanan Publik',
  'Rencana Kerja Pemerintah Daerah',
  'Pelaksanaan APBD Tahun Berjalan'
]
const SUBJEK = [
  'RETRIBUSI',
  'PAJAK',
  'PASAR',
  'PELAYANAN PUBLIK',
  'KEUANGAN DAERAH',
  'KETERTIBAN UMUM',
  'LINGKUNGAN',
  'PENDIDIKAN',
  'KESEHATAN',
  'EKONOMI',
  'ASET DAERAH',
  'PEMERINTAHAN'
]

// Dokumen kurasi: nomor dan tahun tetap, dipakai di mockup dan relasinya.
const KURASI = [
  {
    key: 'd1',
    jenis: 'perda',
    nomor: 3,
    tahun: 2023,
    judul: 'Pengelolaan Barang Milik Daerah',
    tgl: '2023-03-14',
    kb: 1228
  },
  {
    key: 'd2',
    jenis: 'perdprd',
    nomor: 1,
    tahun: 2022,
    judul: 'Tata Tertib Dewan Perwakilan Rakyat Daerah Kota Singkawang',
    tgl: '2022-02-09',
    kb: 840
  },
  {
    key: 'd3',
    jenis: 'perda',
    nomor: 7,
    tahun: 2019,
    judul: 'Retribusi Pelayanan Pasar',
    tgl: '2019-08-21',
    kb: 1024,
    diubah: true,
    status: 'berlaku'
  },
  {
    key: 'd4',
    jenis: 'perwali',
    nomor: 12,
    tahun: 2023,
    judul: 'Tata Cara Pemberian Insentif dan Kemudahan Penanaman Modal',
    tgl: '2023-02-02',
    kb: 980
  },
  {
    key: 'd5',
    jenis: 'perda',
    nomor: 2,
    tahun: 2012,
    judul: 'Pajak Reklame',
    tgl: '2012-01-19',
    kb: 760,
    status: 'dicabut'
  },
  {
    key: 'd6',
    jenis: 'kepdprd',
    nomor: 8,
    tahun: 2024,
    judul: 'Program Pembentukan Peraturan Daerah Tahun 2025',
    tgl: '2024-11-04',
    kb: 520
  },
  {
    key: 'd7',
    jenis: 'perda',
    nomor: 5,
    tahun: 2022,
    judul:
      'Perubahan atas Peraturan Daerah Nomor 7 Tahun 2019 tentang Retribusi Pelayanan Pasar',
    tgl: '2022-07-12',
    kb: 640
  },
  {
    key: 'd8',
    jenis: 'perda',
    nomor: 6,
    tahun: 2021,
    judul: 'Pajak Daerah',
    tgl: '2021-03-30',
    kb: 1434
  },
  {
    key: 'd9',
    jenis: 'perda',
    nomor: 4,
    tahun: 2020,
    judul: 'Penyelenggaraan Perparkiran',
    tgl: '2020-05-18',
    kb: 910
  },
  {
    key: 'd0',
    jenis: 'perda',
    nomor: 4,
    tahun: 2011,
    judul: 'Retribusi Pasar',
    tgl: '2011-04-04',
    kb: 700,
    status: 'dicabut'
  }
]

// Sebaran tahun penetapan (cocok dengan mockup Statistik) + 10 dokumen lebih lama.
const TAHUN_COUNTS = {
  2010: 2,
  2011: 2,
  2012: 2,
  2013: 2,
  2014: 2,
  2015: 6,
  2016: 9,
  2017: 11,
  2018: 14,
  2019: 12,
  2020: 15,
  2021: 18,
  2022: 21,
  2023: 24,
  2024: 19,
  2025: 14
}
export const TAHUN_BERJALAN = 2025

function pad(n) {
  return String(n).padStart(2, '0')
}
function tanggalAcak(tahun) {
  const bulan =
    tahun === TAHUN_BERJALAN
      ? 1 + Math.floor(rand() * 10)
      : 1 + Math.floor(rand() * 12)
  return `${tahun}-${pad(bulan)}-${pad(1 + Math.floor(rand() * 28))}`
}

function buatDokumen() {
  const docs = []
  const pool = []
  for (const [y, n] of Object.entries(TAHUN_COUNTS))
    for (let i = 0; i < n; i++) pool.push(Number(y))
  // Tahun yang sudah dipakai dokumen kurasi dikeluarkan dari kolam.
  for (const k of KURASI) {
    const i = pool.indexOf(k.tahun)
    if (i >= 0) pool.splice(i, 1)
  }
  const tahunAcak = shuffle(pool)
  const used = new Set(KURASI.map(k => `${k.jenis}:${k.tahun}:${k.nomor}`))
  const nextNomor = (jenis, tahun) => {
    let n = 1
    while (used.has(`${jenis}:${tahun}:${n}`)) n++
    used.add(`${jenis}:${tahun}:${n}`)
    return n
  }

  // Peraturan: jumlah per jenis dikurangi dokumen kurasi.
  for (const j of JENIS) {
    const kurasi = KURASI.filter(k => k.jenis === j.kode)
    const perlu = j.jumlah - kurasi.length
    for (let i = 0; i < perlu; i++) {
      const tahun = tahunAcak.pop()
      docs.push({
        tipe: 'peraturan',
        jenisKode: j.kode,
        tahun,
        nomor: nextNomor(j.kode, tahun),
        judul: pick(TOPIK),
        tgl: tanggalAcak(tahun),
        kb: 400 + Math.floor(rand() * 1800)
      })
    }
  }
  for (const k of KURASI)
    docs.push({
      tipe: 'peraturan',
      jenisKode: k.jenis,
      tahun: k.tahun,
      nomor: k.nomor,
      judul: k.judul,
      tgl: k.tgl,
      kb: k.kb,
      kurasi: k.key,
      status: k.status,
      diubahTetap: k.diubah
    })

  // Status: dicabut dan diubah sesuai target per jenis (kurasi menang).
  for (const j of JENIS) {
    const group = docs.filter(
      d => d.jenisKode === j.kode && d.tipe === 'peraturan'
    )
    const free = shuffle(group.filter(d => !d.kurasi))
    const dicabutTetap = group.filter(d => d.status === 'dicabut').length
    const diubahTetap = group.filter(d => d.diubahTetap).length
    for (let i = 0; i < j.dicabut - dicabutTetap; i++) {
      const d = free.pop()
      if (d) d.status = 'dicabut'
    }
    for (let i = 0; i < j.diubah - diubahTetap; i++) {
      const d = free.pop()
      if (d) d.diubahTetap = true
    }
  }

  // Monografi, artikel, putusan.
  const lain = [
    [
      'monografi',
      14,
      [
        'Kajian Hukum',
        'Bunga Rampai Hukum Daerah',
        'Hukum Pemerintahan Daerah'
      ],
      'Buku'
    ],
    ['artikel', 9, ['Artikel', 'Majalah Hukum', 'Opini Hukum'], 'Artikel'],
    [
      'putusan',
      22,
      [
        'Putusan Pengadilan Negeri',
        'Putusan Pengadilan Tata Usaha Negara',
        'Putusan Mahkamah Agung'
      ],
      'Putusan'
    ]
  ]
  for (const [tipe, n, jenisList] of lain) {
    for (let i = 0; i < n; i++) {
      const tahun = tahunAcak.pop()
      docs.push({
        tipe,
        jenisNama: jenisList[i % jenisList.length],
        tahun,
        nomor: tipe === 'putusan' ? `${10 + i}/Pdt.G/${tahun}/PN Skw` : null,
        judul:
          tipe === 'putusan'
            ? `Perkara perdata nomor ${10 + i}`
            : `${pick(TOPIK)}`,
        tgl: tanggalAcak(tahun),
        kb: 300 + Math.floor(rand() * 2000)
      })
    }
  }

  return docs
}

const mentah = buatDokumen()

// Relasi antardokumen kurasi (kunci = d.kurasi).
export const RELASI = {
  d3: { mencabut: ['d0'], diubahOleh: ['d7'] },
  d7: { mengubah: ['d3'] },
  d5: { dicabutOleh: ['d8'] },
  d8: { mencabut: ['d5'] },
  d0: { dicabutOleh: ['d3'] }
}

export const DOKUMEN = mentah
  .sort((a, b) => (a.tgl < b.tgl ? 1 : a.tgl > b.tgl ? -1 : 0))
  .map((d, i) => {
    const id = String(i + 1)
    const jenis = JENIS.find(j => j.kode === d.jenisKode)
    const status =
      d.tipe === 'peraturan'
        ? d.status === 'dicabut'
          ? 'dicabut'
          : 'berlaku'
        : null
    return {
      id,
      kurasi: d.kurasi ?? null,
      tipe: d.tipe,
      jenisKode: d.jenisKode ?? null,
      jenis: jenis?.nama ?? d.jenisNama,
      singkatan: jenis?.singkatan ?? null,
      nomor: d.nomor === null ? null : String(d.nomor),
      tahun: d.tahun,
      judul: d.judul,
      status,
      diubah: Boolean(d.diubahTetap) && status === 'berlaku',
      tanggal: d.tgl,
      pemrakarsa:
        jenis?.pemrakarsa ??
        (d.tipe === 'putusan'
          ? 'Pengadilan Negeri Singkawang'
          : 'Perpustakaan Hukum DPRD'),
      ukuranByte: d.kb * 1024,
      subjek: shuffle(SUBJEK).slice(0, 2 + Math.floor(rand() * 2)),
      dilihat: Math.floor(rand() * 220),
      diunduh: Math.floor(rand() * 90)
    }
  })

export const byKurasi = key => DOKUMEN.find(d => d.kurasi === key)

const namaNomor = d => `${d.jenis} Nomor ${d.nomor} Tahun ${d.tahun}`

// Riwayat singkat (satu baris) untuk dokumen yang berelasi.
for (const [key, rel] of Object.entries(RELASI)) {
  const d = byKurasi(key)
  if (!d) continue
  const bagian = []
  for (const k of rel.diubahOleh ?? [])
    bagian.push(`Diubah oleh ${namaNomor(byKurasi(k))}`)
  for (const k of rel.dicabutOleh ?? [])
    bagian.push(`Dicabut oleh ${namaNomor(byKurasi(k))}`)
  for (const k of rel.mengubah ?? [])
    bagian.push(`Mengubah ${namaNomor(byKurasi(k))}`)
  for (const k of rel.mencabut ?? [])
    bagian.push(`Mencabut ${namaNomor(byKurasi(k))}`)
  d.riwayat = bagian.join('; ') || null
}
// Perda 7/2019: angka dan subjek seperti pada mockup Detail.
const perda7 = byKurasi('d3')
if (perda7) {
  perda7.dilihat = 128
  perda7.diunduh = 54
  perda7.subjek = ['RETRIBUSI', 'PASAR', 'PELAYANAN PUBLIK']
}

export const HALAMAN = [
  {
    slug: 'sekilas-sejarah',
    judul: 'Sekilas Sejarah',
    grup: null,
    tingkat: 0,
    isi: '<p>Halaman ini memuat contoh isi sejarah singkat JDIH DPRD Kota Singkawang. Isi sebenarnya dikelola instansi.</p>'
  },
  {
    slug: 'dasar-hukum',
    judul: 'Dasar Hukum',
    grup: null,
    tingkat: 0,
    isi: '<p>Jaringan Dokumentasi dan Informasi Hukum DPRD Kota Singkawang diselenggarakan dengan berpedoman pada ketentuan berikut.</p><ol><li>Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.</li><li>Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah.</li><li>Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional.</li></ol><h2>Cara membaca halaman ini</h2><p>Isi di atas hanyalah contoh untuk memperlihatkan tata letak membaca: judul, paragraf dengan lebar baris yang nyaman, dan daftar bernomor.</p>'
  },
  {
    slug: 'visi',
    judul: 'Visi',
    grup: null,
    tingkat: 0,
    isi: '<p>Contoh isi visi. Dikelola instansi.</p>'
  },
  {
    slug: 'misi',
    judul: 'Misi',
    grup: null,
    tingkat: 0,
    isi: '<ol><li>Contoh misi pertama.</li><li>Contoh misi kedua.</li></ol>'
  },
  {
    slug: 'jdih-instansi',
    judul: 'JDIH Instansi',
    grup: 'Struktur Organisasi',
    tingkat: 1,
    isi: '<p>Contoh struktur JDIH instansi.</p>'
  },
  {
    slug: 'bagian-hukum',
    judul: 'Biro/Bagian Hukum',
    grup: 'Struktur Organisasi',
    tingkat: 1,
    isi: '<p>Contoh susunan bagian hukum.</p>'
  },
  {
    slug: 'sk-tim-pengelola',
    judul: 'SK Tim Pengelola',
    grup: null,
    tingkat: 0,
    isi: '<p>Contoh isi SK tim pengelola.</p>'
  },
  {
    slug: 'sop',
    judul: 'SOP',
    grup: null,
    tingkat: 0,
    isi: '<p>Contoh isi prosedur operasional standar.</p>'
  }
]

// Halaman uji sanitasi (tidak ada di daftar). Dipakai memeriksa DOMPurify di peramban.
export const HALAMAN_UJI = {
  slug: 'uji-sanitasi',
  judul: 'Uji sanitasi',
  isi: '<p>Teks aman.</p><script>window.__xss=1</script><img src="x" onerror="window.__xss=1"><a href="javascript:window.__xss=1">tautan jahat</a><a href="https://example.com" target="_blank">tautan luar</a><iframe src="https://example.com"></iframe><svg onload="window.__xss=1"></svg><p onclick="window.__xss=1">paragraf</p>'
}

export const PUU = [
  { kode: 'naskah-akademik', nama: 'Naskah Akademik' },
  { kode: 'rancangan-perda', nama: 'Rancangan Peraturan Daerah' },
  { kode: 'propemperda', nama: 'Program Pembentukan Perda' },
  { kode: 'risalah-rapat', nama: 'Risalah Rapat' },
  { kode: 'dim', nama: 'Daftar Inventarisasi Masalah' },
  { kode: 'laporan-pembahasan', nama: 'Laporan Hasil Pembahasan' },
  { kode: 'telaahan-staf', nama: 'Telaahan Staf' },
  { kode: 'kajian-hukum', nama: 'Kajian Hukum' },
  { kode: 'lainnya', nama: 'Dokumen Lainnya' }
]
