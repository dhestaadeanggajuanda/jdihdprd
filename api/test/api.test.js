// Uji integrasi terhadap MySQL nyata (skema asli + data sintetis api/db/seed.sql).
// Menjalankan:
//   ADMIN_DB_URL=mysql://root@127.0.0.1:3307/jdih_test DB_RO_PASSWORD=... node scripts/load-db.mjs --fresh --grants
//   TEST_DB_URL=mysql://jdih_ro:...@127.0.0.1:3307/jdih_test npm test
// Tanpa TEST_DB_URL, uji dilewati.
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import mysql from 'mysql2/promise'
import { loadConfig } from '../src/config.js'
import { createDb } from '../src/db.js'
import { buildServer } from '../src/server.js'

const URL_ = process.env.TEST_DB_URL
const skip = URL_ ? false : 'TEST_DB_URL tidak diisi'

let app, db, dir, pageDir

async function make(extra = {}) {
  const cfg = loadConfig({
    DB_URL: URL_,
    CORS_ORIGINS: 'https://jdih.contoh.go.id,https://localhost',
    FILES_DIR: dir,
    PAGE_FILES_DIR: pageDir,
    API_SAMPLE: '1',
    RATE_LIMIT_MAX: '1000',
    ...extra
  })
  const instance = await buildServer({ db, cfg })
  await instance.ready()
  return instance
}

const get = async (path, { headers = {}, a = app } = {}) => {
  const res = await a.inject({ method: 'GET', url: `/api/v1${path}`, headers })
  let json = null
  try {
    json = JSON.parse(res.body)
  } catch {
    // bukan JSON
  }
  return {
    status: res.statusCode,
    headers: res.headers,
    json,
    body: res.body,
    raw: res
  }
}

before(async () => {
  if (skip) return
  dir = await mkdtemp(join(tmpdir(), 'jdih-files-'))
  pageDir = await mkdtemp(join(tmpdir(), 'jdih-page-'))
  await writeFile(join(dir, 'perda-7-2019.pdf'), '%PDF-1.4 uji perda 7')
  await writeFile(join(dir, 'perda-3-2023.pdf'), '%PDF-1.4 uji perda 3')
  await writeFile(join(dir, 'perda2-2012.pdf'), '%PDF-1.4 uji perda 2')
  await writeFile(
    join(pageDir, 'struktur.png'),
    Buffer.from('89504e470d0a1a0a', 'hex')
  )
  await writeFile(join(pageDir, 'sop.pdf'), '%PDF-1.4 sop')
  db = createDb(URL_)
  app = await make()
})

after(async () => {
  if (skip) return
  await app?.close()
  await db?.close()
  await rm(dir, { recursive: true, force: true })
  await rm(pageDir, { recursive: true, force: true })
})

