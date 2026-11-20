// Uji ujung-ke-ujung di Chrome sungguhan: alur pengguna, aksesibilitas (axe, WCAG 2.2 AA),
// keamanan (CSP, permintaan pihak ketiga, XSS), dan keadaan galat/offline.
//
// Pemakaian:
//   1) npm run dev           (server pengembangan + API palsu)
//   2) npm run test:e2e      (BASE_URL=http://localhost:9001 CHROME_PATH=... bila perlu)
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BASE = process.env.BASE_URL ?? 'http://localhost:9000'
const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8'
)

const ALLOWED_HOSTS = new Set([
  new URL(BASE).host,
  'mediacenter.singkawangkota.go.id'
])
const PHONE = {
  width: 360,
  height: 800,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true
}
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 }
const DOC_ID = process.env.DOC_ID ?? '117' // Perda 7/2019 pada data contoh

const results = []
const pass = (name, detail = '') => results.push({ ok: true, name, detail })
const fail = (name, detail = '') => results.push({ ok: false, name, detail })
const check = (cond, name, detail = '') =>
  cond ? pass(name) : fail(name, detail)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox']
})

async function openPage(viewport, { scheme = 'light' } = {}) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme }
  ])
  const log = { console: [], requests: new Set(), csp: [], pageErrors: [] }
  page.on('console', m => {
    if (['error', 'warning'].includes(m.type()))
      log.console.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', e => log.pageErrors.push(String(e.message)))
  page.on('request', r => {
    try {
      log.requests.add(new URL(r.url()).host)
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
  page.log = log
  return page
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#main', { timeout: 15000 })
  await page
    .waitForNetworkIdle({ idleTime: 700, timeout: 20000 })
    .catch(() => {})
}

async function auditPage(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )
  check(
    overflow <= 0,
    `${label}: tanpa luapan horizontal`,
    `selisih ${overflow}px`
  )
  const csp = await page.evaluate(() => window.__csp)
  check(csp.length === 0, `${label}: tanpa pelanggaran CSP`, csp.join(' | '))
  const hosts = [...page.log.requests].filter(h => !ALLOWED_HOSTS.has(h))
  check(
    hosts.length === 0,
    `${label}: tanpa permintaan ke host lain`,
    hosts.join(', ')
  )
  check(
    page.log.pageErrors.length === 0,
    `${label}: tanpa galat JavaScript`,
    page.log.pageErrors.join(' | ')
  )
  const consoleErrors = page.log.console.filter(
    m => !/Failed to load resource.*(503|404)|ERR_FAILED|favicon/i.test(m)
  )
  check(
    consoleErrors.length === 0,
    `${label}: tanpa galat/peringatan konsol`,
    consoleErrors.slice(0, 3).join(' | ')
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
  const v = axe.violations.map(
    x => `${x.id}(${x.nodes.length}): ${x.nodes[0].target.join(' ')}`
  )
  check(
    v.length === 0,
    `${label}: axe WCAG 2.2 AA tanpa pelanggaran`,
    v.join(' ; ')
  )
}

// Satu bagian yang gagal (galat skrip, elemen tidak ditemukan) dicatat dan tidak menghentikan bagian lain.
let sectionNo = 0
async function section(fn) {
  sectionNo += 1
  try {
    await fn()
  } catch (err) {
    fail(
      `bagian uji #${sectionNo} terhenti`,
      String(err.message).split('\n')[0]
    )
  }
}

const text = (page, sel) =>
  page
    .$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim())
    .catch(() => null)

try {
  // ---------- Audit halaman: ponsel dan desktop ----------
  const ROUTES = [
    ['beranda', '/'],
    ['dokumen', '/dokumen'],
    [
      'dokumen-filter',
      '/dokumen?jenis=perda&status=berlaku&tahun_dari=2019&tahun_sampai=2023'
    ],
    ['detail', `/dokumen/${DOC_ID}`],
    ['berita', '/berita'],
    ['statistik', '/statistik'],
    ['tentang', '/tentang/dasar-hukum'],
    ['info', '/info'],
    ['puu', '/pembentukan-puu'],
    ['404', '/halaman-tidak-ada']
  ]
  for (const [vpName, vp] of [
    ['ponsel', PHONE],
    ['desktop', DESKTOP]
  ]) {
    for (const scheme of ['light', 'dark']) {
      for (const [name, path] of ROUTES) {
        if (
          scheme === 'dark' &&
          !['beranda', 'detail', 'statistik', 'info'].includes(name)
        )
          continue
        const page = await openPage(vp, { scheme })
        await go(page, path)
        const h1 = await page.$$eval('h1', els => els.length)
        check(
          h1 === 1,
          `${name}/${vpName}/${scheme}: tepat satu <h1>`,
          `ditemukan ${h1}`
        )
        const title = await page.title()
        check(
          /JDIH DPRD Kota Singkawang/.test(title) &&
            (name === 'beranda' || title.includes('·')),
          `${name}/${vpName}/${scheme}: judul dokumen memuat nama halaman dan situs`,
          title
        )
        await auditPage(page, `${name}/${vpName}/${scheme}`)
        await page.close()
      }
    }
  }

  // ---------- Alur: pencarian kata kunci -> hasil -> detail ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    await page.type('.hero input[type=search]', 'retribusi')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => location.pathname === '/dokumen', {
      timeout: 8000
    })
    await page.waitForSelector('.doc', { timeout: 8000 })
    check(
      page.url().includes('q=retribusi'),
      'alur: kata kunci masuk ke URL',
      page.url()
    )
    const n = await page.$$eval('.doc', e => e.length)
    check(n > 0, 'alur: pencarian "retribusi" menghasilkan dokumen', `n=${n}`)

    // Nomor + tahun
    await go(page, '/')
    await page.click('.seg button:nth-child(2)')
    await page.type('input[aria-label="Nomor peraturan"]', '7')
    await page.type('input[aria-label="Tahun"]', '2019')
    await page.click('.hero button[type=submit]')
    // Beranda juga punya kartu .doc: tunggu daftar hasil, bukan sembarang kartu.
    await page.waitForFunction(() => location.pathname === '/dokumen', {
      timeout: 8000
    })
    await page.waitForFunction(
      () => document.querySelectorAll('.docs.list .doc').length > 0,
      { timeout: 8000 }
    )
    const hasil = await page.$$eval('.docs.list .doc h3 b', e =>
      e.map(x => x.textContent.trim())
    )
    check(
      hasil.length === 1 && /Nomor 7 Tahun 2019/.test(hasil[0]),
      'alur: nomor 7 + tahun 2019 menemukan Perda 7/2019',
      hasil.join(' | ')
    )
    await page.evaluate(() =>
      document.querySelector('.docs.list .doc h3 a').click()
    )
    await page.waitForSelector('h1.dtitle', { timeout: 8000 })
    check(
      (await text(page, 'h1.dtitle')).includes(
        'Peraturan Daerah Nomor 7 Tahun 2019'
      ),
      'alur: halaman detail terbuka'
    )
    await page
      .waitForFunction(() => /Perda 7\/2019/.test(document.title), {
        timeout: 5000
      })
      .catch(() => {})
    check(
      document_title_ok(await page.title()),
      'alur: judul dokumen mengikuti halaman',
      await page.title()
    )

    // Pesan validasi tanpa dialog bawaan peramban
    await go(page, '/')
    await page.type('.hero input[type=search]', 'a')
    await page.keyboard.press('Enter')
    const err = await text(page, '.field-error')
    check(
      err && /minimal 2/.test(err),
      'alur: kata kunci 1 huruf ditolak dengan pesan',
      String(err)
    )
    check(page.url().endsWith('/'), 'alur: validasi tidak berpindah halaman')

    // Tautan unduhan: PDF dengan header aman
    await go(page, `/dokumen/${DOC_ID}`)
    const href = await page.$eval('.actions a.btn-primary', a =>
      a.getAttribute('href')
    )
    check(
      new RegExp(`^/api/v1/dokumen/${DOC_ID}/lampiran/f${DOC_ID}$`).test(href),
      'detail: tautan unduh memakai ID buram',
      href
    )
    const rel = await page.$eval('.actions a.btn-primary', a => a.rel)
    check(
      rel.includes('noopener') && rel.includes('noreferrer'),
      'detail: tautan unduh memakai rel noopener noreferrer',
      rel
    )
    const res = await fetch(BASE + href)
    const head = {
      type: res.headers.get('content-type'),
      cd: res.headers.get('content-disposition'),
      nosniff: res.headers.get('x-content-type-options')
    }
    const pdf = Buffer.from(await res.arrayBuffer())
      .subarray(0, 5)
      .toString()
    check(
      head.type === 'application/pdf' &&
        /attachment/.test(head.cd) &&
        head.nosniff === 'nosniff' &&
        pdf === '%PDF-',
      'detail: berkas dilayani sebagai PDF attachment + nosniff',
      JSON.stringify(head)
    )
    await page.close()
  })

  // ---------- Filter: lembar bawah (ponsel) ----------
  await section(async () => {
    const page = await openPage(PHONE)
    await go(page, '/dokumen')
    await page.click('.toolbar .icon-btn')
    await page.waitForSelector('.sheet', { visible: true, timeout: 5000 })
    const role = await page
      .$eval('.q-dialog', el => el.getAttribute('role'))
      .catch(() => null)
    check(
      role === 'dialog',
      'filter ponsel: lembar berperan dialog',
      String(role)
    )
    // Jebakan fokus: fokus berada di dalam lembar (setelah transisi masuk)
    await new Promise(r => setTimeout(r, 600))
    const inside = await page.evaluate(() =>
      Boolean(document.activeElement?.closest('.q-dialog'))
    )
    check(inside, 'filter ponsel: fokus pindah ke dalam lembar')
    await page.click('.sheet label.opt:nth-of-type(3)').catch(() => {})
    await page.evaluate(() =>
      [...document.querySelectorAll('.sheet label.opt')]
        .find(l => /Dicabut/.test(l.textContent))
        ?.click()
    )
    await page.waitForFunction(
      () =>
        /Tampilkan \d+ hasil/.test(
          document.querySelector('.sheet footer .btn-primary')?.textContent ??
            ''
        ),
      { timeout: 6000 }
    )
    const label = await text(page, '.sheet footer .btn-primary')
    check(
      /Tampilkan 3 hasil|Tampilkan \d+ hasil/.test(label),
      'filter ponsel: tombol menampilkan jumlah hasil untuk draf',
      label
    )
    await page.click('.sheet footer .btn-primary')
    await page.waitForFunction(
      () => location.search.includes('status=dicabut'),
      { timeout: 6000 }
    )
    await page.waitForSelector('.active .chip', { timeout: 6000 })
    const chips = await page.$$eval('.active .chip', e =>
      e.map(x => x.getAttribute('aria-label'))
    )
    check(
      chips.some(c => /Dicabut/.test(c)),
      'filter ponsel: chip filter aktif muncul dengan label aksesibel',
      chips.join(' | ')
    )
    const statuses = await page.$$eval('.doc .status', e => [
      ...new Set(e.map(x => x.textContent.trim()))
    ])
    check(
      statuses.length > 0 && statuses.every(s => s === 'Dicabut'),
      'filter ponsel: semua hasil berstatus Dicabut',
      statuses.join(',')
    )
    await page.waitForSelector('.q-dialog', { hidden: true, timeout: 5000 })
    // Hapus satu chip lalu semua
    await page.click('.active .chip')
    await page.waitForFunction(
      () => !location.search.includes('status=dicabut'),
      { timeout: 6000 }
    )
    check(true, 'filter ponsel: chip dapat dihapus')
    await page.close()
  })

  // ---------- Filter: panel (desktop), pager, urutan ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/dokumen')
    const total = await text(page, '.sumrow p')
    check(
      /dari 128 dokumen/.test(total),
      'daftar: ringkasan jumlah benar (128 peraturan)',
      total
    )
    await page.evaluate(() =>
      [...document.querySelectorAll('.filters label.opt')]
        .find(l => l.textContent.trim().startsWith('Berlaku'))
        ?.click()
    )
    await page.select('.filters select', 'perda')
    await page.click('.filters .fa .btn-primary')
    await page.waitForFunction(
      () =>
        location.search.includes('jenis=perda') &&
        location.search.includes('status=berlaku'),
      { timeout: 6000 }
    )
    await page.waitForSelector('.doc', { timeout: 6000 })
    const t2 = await text(page, '.sumrow p')
    check(
      /dari 38 dokumen/.test(t2),
      'daftar: Perda berlaku = 38 (cocok mockup)',
      t2
    )
    await page.click('.pager a[aria-label="Halaman berikutnya"]')
    await page.waitForFunction(() => location.search.includes('page=2'), {
      timeout: 6000
    })
    const cur = await text(page, '.pager a[aria-current="page"]')
    check(cur === '2', 'pager: halaman 2 aktif (aria-current)', String(cur))
    await page.select('.sumrow select', 'nomor')
    await page.waitForFunction(
      () =>
        location.search.includes('sort=nomor') &&
        !location.search.includes('page=2'),
      { timeout: 6000 }
    )
    check(true, 'urutan: mengganti urutan kembali ke halaman 1')
    // Parameter berbahaya diabaikan
    await go(
      page,
      '/dokumen?q=%3Cscript%3Ealert(1)%3C/script%3E&jenis=perda;drop&page=-3&tipe=rahasia'
    )
    const stillOk = await page.$('.docs.list, .empty')
    check(
      Boolean(stillOk),
      'validasi: parameter berbahaya tidak merusak halaman'
    )
    await page.close()
  })

  // ---------- Tema, ukuran teks, penyimpanan ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    const before = await page.evaluate(
      () => document.documentElement.dataset.theme
    )
    await page.click('.theme-toggle')
    const after = await page.evaluate(
      () => document.documentElement.dataset.theme
    )
    check(
      before === 'light' && after === 'dark',
      'tema: tombol header beralih terang -> gelap',
      `${before} -> ${after}`
    )
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main')
    check(
      (await page.evaluate(() => document.documentElement.dataset.theme)) ===
        'dark',
      'tema: pilihan bertahan setelah muat ulang'
    )
    await go(page, '/info')
    await page.evaluate(() =>
      [...document.querySelectorAll('.seg button')]
        .find(b => b.textContent.trim() === 'Sangat besar')
        ?.click()
    )
    check(
      (await page.evaluate(() => document.documentElement.dataset.text)) ===
        'xlarge',
      'teks: ukuran "Sangat besar" diterapkan'
    )
    const fs = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize
    )
    check(fs === '20px', 'teks: ukuran dasar menjadi 125% (20px)', fs)
    await auditPage(page, 'info/desktop/teks-125%')
    await page.close()
  })

  // ---------- Slider hero ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    const pp = '.hero .pp'
    check(
      (await page.$eval(pp, b => b.getAttribute('aria-label'))) ===
        'Jeda pergantian foto latar',
      'slider: tombol jeda berlabel Jeda'
    )
    await page.click(pp)
    check(
      (await page.$eval(pp, b => b.getAttribute('aria-label'))) ===
        'Putar pergantian foto latar',
      'slider: setelah klik berlabel Putar'
    )
    await page.click('.hero-arrow.next')
    const cur = await page.$$eval('.hero .dots button', b =>
      b.map(x => x.getAttribute('aria-current'))
    )
    check(
      cur.join() === 'false,true,false',
      'slider: panah berikutnya memilih foto 2',
      cur.join()
    )
    const hidden = await page.$eval('.hero-slides', el =>
      el.getAttribute('aria-hidden')
    )
    check(
      hidden === 'true',
      'slider: foto latar disembunyikan dari pembaca layar'
    )
    await page.close()
  })

  // ---------- Keyboard dan fokus ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    await page.keyboard.press('Tab')
    const first = await page.evaluate(() =>
      document.activeElement?.textContent?.trim()
    )
    check(
      first === 'Lewati ke konten utama',
      'papan ketik: Tab pertama = tautan lewati',
      String(first)
    )
    await page.keyboard.press('Enter')
    const focusH1 = await page.evaluate(() => document.activeElement?.tagName)
    check(
      focusH1 === 'H1',
      'papan ketik: tautan lewati memindahkan fokus ke judul halaman',
      String(focusH1)
    )
    // Fokus terlihat (kontras indikator)
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(
      () => getComputedStyle(document.activeElement).outlineStyle
    )
    check(
      outline !== 'none',
      'papan ketik: elemen fokus punya indikator terlihat',
      outline
    )
    // Navigasi rute memindahkan fokus ke <h1>
    await page.click('.mainnav a[href="/statistik"]')
    await page.waitForSelector('.kpis', { timeout: 8000 })
    const f2 = await page.evaluate(() => document.activeElement?.tagName)
    check(
      f2 === 'H1',
      'papan ketik: pindah rute memusatkan fokus ke <h1>',
      String(f2)
    )
    await page.close()
  })

  // ---------- Keamanan: halaman uji sanitasi dan 404 ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/tentang/uji-sanitasi')
    await page.waitForSelector('.safe-html', { timeout: 8000 })
    const danger = await page.$eval('.safe-html', el => ({
      script: el.querySelectorAll('script,iframe,svg,img,object,embed,form')
        .length,
      handlers: [...el.querySelectorAll('*')].some(n =>
        [...n.attributes].some(a => /^on/i.test(a.name))
      ),
      js: [...el.querySelectorAll('a')].some(a =>
        /^javascript:/i.test(a.getAttribute('href') ?? '')
      ),
      xss: window.__xss
    }))
    check(
      danger.script === 0 && !danger.handlers && !danger.js && !danger.xss,
      'XSS: isi halaman dari backend dibersihkan dan tidak menjalankan kode',
      JSON.stringify(danger)
    )
    const links = await page.$$eval('.safe-html a[target=_blank]', a =>
      a.map(x => x.rel)
    )
    check(
      links.every(r => r.includes('noopener') && r.includes('noreferrer')),
      'XSS: tautan luar memakai rel noopener noreferrer',
      links.join('|')
    )
    await go(page, '/dokumen/abc')
    check(
      (await text(page, 'h1')) === 'Halaman tidak ditemukan',
      'rute: ID dokumen tidak valid jatuh ke 404'
    )
    await go(page, '/dokumen/99999')
    const e404 = await text(page, '.empty h3, .empty h1, .empty h2')
    check(
      /Tidak ditemukan/.test(String(e404)),
      'rute: dokumen yang tidak ada menampilkan keadaan "Tidak ditemukan"',
      String(e404)
    )
    await page.close()
  })

  // ---------- Galat dan offline ----------
  await section(async () => {
    const page = await openPage(DESKTOP)
    await page.setRequestInterception(true)
    let block = true
    page.on('request', r => {
      if (block && r.url().includes('/api/v1/ringkasan')) {
        return r.respond({
          status: 503,
          contentType: 'application/problem+json',
          headers: { 'x-request-id': 'TEST-0001' },
          body: '{"title":"x","status":503}'
        })
      }
      if (block && r.url().includes('mediacenter.singkawangkota.go.id'))
        return r.abort('failed')
      return r.continue()
    })
    await go(page, '/')
    await page.waitForSelector('.empty .btn-primary', { timeout: 8000 })
    const err = await page.$$eval('.empty h3', e =>
      e.map(x => x.textContent.trim())
    )
    check(
      err.length >= 2,
      'galat: tiap bagian menampilkan keadaan galat sendiri',
      err.join(' | ')
    )
    const reqId = await text(page, '.request-id')
    check(
      reqId && reqId.includes('TEST-0001'),
      'galat: ID permintaan dari server ditampilkan',
      String(reqId)
    )
    await auditPage(page, 'beranda-galat/desktop')
    block = false
    await page.click('.empty .btn-primary')
    await page.waitForSelector('.colls', { timeout: 8000 })
    check(true, 'galat: tombol "Coba lagi" memulihkan bagian yang gagal')
    await page.setOfflineMode(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForSelector('.banner.off', { timeout: 5000 })
    check(true, 'offline: spanduk "Tidak ada koneksi internet" muncul')
    await page.setOfflineMode(false)
    await page.close()
  })

  // ---------- Gerak dikurangi ----------
  await section(async () => {
    const page = await browser.newPage()
    await page.setViewport(DESKTOP)
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' }
    ])
    await go(page, '/')
    const label = await page.$eval('.hero .pp', b =>
      b.getAttribute('aria-label')
    )
    check(
      label === 'Putar pergantian foto latar',
      'gerak dikurangi: slider tidak berjalan sendiri (mulai terjeda)',
      label
    )
    await page.close()
  })
} finally {
  await browser.close()
}

function document_title_ok(t) {
  return /Perda 7\/2019/.test(t) && /JDIH DPRD Kota Singkawang/.test(t)
}

const failed = results.filter(r => !r.ok)
for (const r of results)
  console.log(
    `${r.ok ? 'LULUS' : 'GAGAL'}  ${r.name}${r.ok || !r.detail ? '' : `\n         -> ${r.detail}`}`
  )
console.log(
  `\n${results.length - failed.length}/${results.length} lulus${failed.length ? `, ${failed.length} gagal` : ''}`
)
process.exit(failed.length ? 1 : 0)
