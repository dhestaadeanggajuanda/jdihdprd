// Uji peramban terhadap API NYATA (data uji sintetis dari api/db/seed.sql), bukan API palsu.
//   1) API:   DB_URL=... API_SAMPLE=1 node api/src/index.js
//   2) Klien: DEV_API=http://127.0.0.1:3000 npx quasar dev --port 9005
//   3) BASE_URL=http://localhost:9005 node tests/e2e/real-api.mjs
//
// Terhadap BUILD PRODUKSI di balik nginx (docs/deploy/frontend-baota.md, bagian Pengujian): bundel
// menanam https://jdih.dprd.singkawangkota.go.id sebagai origin API, jadi Chrome uji memetakan host
// itu ke nginx uji dan menerima sertifikat uji, tanpa menyentuh situs produksi:
//   CHROME_ARGS='["--host-resolver-rules=MAP jdih.dprd.singkawangkota.go.id 127.0.0.1:18443","--ignore-certificate-errors"]'
//   BASE_URL=https://jdih.dprd.singkawangkota.go.id node tests/e2e/real-api.mjs
// Bila halaman dibuka dari origin lain (origin sementara), tambahkan host API ke daftar host yang
// diizinkan: EXTRA_ALLOWED_HOSTS=jdih.dprd.singkawangkota.go.id
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BASE = process.env.BASE_URL ?? 'http://localhost:9005'
const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
const CHROME_ARGS = JSON.parse(process.env.CHROME_ARGS ?? '[]')
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8'
)
const ALLOWED = new Set([
  new URL(BASE).host,
  'mediacenter.singkawangkota.go.id',
  ...(process.env.EXTRA_ALLOWED_HOSTS ?? '').split(',').filter(Boolean)
])
const results = []
const check = (cond, name, detail = '') =>
  results.push({ ok: Boolean(cond), name, detail })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', ...CHROME_ARGS]
})

async function open(path, vp = { width: 1280, height: 800 }) {
  const page = await browser.newPage()
  await page.setViewport(vp)
  const log = { errors: [], hosts: new Set() }
  page.on('console', m => {
    if (
      ['error', 'warning'].includes(m.type()) &&
      !/Failed to load resource/.test(m.text())
    ) {
      log.errors.push(m.text())
    }
  })
  page.on('pageerror', e => log.errors.push(String(e.message)))
  page.on('request', r => {
    try {
      log.hosts.add(new URL(r.url()).host)
    } catch {
      // abaikan URL non-http
    }
  })
  await page.evaluateOnNewDocument(() => {
    window.__csp = []
    document.addEventListener('securitypolicyviolation', e =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    )
  })
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#main', { timeout: 40000 })
  await page
    .waitForNetworkIdle({ idleTime: 900, timeout: 25000 })
    .catch(() => {})
  page.log = log
  return page
}
const text = (p, s) =>
  p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null)

async function audit(page, label) {
  check(
    (await page.evaluate(() => window.__csp)).length === 0,
    `${label}: tanpa pelanggaran CSP`
  )
  check(
    [...page.log.hosts].every(h => ALLOWED.has(h)),
    `${label}: tanpa host pihak ketiga`,
    [...page.log.hosts].join(',')
  )
  check(
    page.log.errors.length === 0,
    `${label}: tanpa galat konsol`,
    page.log.errors.slice(0, 2).join(' | ')
  )
  // Menyuntikkan axe-core (berkas lokal dari node_modules, bukan masukan pengguna) ke halaman uji.
  // Hanya di alat uji; kode aplikasi tidak memakai eval atau injeksi skrip.
  await page.evaluate(axeSource)
  const axe = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
      }
    })
  )
  check(
    axe.violations.length === 0,
    `${label}: axe WCAG 2.2 AA`,
    axe.violations
      .map(v => `${v.id}: ${v.nodes[0].target.join(' ')}`)
      .join(' ; ')
  )
}