describe('ringkasan dan daftar', { skip }, () => {
  test('ringkasan: hanya dokumen terbit dan tidak tersembunyi', async () => {
    const r = await get('/ringkasan')
    assert.equal(r.status, 200)
    const k = Object.fromEntries(r.json.data.koleksi.map(x => [x.tipe, x]))
    // peraturan terbit: id 1-9, 12, 17 (10 belum terbit, 11 disembunyikan)
    assert.equal(k.peraturan.jumlah, 11)
    assert.equal(k.peraturan.dicabut, 2) // id 4 (relasi) dan id 9 (status teks)
    assert.equal(k.peraturan.berlaku, 9)
    assert.deepEqual(
      [k.monografi.jumlah, k.artikel.jumlah, k.putusan.jumlah],
      [2, 1, 1]
    )
    assert.equal(r.json.data.terbaru.length, 3)
    assert.ok(
      r.json.data.terbaru.every(d => d.id !== '8'),
      'dokumen dengan promosikan_ke_beranda=Tidak tidak tampil di terbaru'
    )
    assert.equal(r.json.meta.sample, true)
    assert.equal(r.headers['x-data-sample'], 'true')
  })

  test('daftar: paginasi, metadata, dan urutan terbaru', async () => {
    const r = await get('/dokumen?per_page=4&page=2')
    assert.equal(r.status, 200)
    assert.deepEqual(r.json.meta, {
      page: 2,
      per_page: 4,
      total: 11,
      total_pages: 3,
      sample: true
    })
    assert.equal(r.json.data.length, 4)
    const all = (await get('/dokumen?per_page=50')).json.data
    const tgl = all.map(d => d.tanggal_penetapan)
    assert.deepEqual(tgl, [...tgl].sort().reverse(), 'terbaru dulu')
  })

  test('dokumen belum terbit atau disembunyikan tidak pernah muncul', async () => {
    const all = (
      await get('/dokumen?per_page=50&tipe=peraturan')
    ).json.data.map(d => d.id)
    assert.ok(!all.includes('10') && !all.includes('11'))
    assert.equal((await get('/dokumen/10')).status, 404)
    assert.equal((await get('/dokumen/11')).status, 404)
    assert.equal((await get('/dokumen/10/lampiran/10')).status, 404)
  })

  test('filter: jenis, status, diubah, nomor, tahun, subyek, tipe', async () => {
    const ids = async q =>
      (await get(`/dokumen?per_page=50&${q}`)).json.data
        .map(d => d.id)
        .sort((a, b) => a - b)
    assert.deepEqual(await ids('jenis=peraturan-daerah-kota'), [
      '1',
      '2',
      '3',
      '4',
      '5',
      '9',
      '12',
      '17'
    ])
    assert.deepEqual(await ids('status=dicabut'), ['4', '9'])
    assert.deepEqual(await ids('diubah=1'), ['2'])
    assert.deepEqual(await ids('nomor=7&tahun_dari=2019&tahun_sampai=2019'), [
      '2'
    ])
    assert.deepEqual(
      await ids(
        'tahun_dari=2022&tahun_sampai=2023&jenis=peraturan-daerah-kota'
      ),
      ['1', '3']
    )
    assert.deepEqual(await ids('subyek=pasar'), ['2'])
    assert.deepEqual(await ids('tipe=monografi'), ['13', '16'])
    assert.deepEqual(await ids('tipe=putusan'), ['15'])
  })

  test('pencarian kata kunci, pola nomor/tahun, dan karakter khusus LIKE', async () => {
    const ids = async q =>
      (await get(`/dokumen?per_page=50&q=${encodeURIComponent(q)}`)).json.data
        .map(d => d.id)
        .sort((a, b) => a - b)
    assert.deepEqual(await ids('retribusi pasar'), ['2', '3', '9'])
    assert.deepEqual(await ids('7/2019'), ['2'])
    assert.deepEqual(await ids('7 2019'), ['2'])
    assert.deepEqual(
      await ids('100%'),
      ['17'],
      '% dicari harfiah, bukan sebagai pola'
    )
    assert.deepEqual(await ids('_aman_'), ['17'], '_ dicari harfiah')
    assert.deepEqual(await ids('zzzz-tidak-ada'), [])
    const inj = await get(
      `/dokumen?q=${encodeURIComponent("'; DROP TABLE document; --")}`
    )
    assert.equal(inj.status, 200)
    assert.equal(
      (await get('/ringkasan')).json.data.koleksi[0].jumlah,
      11,
      'tabel utuh setelah masukan injeksi'
    )
  })

  test('urutan: nomor dan populer', async () => {
    const nomor = (await get('/dokumen?per_page=3&sort=nomor')).json.data
    const tahun = nomor.map(d => d.tahun)
    assert.deepEqual(
      tahun,
      tahun.toSorted((a, b) => b - a)
    )
    const populer = (await get('/dokumen?per_page=2&sort=populer')).json.data
    assert.equal(populer[0].id, '2')
  })

  test('parameter tidak valid ditolak 400 dengan problem+json tanpa rincian internal', async () => {
    for (const q of [
      'per_page=51',
      'per_page=0',
      'page=0',
      'page=1001',
      'page=abc',
      'tipe=rahasia',
      'status=x',
      'jenis=A%20B',
      'nomor=%3Cscript%3E',
      'tahun_dari=1800',
      'sort=acak',
      'q=a',
      `q=${'x'.repeat(101)}`
    ]) {
      const r = await get(`/dokumen?${q}`)
      assert.equal(r.status, 400, q)
      assert.match(r.headers['content-type'], /application\/problem\+json/)
      assert.deepEqual(Object.keys(r.json).sort(), ['status', 'title', 'type'])
    }
    assert.equal(
      (await get('/dokumen?foo=bar')).status,
      200,
      'parameter tak dikenal diabaikan'
    )
  })

  test('bilangan bulat tak hingga atau tak polos ditolak 400 (koersi Ajv meloloskan Infinity)', async () => {
    for (const q of [
      'page=Infinity',
      'page=-Infinity',
      'page=1e999',
      'per_page=Infinity',
      'per_page=1e1',
      'tahun_dari=Infinity',
      'tahun_sampai=1e999',
      'page=1.5',
      'page=%201',
      'page=%2B1',
      'page=1&page=2',
      'page='
    ]) {
      const r = await get(`/dokumen?${q}`)
      assert.equal(r.status, 400, q)
      assert.match(r.headers['content-type'], /application\/problem\+json/)
    }
    assert.equal(
      (await get('/puu/naskah-akademik?page=Infinity')).status,
      400,
      'berlaku juga untuk daftar PUU'
    )
    assert.equal(
      (await get('/dokumen?page=1&per_page=5&tahun_dari=2019')).status,
      200,
      'angka desimal polos tetap diterima'
    )
  })

  test('judul huruf besar dirapikan; nama jenis memakai huruf judul', async () => {
    const d = (await get('/dokumen?q=sampah')).json.data[0]
    assert.equal(d.judul, 'Pengelolaan Sampah Rumah Tangga')
    assert.equal(d.jenis, 'Peraturan Daerah Kota')
    assert.equal(d.singkatan, 'Perda')
  })

  test('riwayat ringkas pada daftar tidak membocorkan dokumen yang belum terbit', async () => {
    const d1 = (await get('/dokumen?q=3/2023')).json.data[0]
    assert.equal(d1.id, '1')
    assert.equal(
      d1.riwayat,
      null,
      'relasi ke dokumen id 10 (belum terbit) dan id 99999 diabaikan'
    )
    const d2 = (await get('/dokumen?q=7/2019')).json.data[0]
    assert.match(
      d2.riwayat,
      /Diubah oleh Peraturan Daerah Kota Nomor 5 Tahun 2022/
    )
  })
})

describe('detail', { skip }, () => {
  test('detail Perda 7/2019: status, relasi, linimasa, T.E.U., subjek, lampiran, kutipan', async () => {
    const r = await get('/dokumen/2')
    assert.equal(r.status, 200)
    const d = r.json.data
    assert.equal(d.status, 'berlaku')
    assert.equal(d.diubah, true)
    assert.equal(d.nomor, '7')
    assert.equal(d.tahun, 2019)
    assert.equal(d.dilihat, 128)
    assert.equal(d.diunduh, 54)
    assert.deepEqual(
      d.relasi.diubah_oleh.map(x => x.id),
      ['3']
    )
    assert.deepEqual(
      d.relasi.mencabut.map(x => x.id),
      ['9']
    )
    assert.equal(d.relasi.mencabut[0].status, 'dicabut')
    assert.equal(d.riwayat_status[0].saat_ini, true)
    assert.match(d.riwayat_status[0].keterangan, /Diubah oleh/)
    assert.ok(
      d.riwayat_status.some(
        x => x.keterangan === 'Ditetapkan' && x.tanggal === '2019-08-21'
      )
    )
    assert.deepEqual(
      d.teu.map(x => x.nama),
      ['Kota Singkawang', 'Dewan Perwakilan Rakyat Daerah Kota Singkawang']
    )
    assert.deepEqual(d.subjek, ['PASAR', 'PELAYANAN PUBLIK', 'RETRIBUSI'])
    assert.deepEqual(
      d.lampiran.map(l => l.peran),
      ['utama', 'abstrak']
    )
    assert.equal(
      d.kutipan,
      'Peraturan Daerah Kota Nomor 7 Tahun 2019 tentang Retribusi Pelayanan Pasar (LD 2019 (7))'
    )
    assert.match(d.status_keterangan, /telah diubah oleh/)
  })

  test('dokumen dicabut: status dari relasi dan dari teks status', async () => {
    const a = (await get('/dokumen/4')).json.data
    assert.equal(a.status, 'dicabut')
    assert.match(
      a.status_keterangan,
      /dicabut oleh Peraturan Daerah Kota Nomor 6 Tahun 2021/
    )
    const b = (await get('/dokumen/9')).json.data
    assert.equal(b.status, 'dicabut')
  })

  test('koleksi non-peraturan tidak punya status', async () => {
    const d = (await get('/dokumen/13')).json.data
    assert.equal(d.status, null)
    assert.equal(d.tipe, 'monografi')
    assert.equal(d.jenis, 'Buku Hukum')
  })

  test('respons memakai allowlist kolom: tidak ada kolom internal', async () => {
    const r = await get('/dokumen/2')
    for (const k of [
      '_created_by',
      '_updated_by',
      'created_at',
      'hit_see',
      'hit_download',
      'is_publish',
      'url_lampiran',
      'sembunyikan_di_opac',
      'integrasi',
      'isbn'
    ]) {
      assert.ok(!r.body.includes(`"${k}"`), `bocor: ${k}`)
    }
    assert.ok(
      !/perda-7-2019\.pdf/.test(r.body),
      'nama berkas di server tidak bocor'
    )
    assert.ok(
      !/localhost\/ildis|bphn\.jdihn/.test(
        (await get('/dokumen/3')).body + (await get('/dokumen/4')).body
      ),
      'URL sumber lampiran tidak bocor'
    )
  })

  test('ID tidak valid atau tidak ada', async () => {
    assert.equal((await get('/dokumen/abc')).status, 400)
    assert.equal((await get('/dokumen/12345678901')).status, 400)
    assert.equal((await get('/dokumen/99999')).status, 404)
    assert.equal((await get('/dokumen/1%20OR%201=1')).status, 400)
  })
})