try {
  const phone = {
    width: 360,
    height: 800,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1
  }
  for (const [name, path, vp] of [
    ['beranda', '/', undefined],
    ['beranda-ponsel', '/', phone],
    ['dokumen', '/dokumen', undefined],
    ['detail', '/dokumen/2', undefined],
    ['statistik', '/statistik', undefined],
    ['tentang-struktur', '/tentang/jdih-instansi', undefined],
    ['tentang-html', '/tentang/dasar-hukum', undefined],
    ['puu', '/pembentukan-puu/naskah-akademik', undefined]
  ]) {
    const page = await open(path, vp)
    await audit(page, name)
    if (name === 'beranda') {
      check(
        (await text(page, '.colls')).includes('Peraturan'),
        'beranda: koleksi dari API nyata'
      )
      const chips = await page.$$eval('.shortcuts .chip', c =>
        c.map(x => x.textContent.trim())
      )
      check(
        chips.join('|') === 'Hanya yang berlaku|Perda|Perwali|Peraturan DPRD',
        'beranda: pintasan jenis dibentuk dari data',
        chips.join('|')
      )
      const hrefs = await page.$$eval('.shortcuts .chip', c =>
        c.map(x => x.getAttribute('href'))
      )
      check(
        hrefs.some(h => h.includes('jenis=peraturan-daerah-kota')),
        'beranda: pintasan Perda memakai kode jenis dari API',
        hrefs.join(' ')
      )
      check(
        (await page.$$eval('.docs .doc', d => d.length)) === 3,
        'beranda: tiga produk hukum terbaru'
      )
    }
    if (name === 'dokumen') {
      const sum = await text(page, '.sumrow p')
      check(
        sum.includes('dari 11 dokumen'),
        'dokumen: total 11 peraturan terbit',
        sum
      )
    }
    if (name === 'detail') {
      const h = await text(page, 'h1.dtitle')
      check(
        h.startsWith('Peraturan Daerah Kota Nomor 7 Tahun 2019'),
        'detail: judul dari API',
        h
      )
      check(
        (await page.$$eval('.rel li', l => l.length)) === 2,
        'detail: dua relasi (mencabut dan diubah oleh)'
      )
      const href = await page.$eval('.actions a.btn-primary', a =>
        a.getAttribute('href')
      )
      // Server dev (Vite) menjawab 204 untuk fetch `Accept: */*` dari dalam halaman, jadi pada dev
      // (tautan relatif di host lokal) tetap memakai fetch Node. Terhadap build produksi di balik nginx,
      // diambil DARI DALAM halaman: fetch Node tidak ikut pemetaan host Chrome dan akan menyentuh
      // situs produksi sungguhan.
      const viaNode =
        href.startsWith('/') &&
        ['localhost', '127.0.0.1'].includes(new URL(BASE).hostname)
      const res = viaNode
        ? await fetch(BASE + href).then(r => ({
            status: r.status,
            type: r.headers.get('content-type'),
            cd: r.headers.get('content-disposition') ?? ''
          }))
        : await page.evaluate(async h => {
            const r = await fetch(h)
            return {
              status: r.status,
              type: r.headers.get('content-type'),
              cd: r.headers.get('content-disposition') ?? ''
            }
          }, href)
      // Lintas-origin (origin sementara), JavaScript tidak boleh membaca Content-Disposition
      // (bukan header yang diekspos CORS); tautan unduh biasa tetap menerimanya.
      const lintasOrigin = new URL(href, BASE).origin !== new URL(BASE).origin
      check(
        res.status === 200 &&
          res.type === 'application/pdf' &&
          (lintasOrigin || /attachment/.test(res.cd)),
        `detail: unduhan berkas dilayani PDF${lintasOrigin ? ' (lintas-origin: header unduhan tidak terbaca JS)' : ' attachment'}`,
        `${res.status} ${res.type}`
      )
    }
    if (name === 'tentang-struktur') {
      const ok = await page
        .$eval('.page-figure img', i => i.complete && i.naturalWidth > 0)
        .catch(() => false)
      check(ok, 'tentang: gambar struktur organisasi dimuat dari API')
    }
    if (name === 'tentang-html') {
      const bahaya = await page.$eval('.safe-html', el => ({
        s: el.querySelectorAll('script,img,iframe').length,
        x: window.__xss
      }))
      check(
        bahaya.s === 0 && !bahaya.x,
        'tentang: HTML dari DB dibersihkan (script dan onerror tidak jalan)'
      )
    }
    if (name === 'statistik') {
      check(
        (await text(page, '.kpis')).includes('11'),
        'statistik: angka dari API nyata'
      )
    }
    if (name === 'puu') {
      check(
        (await page.$$eval('.docs .doc', d => d.length)) === 1,
        'puu: satu dokumen pada kategori naskah-akademik'
      )
    }
    await page.close()
  }

  // Filter lewat UI terhadap API nyata
  const p = await open('/dokumen')
  await p.evaluate(() =>
    [...document.querySelectorAll('.filters label.opt')]
      .find(l => l.textContent.trim().startsWith('Dicabut'))
      ?.click()
  )
  await p.click('.filters .fa .btn-primary')
  await p.waitForFunction(() => location.search.includes('status=dicabut'), {
    timeout: 8000
  })
  await p.waitForFunction(
    () =>
      /dari 2 dokumen/.test(
        document.querySelector('.sumrow p')?.textContent ?? ''
      ),
    { timeout: 8000 }
  )
  check(true, 'filter UI: status Dicabut menghasilkan 2 peraturan')
  await p.close()
} finally {
  await browser.close()
}

const failed = results.filter(r => !r.ok)
for (const r of results) {
  console.log(
    `${r.ok ? 'LULUS' : 'GAGAL'}  ${r.name}${r.ok || !r.detail ? '' : `\n         -> ${r.detail}`}`
  )
}
console.log(`\n${results.length - failed.length}/${results.length} lulus`)
process.exit(failed.length ? 1 : 0)