describe('lampiran', { skip }, () => {
  test('berkas lokal: PDF attachment dengan nosniff (mode stream)', async () => {
    const r = await get('/dokumen/2/lampiran/2')
    assert.equal(r.status, 200)
    assert.equal(r.headers['content-type'], 'application/pdf')
    assert.match(
      r.headers['content-disposition'],
      /^attachment; filename="perda-7-2019\.pdf"/
    )
    assert.equal(r.headers['x-content-type-options'], 'nosniff')
    assert.match(r.body, /^%PDF-1\.4 uji perda 7/)
  })

  test('URL penuh pada host sisa (localhost) dipetakan ke berkas lokal lewat nama berkas', async () => {
    const r = await get('/dokumen/4/lampiran/5')
    assert.equal(r.status, 200)
    assert.match(r.body, /uji perda 2/)
  })

  test('host eksternal yang diizinkan dialihkan 302; host lain ditolak 404', async () => {
    const ok = await get('/dokumen/3/lampiran/4')
    assert.equal(ok.status, 302)
    assert.equal(
      ok.headers.location,
      'https://bphn.jdihn.go.id/common/dokumen/perda5.pdf'
    )
    assert.equal((await get('/dokumen/7/lampiran/7')).status, 404)
  })

  test('mode accel: nginx yang menyajikan berkas lewat X-Accel-Redirect', async () => {
    const a = await make({
      FILES_MODE: 'accel',
      FILES_ACCEL_PREFIX: '/internal-dokumen/'
    })
    const r = await get('/dokumen/2/lampiran/2', { a })
    assert.equal(r.status, 200)
    assert.equal(
      r.headers['x-accel-redirect'],
      '/internal-dokumen/perda-7-2019.pdf'
    )
    assert.equal(r.body, '')
    await a.close()
  })

  test('pembatasan: tertutup, dibatasi, nonaktif, traversal, pasangan ID salah, belum terbit', async () => {
    assert.equal(
      (await get('/dokumen/6/lampiran/6')).status,
      404,
      'akses Tertutup'
    )
    assert.equal(
      (await get('/dokumen/5/lampiran/11')).status,
      404,
      'pembatasan terisi'
    )
    assert.equal(
      (await get('/dokumen/9/lampiran/9')).status,
      404,
      'status lampiran nonaktif'
    )
    assert.equal(
      (await get('/dokumen/8/lampiran/8')).status,
      404,
      'jalur ../../etc/passwd'
    )
    assert.equal(
      (await get('/dokumen/1/lampiran/2')).status,
      404,
      'lampiran milik dokumen lain'
    )
    assert.equal(
      (await get('/dokumen/10/lampiran/10')).status,
      404,
      'dokumen belum terbit'
    )
    assert.equal((await get('/dokumen/2/lampiran/..%2f..%2fetc')).status, 400)
    assert.equal((await get('/dokumen/2/lampiran/abc')).status, 400)
  })

  test('berkas dengan pembatasan tidak tampil di daftar lampiran maupun sebagai berkas utama', async () => {
    assert.equal((await get('/dokumen/6')).json.data.lampiran.length, 0)
    assert.equal((await get('/dokumen/6')).json.data.berkas, null)
    assert.equal(
      (await get('/dokumen/7')).json.data.berkas,
      null,
      'host tak diizinkan'
    )
  })
})

describe('referensi, PUU, statistik, halaman', { skip }, () => {
  test('referensi jenis-peraturan: kode slug, nama huruf judul, jumlah terbit', async () => {
    const r = await get('/referensi/jenis-peraturan')
    const byKode = Object.fromEntries(r.json.data.map(x => [x.kode, x]))
    assert.equal(byKode['peraturan-daerah-kota'].nama, 'Peraturan Daerah Kota')
    assert.equal(byKode['peraturan-daerah-kota'].jumlah, 8)
    assert.equal(byKode['peraturan-walikota'].nama, 'Peraturan Walikota')
    assert.equal(byKode['peraturan-dprd-kota'].nama, 'Peraturan DPRD Kota')
    assert.ok(!('buku-hukum' in byKode), 'hanya jenis peraturan')
    assert.equal(
      (await get('/referensi/tipe')).json.data.find(x => x.kode === 'monografi')
        .jumlah,
      2
    )
    assert.equal((await get('/referensi/status')).json.data.length, 2)
    assert.equal((await get('/referensi/rahasia')).status, 404)
    assert.equal((await get('/referensi/A%20B')).status, 400)
  })

  test('PUU: kategori dengan jumlah dan dokumen per kategori', async () => {
    const r = await get('/puu')
    assert.equal(
      r.json.data.length,
      4,
      'hanya tipe dengan group legislation_formation dan slug'
    )
    assert.equal(r.json.data.find(x => x.kode === 'naskah-akademik').jumlah, 1)
    const l = await get('/puu/naskah-akademik')
    assert.deepEqual(
      l.json.data.map(d => d.id),
      ['16']
    )
    assert.equal(l.json.meta.total, 1)
    assert.equal((await get('/puu/rancangan-puu')).json.data.length, 0)
    assert.equal((await get('/puu/tidak-ada')).status, 404)
  })

  test('statistik: KPI, status, jenis, tahun, dan hitungan 30 hari', async () => {
    const s = (await get('/statistik')).json.data
    assert.equal(s.kpi.total, 15)
    assert.equal(s.kpi.peraturan_total, 11)
    assert.equal(s.kpi.peraturan_berlaku, 9)
    assert.deepEqual(s.status_peraturan, {
      berlaku: 8,
      berlaku_diubah: 1,
      dicabut: 2
    })
    assert.equal(s.kpi.dilihat_30h, 3)
    assert.equal(s.kpi.diunduh_30h, 1)
    assert.equal(s.per_tahun.length, 11)
    assert.equal(s.per_tahun.at(-1).berjalan, true)
    assert.equal(s.per_koleksi[0].nama, 'Peraturan Perundang-undangan')
    assert.equal(s.per_jenis[0].nama, 'Peraturan Daerah Kota')
  })

  test('halaman Tentang: daftar tanpa halaman kosong, isi HTML apa adanya (dibersihkan klien)', async () => {
    const l = (await get('/halaman')).json.data
    assert.deepEqual(
      l.map(x => x.slug),
      [
        'sekilas-sejarah',
        'dasar-hukum',
        'visi',
        'misi',
        'jdih-instansi',
        'sk-tim-pengelola',
        'sop'
      ]
    )
    assert.equal(
      l.find(x => x.slug === 'jdih-instansi').grup,
      'Struktur Organisasi'
    )
    const p = (await get('/halaman/dasar-hukum')).json.data
    assert.equal(p.judul, 'Dasar Hukum')
    assert.match(p.isi_html, /<ol>/)
    assert.doesNotMatch(
      p.isi_html,
      /script|onerror|<img|alert/i,
      'HTML dari DB dibersihkan di sisi server'
    )
    assert.equal(p.berkas, null)
    assert.equal(
      (await get('/halaman/bagian-hukum')).status,
      404,
      'berkas kosong'
    )
    assert.equal((await get('/halaman/tidak-ada')).status, 404)
    assert.equal((await get('/halaman/A_B')).status, 400)
  })

  test('halaman berbasis berkas: metadata dan gambar disajikan dengan header aman', async () => {
    const p = (await get('/halaman/jdih-instansi')).json.data
    assert.deepEqual(p.berkas, { tipe: 'gambar', nama: 'struktur.png' })
    assert.equal(p.isi_html, '')
    const img = await get('/halaman/jdih-instansi/berkas')
    assert.equal(img.status, 200)
    assert.equal(img.headers['content-type'], 'image/png')
    assert.equal(img.headers['content-disposition'], 'inline')
    assert.equal(img.headers['x-content-type-options'], 'nosniff')
    assert.match(img.headers['content-security-policy'], /default-src 'none'/)
    assert.equal((await get('/halaman/sop')).json.data.berkas.tipe, 'pdf')
    assert.match(
      (await get('/halaman/sop/berkas')).headers['content-disposition'],
      /^attachment/
    )
    assert.equal(
      (await get('/halaman/dasar-hukum/berkas')).status,
      404,
      'halaman HTML tidak punya berkas'
    )
  })
})

describe('keamanan lapisan HTTP', { skip }, () => {
  test('metode selain GET/HEAD ditolak 405', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const r = await app.inject({
        method,
        url: '/api/v1/dokumen',
        payload: { a: 1 }
      })
      assert.equal(r.statusCode, 405, method)
      assert.match(r.headers['content-type'], /problem\+json/)
      assert.equal(r.headers.allow, 'GET, HEAD, OPTIONS')
    }
    assert.equal(
      (await app.inject({ method: 'HEAD', url: '/api/v1/ringkasan' }))
        .statusCode,
      200
    )
  })

  test('CORS: allowlist origin, preflight, dan origin tak dikenal tidak mendapat izin', async () => {
    const ok = await get('/ringkasan', {
      headers: { origin: 'https://localhost' }
    })
    assert.equal(ok.headers['access-control-allow-origin'], 'https://localhost')
    assert.match(ok.headers.vary, /Origin/i)
    const bad = await get('/ringkasan', {
      headers: { origin: 'https://evil.example.com' }
    })
    assert.equal(bad.headers['access-control-allow-origin'], undefined)
    const pre = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/dokumen',
      headers: {
        origin: 'https://jdih.contoh.go.id',
        'access-control-request-method': 'GET'
      }
    })
    assert.equal(pre.statusCode, 204)
    assert.equal(
      pre.headers['access-control-allow-origin'],
      'https://jdih.contoh.go.id'
    )
    assert.ok(
      !/POST|PUT|DELETE/.test(pre.headers['access-control-allow-methods'])
    )
    const preBad = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/dokumen',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'GET'
      }
    })
    assert.equal(preBad.headers['access-control-allow-origin'], undefined)
  })

  test('header keamanan dan ID permintaan pada setiap respons, termasuk galat', async () => {
    for (const path of [
      '/ringkasan',
      '/dokumen/99999',
      '/dokumen?per_page=999',
      '/tidak-ada'
    ]) {
      const r = await get(path)
      assert.match(r.headers['x-request-id'], /^[0-9A-F]{4}-[0-9A-F]{4}$/, path)
      assert.equal(r.headers['x-content-type-options'], 'nosniff')
      assert.equal(
        r.headers['content-security-policy'],
        "default-src 'none';frame-ancestors 'none'",
        'CSP persis dan tanpa direktif longgar (unsafe-inline dll.)'
      )
      assert.match(r.headers['strict-transport-security'], /max-age=/)
      assert.equal(r.headers['referrer-policy'], 'no-referrer')
      assert.equal(r.headers['x-powered-by'], undefined)
    }
  })

  test('ID permintaan dari klien tidak dipercaya', async () => {
    const r = await get('/ringkasan', {
      headers: { 'x-request-id': 'penyusup\r\nX-Injected: 1' }
    })
    assert.match(r.headers['x-request-id'], /^[0-9A-F]{4}-[0-9A-F]{4}$/)
    assert.equal(r.headers['x-injected'], undefined)
  })

  test('batas laju: 429 problem+json setelah melewati batas', async () => {
    const a = await make({ RATE_LIMIT_MAX: '5' })
    let last
    for (let i = 0; i < 7; i++) last = await get('/ringkasan', { a })
    assert.equal(last.status, 429)
    assert.match(last.headers['content-type'], /problem\+json/)
    assert.equal(last.json.status, 429)
    await a.close()
  })

  test('galat database menghasilkan 500 generik tanpa jejak tumpukan atau SQL', async () => {
    const broken = await buildServer({
      cfg: loadConfig({ DB_URL: URL_ }),
      db: {
        query: async () => {
          throw new Error("Table 'x.y' doesn't exist; SELECT secret FROM z")
        },
        ping: async () => {
          throw new Error('x')
        }
      }
    })
    const r = await broken.inject({ method: 'GET', url: '/api/v1/ringkasan' })
    assert.equal(r.statusCode, 500)
    assert.deepEqual(Object.keys(JSON.parse(r.body)).sort(), [
      'status',
      'title',
      'type'
    ])
    assert.ok(!/SELECT|Table|secret|stack|at /.test(r.body))
    assert.equal(
      (await broken.inject({ method: 'GET', url: '/health' })).statusCode,
      503
    )
    await broken.close()
  })

  test('/health sehat tanpa membuka data', async () => {
    const r = await app.inject({ method: 'GET', url: '/health' })
    assert.equal(r.statusCode, 200)
    assert.deepEqual(JSON.parse(r.body), { status: 'ok' })
  })
})

describe('akun database baca-saja', { skip }, () => {
  test('INSERT/UPDATE/DELETE/DDL ditolak; tabel akun tidak terjangkau', async () => {
    const conn = await mysql.createConnection(URL_)
    const denied = async sql => {
      await assert.rejects(
        conn.query(sql),
        err =>
          [
            'ER_TABLEACCESS_DENIED_ERROR',
            'ER_COLUMNACCESS_DENIED_ERROR',
            'ER_DBACCESS_DENIED_ERROR',
            'ER_SPECIFIC_ACCESS_DENIED_ERROR'
          ].includes(err.code),
        sql
      )
    }
    await denied("INSERT INTO document (judul) VALUES ('x')")
    await denied('UPDATE document SET hit_see = 999 WHERE id = 1')
    await denied('DELETE FROM document WHERE id = 1')
    await denied('DROP TABLE document')
    await denied('SELECT * FROM `user`')
    await denied('SELECT * FROM `member`')
    await denied('SELECT * FROM visitor_log')
    await conn.end()
  })
})

test(
  'uji dilewati bila TEST_DB_URL kosong',
  { skip: skip ? false : 'basis data tersedia' },
  () => {
    assert.ok(true)
  }
)
