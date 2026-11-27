// Uji ujung-ke-ujung fitur tambahan: menu Profil dan kebijakan, widget aksesibilitas,
// tombol WhatsApp dan Asisten (kanan bawah), dan pratinjau PDF.
//
// Pemakaian (server dev dengan API palsu, lihat check.mjs):
//   JDIH_WHATSAPP=6281234567890 JDIH_ASISTEN_URL=/asisten/chat npm run dev
//   FITUR_WHATSAPP=6281234567890 FITUR_ASISTEN=1 BASE_URL=http://localhost:9000 npm run test:e2e:fitur
// Keadaan "Asisten dan WhatsApp kosong" (tanpa variabel di atas):
//   FITUR_WHATSAPP= FITUR_ASISTEN=0 BASE_URL=http://localhost:9000 npm run test:e2e:fitur
//
// Berkas lampiran dicegat dan dikembalikan lewat Node: Chrome headless menjawab 204 untuk
// fetch berkas berkepala attachment dari server dev, jadi jalur klien diuji dengan
// isi PDF yang sama dari API palsu.
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BASE = process.env.BASE_URL ?? 'http://localhost:9000'
const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
const WA = process.env.FITUR_WHATSAPP ?? ''
const ASISTEN = process.env.FITUR_ASISTEN === '1'
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8'
)

const PHONE = {
  width: 360,
  height: 800,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true
}
const TABLET = {
  width: 768,
  height: 1024,
  deviceScaleFactor: 1,
  hasTouch: true
}
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 }
const DOC_ID = process.env.DOC_ID ?? '117'

const results = []
const pass = (name, detail = '') => results.push({ ok: true, name, detail })
const fail = (name, detail = '') => results.push({ ok: false, name, detail })
const check = (cond, name, detail = '') =>
  cond ? pass(name) : fail(name, detail)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', ...JSON.parse(process.env.CHROME_ARGS ?? '[]')]
})

let sectionNo = 0
async function section(titulo, fn) {
  sectionNo += 1
  try {
    await fn()
  } catch (err) {
    fail(`bagian "${titulo}" terhenti`, String(err.message).split('\n')[0])
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Permintaan yang dicegat diambil lewat Node. Di balik nginx uji (host produksi dipetakan oleh Chrome,
// bukan oleh DNS), LAMPIRAN_UPSTREAM=http://127.0.0.1:3000 mengganti origin ke API lokal.
const keAsal = u =>
  process.env.LAMPIRAN_UPSTREAM
    ? process.env.LAMPIRAN_UPSTREAM + new URL(u).pathname + new URL(u).search
    : u

async function openPage(viewport, { scheme = 'light', touch } = {}) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme }
  ])
  page.log = { pageErrors: [], console: [], asisten: 0, lampiran: 0 }
  page.on('pageerror', e => page.log.pageErrors.push(String(e.message)))
  page.on('console', m => {
    if (m.type() === 'error') page.log.console.push(m.text())
  })
  await page.evaluateOnNewDocument(() => {
    window.__csp = []
    document.addEventListener('securitypolicyviolation', e =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    )
  })
  void touch
  return page
}

// Pencegat: lampiran (PDF) dan POST Asisten. `opsi` dapat diubah selama uji.
async function pasangPencegat(page, opsi = {}) {
  page.opsi = { lampiran: 'ok', asisten: null, detail: null, ...opsi }
  await page.setRequestInterception(true)
  page.on('request', async req => {
    const u = req.url()
    try {
      if (u.includes('/lampiran/')) {
        page.log.lampiran += 1
        const mode = page.opsi.lampiran
        if (mode === 'ok') {
          const r = await fetch(keAsal(u))
          return await req.respond({
            status: 200,
            contentType: 'application/pdf',
            body: Buffer.from(await r.arrayBuffer())
          })
        }
        if (mode === 'galat') {
          return await req.respond({
            status: 503,
            contentType: 'application/json',
            body: '{}'
          })
        }
        if (mode === 'alih') {
          return await req.respond({
            status: 302,
            headers: { location: 'https://situs-lain.example/berkas.pdf' }
          })
        }
        return await req.continue()
      }
      if (u.includes('/asisten/')) {
        page.log.asisten += 1
        if (page.opsi.asisten && req.method() === 'POST') {
          return await req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(page.opsi.asisten)
          })
        }
        return await req.continue()
      }
      if (page.opsi.detail && /\/api\/v1\/dokumen\/\d+$/.test(u)) {
        const r = await fetch(keAsal(u))
        const json = await r.json()
        return await req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(page.opsi.detail(json))
        })
      }
      return await req.continue()
    } catch {
      try {
        await req.abort()
      } catch {
        // permintaan sudah ditangani
      }
    }
  })
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#main', { timeout: 15000 })
  await page
    .waitForNetworkIdle({ idleTime: 600, timeout: 20000 })
    .catch(() => {})
}

const vis = (page, sel) =>
  page.evaluate(s => {
    const el = document.querySelector(s)
    if (!el) return false
    const st = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return (
      st.display !== 'none' &&
      st.visibility !== 'hidden' &&
      r.width > 0 &&
      r.height > 0
    )
  }, sel)

const rect = (page, sel) =>
  page.evaluate(s => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }
  }, sel)

const text = (page, sel) =>
  page
    .$eval(sel, el => el.textContent.replace(/\s+/g, ' ').trim())
    .catch(() => null)

const ultimaBot = page =>
  page.$$eval('.msg.bot', els =>
    (els[els.length - 1]?.textContent ?? '').replace(/\s+/g, ' ').trim()
  )

const active = page =>
  page.evaluate(() => {
    const a = document.activeElement
    return a ? `${a.tagName}#${a.id}.${a.className}`.replace(/\s+/g, ' ') : null
  })

const hasHtmlAttr = (page, name) =>
  page.evaluate(n => document.documentElement.hasAttribute(n), name)

const storage = page =>
  page.evaluate(() => {
    const o = {}
    for (const k of Object.keys(localStorage)) o[k] = localStorage.getItem(k)
    return o
  })

const intersects = (a, b) =>
  a && b && a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y

async function axe(page, label) {
  // Menyuntikkan axe-core (berkas lokal dari node_modules, bukan masukan pengguna) ke halaman
  // uji, seperti di check.mjs. Hanya di alat uji; kode aplikasi tidak memakai eval atau injeksi skrip.
  await page.evaluate(axeSource)
  const res = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
      }
    })
  )
  const v = res.violations.map(
    x => `${x.id}(${x.nodes.length}): ${x.nodes[0].target.join(' ')}`
  )
  check(
    v.length === 0,
    `${label}: axe WCAG 2.2 AA tanpa pelanggaran`,
    v.join(' ; ')
  )
}

async function sehat(page, label) {
  const csp = await page.evaluate(() => window.__csp)
  check(csp.length === 0, `${label}: tanpa pelanggaran CSP`, csp.join(' | '))
  check(
    page.log.pageErrors.length === 0,
    `${label}: tanpa galat JavaScript`,
    page.log.pageErrors.join(' | ')
  )
  const luapan = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth
  )
  check(luapan <= 0, `${label}: tanpa luapan horizontal`, `${luapan}px`)
}

try {
  // ---------- Menu Profil, halaman Profil, dan kebijakan ----------
  await section('profil: navigasi desktop', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/tentang/dasar-hukum')
    check(
      new URL(page.url()).pathname === '/profil/dasar-hukum',
      'profil: tautan lama /tentang/dasar-hukum dialihkan ke /profil/dasar-hukum',
      page.url()
    )
    const nav = await page.$$eval('.mainnav a', a =>
      a.map(x => x.textContent.trim())
    )
    check(
      nav.join('|') ===
        'Beranda|Profil|Dokumen|Pembentukan PUU|Berita|Statistik',
      'profil: urutan menu header Beranda, Profil, Dokumen, ...',
      nav.join('|')
    )
    for (const path of [
      '/profil',
      '/profil/dasar-hukum',
      '/kebijakan-privasi',
      '/kebijakan-cookie',
      '/info'
    ]) {
      await go(page, path)
      const cur = await page.$$eval('.mainnav a[aria-current=page]', a =>
        a.map(x => x.textContent.trim())
      )
      check(
        cur.join() === 'Profil',
        `profil: menu Profil aktif di ${path}`,
        cur.join()
      )
    }
    await go(page, '/kebijakan-cookie')
    const grup = await page.$$eval('.sidenav .grp', g =>
      g.map(x => x.textContent.trim())
    )
    check(
      grup.includes('Kebijakan'),
      'profil: menu samping memuat grup Kebijakan',
      grup.join('|')
    )
    const cur = await page.$$eval('.sidenav a[aria-current=page]', a =>
      a.map(x => x.textContent.trim())
    )
    check(
      cur.join() === 'Cookie',
      'profil: Cookie ditandai aktif di menu samping',
      cur.join()
    )
    await page.close()
  })

  await section('profil: ponsel', async () => {
    const page = await openPage(PHONE)
    await go(page, '/info')
    const tabs = await page.$$eval('.appnav a', a =>
      a.map(x => `${x.textContent.trim()}=${x.getAttribute('href')}`)
    )
    check(
      tabs.join('|') ===
        'Beranda=/|Profil=/info|Dokumen=/dokumen|Berita=/berita|Statistik=/statistik',
      'profil: tab bawah Beranda, Profil (/info), Dokumen, Berita, Statistik',
      tabs.join('|')
    )
    for (const path of [
      '/info',
      '/kebijakan-privasi',
      '/kebijakan-cookie',
      '/profil/dasar-hukum'
    ]) {
      await go(page, path)
      const cur = await page.$$eval('.appnav a[aria-current=page]', a =>
        a.map(x => x.textContent.trim())
      )
      check(
        cur.join() === 'Profil',
        `profil: tab Profil aktif di ${path}`,
        cur.join()
      )
    }
    await go(page, '/info')
    const grup = await page.$$eval('#main .group-h', g =>
      g.map(x => x.textContent.trim())
    )
    check(
      grup.join('|') ===
        'Profil instansi|Kebijakan|Notifikasi|Tampilan|Tautan terkait',
      'profil: hub memuat grup Profil instansi, Kebijakan, Notifikasi, Tampilan, Tautan terkait',
      grup.join('|')
    )
    await page.click('a.srow[href="/kebijakan-privasi"]')
    await page.waitForFunction(
      () => location.pathname === '/kebijakan-privasi',
      { timeout: 5000 }
    )
    check(
      (await text(page, 'h1')) === 'Kebijakan Privasi',
      'profil: baris Privasi di hub membuka Kebijakan Privasi'
    )
    await page.close()
  })

  await section('kebijakan: isi dan daftar isi', async () => {
    for (const vp of [DESKTOP, PHONE]) {
      const nama = vp === DESKTOP ? 'desktop' : 'ponsel'
      const page = await openPage(vp)
      await go(page, '/kebijakan-privasi')
      check(
        (await page.$('.badge.sample')) !== null,
        `kebijakan/${nama}: berlabel "Naskah contoh" selama isian instansi belum diisi`
      )
      const fill = await page.$$eval('.fill', f => f.length)
      check(
        fill >= 4,
        `kebijakan/${nama}: isian instansi yang kosong bertanda [diisi instansi]`,
        `n=${fill}`
      )
      const isi = await page.$eval('.policy', el =>
        el.textContent.replace(/\s+/g, ' ')
      )
      check(
        /Asisten AI\./.test(isi) === ASISTEN,
        `kebijakan/${nama}: butir Asisten AI hanya terbit bila Asisten aktif (${ASISTEN})`
      )
      check(
        /WhatsApp\./.test(isi.replace(/Tombol WhatsApp membuka/g, '')) ===
          (WA !== ''),
        `kebijakan/${nama}: butir WhatsApp hanya terbit bila nomor diisi (${WA !== ''})`
      )
      // Daftar isi: bentuk sesuai lebar (di dalam naskah < 1280 px, di samping >= 1280 px).
      const sel =
        vp === DESKTOP ? '.toc-side a[href="#s4"]' : '.toc-inline summary'
      // Elemen dibawa ke tengah layar dulu: di ponsel tab bawah (fixed) bisa menutupi elemen
      // yang "terlihat" di dekat tepi bawah, dan klik tengah akan mengenai tab itu.
      const klik = async s => {
        await page.$eval(s, el => el.scrollIntoView({ block: 'center' }))
        await page.click(s)
      }
      if (vp === PHONE) await klik(sel)
      await klik(vp === DESKTOP ? sel : '.toc-inline a[href="#s4"]')
      await page.waitForFunction(() => location.hash === '#s4', {
        timeout: 4000
      })
      await sleep(500)
      const foc = await page.evaluate(() => document.activeElement?.id)
      check(
        foc === 's4',
        `kebijakan/${nama}: daftar isi menuju bagian dan memindahkan fokus ke judulnya`,
        String(foc)
      )
      await sehat(page, `kebijakan/${nama}`)
      await page.close()
    }
  })

  await section('kebijakan cookie: hapus data tersimpan', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/kebijakan-cookie')
    const baris = await page.$$eval('.tbl tbody tr th code', c =>
      c.map(x => x.textContent.trim())
    )
    check(
      baris.join('|') === 'jdih:tampilan|jdih:aksesibilitas|jdih:notifikasi',
      'cookie: tabel memuat ketiga entri penyimpanan lokal',
      baris.join('|')
    )
    await page.evaluate(() => {
      localStorage.setItem(
        'jdih:tampilan',
        JSON.stringify({ theme: 'dark', text: 'large' })
      )
      localStorage.setItem('jdih:aksesibilitas', JSON.stringify({ gray: true }))
      localStorage.setItem(
        'jdih:notifikasi',
        JSON.stringify({ aktif: true, jenis: ['perda'] })
      )
      localStorage.setItem('situs-lain:kunci', 'tetap')
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main')
    check(
      await hasHtmlAttr(page, 'data-a11y-gray'),
      'cookie: pilihan tersimpan diterapkan saat muat'
    )
    await page.click('.manage button')
    await sleep(500)
    const s = await storage(page)
    check(
      !('jdih:tampilan' in s) &&
        !('jdih:aksesibilitas' in s) &&
        !('jdih:notifikasi' in s),
      'cookie: Hapus data tersimpan menghapus ketiga entri',
      JSON.stringify(s)
    )
    check(
      s['situs-lain:kunci'] === 'tetap',
      'cookie: kunci milik pihak lain tidak disentuh'
    )
    check(
      !(await hasHtmlAttr(page, 'data-a11y-gray')),
      'cookie: efek aksesibilitas langsung hilang'
    )
    check(
      (await page.evaluate(() => document.documentElement.dataset.text)) ===
        'normal',
      'cookie: ukuran teks kembali normal'
    )
    check(
      /dihapus/.test(String(await text(page, '.toast'))),
      'cookie: ada pesan konfirmasi (snackbar)'
    )
    await page.close()
  })

  await section('footer: tautan hukum dan pengaturan tampilan', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    const legal = await page.$$eval('.footer .legal nav a', a =>
      a.map(x => `${x.textContent.trim()}=${x.getAttribute('href')}`)
    )
    check(
      legal.join('|') ===
        'Kebijakan Privasi=/kebijakan-privasi|Kebijakan Cookie=/kebijakan-cookie',
      'footer: bilah hukum menautkan kedua kebijakan',
      legal.join('|')
    )
    const kolom = await page.$$eval('.footer h2', h =>
      h.map(x => x.textContent.trim())
    )
    check(
      kolom.includes('Profil') && !kolom.includes('Tentang'),
      'footer: kolom Profil menggantikan Tentang',
      kolom.join('|')
    )
    await page.click('.footer .fbtn')
    await sleep(300)
    check(
      await vis(page, '#a11y-panel'),
      'footer: tombol Pengaturan tampilan membuka panel aksesibilitas (>= 1024 px)'
    )
    check(
      (await active(page)).includes('a11y-title'),
      'footer: fokus pindah ke judul panel',
      String(await active(page))
    )
    await page.keyboard.press('Escape')
    await sleep(200)
    check(!(await vis(page, '#a11y-panel')), 'footer: Esc menutup panel')
    check(
      (await active(page)).includes('fbtn'),
      'footer: fokus kembali ke tombol footer',
      String(await active(page))
    )
    await page.close()

    const tab = await openPage(TABLET)
    await go(tab, '/')
    const href = await tab.$$eval('.footer a', a =>
      a
        .filter(x => x.textContent.trim() === 'Pengaturan tampilan')
        .map(x => x.getAttribute('href'))
    )
    check(
      href.join() === '/info#tampilan',
      'footer: di bawah 1024 px menjadi tautan ke Profil > Tampilan',
      href.join()
    )
    await tab.close()
  })

  // ---------- Widget aksesibilitas ----------
  await section('aksesibilitas: panel di desktop', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    check(
      await vis(page, '.a11y-trigger'),
      'a11y: tombol terlihat di >= 1024 px'
    )
    const t = await rect(page, '.a11y-trigger')
    check(
      t.w === 48 && t.h === 48 && t.x === 16,
      'a11y: tombol 48 px di kiri bawah',
      JSON.stringify(t)
    )
    check(!(await vis(page, '#a11y-panel')), 'a11y: panel tertutup saat dimuat')
    check(
      !(await active(page)).includes('a11y'),
      'a11y: tidak ada autofokus saat dimuat'
    )
    check(
      (await page.$eval('.a11y-trigger', b =>
        b.getAttribute('aria-expanded')
      )) === 'false',
      'a11y: aria-expanded false saat tertutup'
    )
    await page.click('.a11y-trigger')
    await sleep(250)
    check(await vis(page, '#a11y-panel'), 'a11y: klik membuka panel')
    check(
      (await active(page)).includes('a11y-title'),
      'a11y: fokus ke judul panel saat dibuka',
      String(await active(page))
    )
    check(
      (await page.$eval('.a11y-trigger', b =>
        b.getAttribute('aria-expanded')
      )) === 'true',
      'a11y: aria-expanded true saat terbuka'
    )
    await page.keyboard.press('Escape')
    await sleep(200)
    check(!(await vis(page, '#a11y-panel')), 'a11y: Esc menutup panel')
    check(
      (await active(page)).includes('a11y-trigger'),
      'a11y: fokus kembali ke tombol',
      String(await active(page))
    )

    // Sakelar: atribut di <html>, penyimpanan, dan efek.
    await page.click('.a11y-trigger')
    const tile = label =>
      page.evaluate(l => {
        const b = [...document.querySelectorAll('.a11y-tile')].find(
          x => x.textContent.trim() === l
        )
        b?.click()
        return b?.getAttribute('aria-pressed')
      }, label)
    await tile('Kontras tinggi')
    await tile('Jarak teks lebih lega')
    await tile('Garis bawah dan sorot tautan')
    await tile('Skala abu-abu')
    await tile('Hentikan animasi')
    await sleep(300)
    for (const [attr, nilai] of [
      ['a11yContrast', 'high'],
      ['a11yMotion', 'off']
    ]) {
      check(
        (await page.evaluate(
          a => document.documentElement.dataset[a],
          attr
        )) === nilai,
        `a11y: atribut ${attr}=${nilai} terpasang`
      )
    }
    for (const attr of [
      'data-a11y-spacing',
      'data-a11y-links',
      'data-a11y-gray'
    ]) {
      check(await hasHtmlAttr(page, attr), `a11y: atribut ${attr} terpasang`)
    }
    const st = JSON.parse((await storage(page))['jdih:aksesibilitas'] ?? '{}')
    check(
      st.contrast === true &&
        st.spacing === true &&
        st.links === true &&
        st.gray === true &&
        st.motion === true &&
        st.cursor === false,
      'a11y: pilihan tersimpan di jdih:aksesibilitas',
      JSON.stringify(st)
    )
    check(
      (await text(page, '.a11y [role=status]')).includes('Hentikan animasi'),
      'a11y: perubahan diumumkan lewat wilayah aria-live',
      String(await text(page, '.a11y [role=status]'))
    )
    const hero = await page.$eval('.hero .pp', b =>
      b.getAttribute('aria-label')
    )
    check(
      hero === 'Putar pergantian foto latar',
      'a11y: Hentikan animasi menghentikan slider hero',
      hero
    )
    check(
      (await page.evaluate(
        () => getComputedStyle(document.documentElement).filter
      )) === 'grayscale(1)',
      'a11y: skala abu-abu menerapkan filter pada <html>'
    )
    await axe(page, 'a11y/desktop semua pilihan aktif, panel terbuka')
    await sehat(page, 'a11y/desktop')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#main')
    check(
      await hasHtmlAttr(page, 'data-a11y-gray'),
      'a11y: pilihan bertahan setelah muat ulang'
    )

    // Fokus yang keluar menutup panel tanpa merebut fokus.
    await page.click('.a11y-trigger')
    await sleep(200)
    await page.evaluate(() => document.querySelector('a.skip').focus())
    await sleep(200)
    check(!(await vis(page, '#a11y-panel')), 'a11y: fokus keluar menutup panel')
    check(
      (await active(page)).includes('skip'),
      'a11y: fokus tidak direbut kembali',
      String(await active(page))
    )

    // Atur ulang.
    await page.click('.a11y-trigger')
    await sleep(200)
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.a11y button')].find(x =>
        x.textContent.includes('Atur ulang')
      )
      b.click()
    })
    await sleep(300)
    check(
      !(await hasHtmlAttr(page, 'data-a11y-contrast')) &&
        !(await hasHtmlAttr(page, 'data-a11y-gray')),
      'a11y: Atur ulang melepas semua efek'
    )
    const st2 = JSON.parse((await storage(page))['jdih:aksesibilitas'] ?? '{}')
    check(
      Object.values(st2).every(v => v === false),
      'a11y: Atur ulang menyimpan semua pilihan mati',
      JSON.stringify(st2)
    )
    const link = await page.$eval('.a11y-note a', a => a.getAttribute('href'))
    check(
      link === '/kebijakan-cookie',
      'a11y: catatan penyimpanan menaut ke Kebijakan Cookie',
      link
    )
    await page.close()
  })

  await section('aksesibilitas: tema dan ukuran teks satu sumber', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    await page.click('.a11y-trigger')
    await sleep(200)
    await page.evaluate(() => {
      const klik = l =>
        [...document.querySelectorAll('.a11y .seg button')]
          .find(x => x.textContent.trim() === l)
          .click()
      klik('Gelap')
      klik('Besar')
    })
    await sleep(300)
    const dari = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      text: document.documentElement.dataset.text
    }))
    check(
      dari.theme === 'dark' && dari.text === 'large',
      'a11y: tema dan ukuran teks dari panel diterapkan',
      JSON.stringify(dari)
    )
    const tampil = JSON.parse((await storage(page))['jdih:tampilan'])
    check(
      tampil.theme === 'dark' && tampil.text === 'large',
      'a11y: tema dan ukuran teks tetap di jdih:tampilan',
      JSON.stringify(tampil)
    )
    // Tombol tema di header memakai sumber yang sama.
    await page.keyboard.press('Escape')
    await page.click('.theme-toggle')
    await sleep(200)
    check(
      (await page.evaluate(() => document.documentElement.dataset.theme)) ===
        'light',
      'a11y: tombol tema di header memakai sumber yang sama'
    )
    await page.close()
  })

  await section(
    'aksesibilitas: di bawah 1024 px (Profil > Tampilan)',
    async () => {
      const tab = await openPage(TABLET)
      await go(tab, '/')
      check(
        !(await vis(tab, '.a11y-trigger')),
        'a11y: tombol melayang tidak ada di tablet'
      )
      await go(tab, '/info')
      const baris = await tab.$$eval('.srow-sw', r =>
        r
          .filter(x => x.getBoundingClientRect().height > 0)
          .map(x => x.textContent.trim())
      )
      check(
        baris.length === 5 || baris.length === 6,
        'a11y: baris sakelar tampil di Profil > Tampilan',
        baris.join('|')
      )
      const tinggi = await tab.$$eval('.srow-sw', r =>
        r.map(x => x.getBoundingClientRect().height)
      )
      check(
        tinggi.every(h => h === 0 || h >= 56),
        'a11y: tiap baris sakelar >= 56 px',
        tinggi.join()
      )
      await tab.evaluate(() => {
        const b = [...document.querySelectorAll('.srow-sw')].find(x =>
          x.textContent.includes('Kontras tinggi')
        )
        b.click()
      })
      await sleep(300)
      check(
        await hasHtmlAttr(tab, 'data-a11y-contrast'),
        'a11y: sakelar di Profil menerapkan kontras tinggi'
      )
      const aria = await tab.$$eval('.srow-sw', r =>
        r
          .find(x => x.textContent.includes('Kontras tinggi'))
          .getAttribute('aria-checked')
      )
      check(aria === 'true', 'a11y: sakelar berstatus aria-checked true', aria)
      check(
        !(await vis(tab, '.srow-open')),
        'a11y: baris pembuka panel tersembunyi di tablet'
      )
      await axe(tab, 'a11y/tablet Profil > Tampilan')
      await tab.close()

      const dsk = await openPage(DESKTOP)
      await go(dsk, '/info')
      check(
        await vis(dsk, '.srow-open'),
        'a11y: desktop menampilkan satu baris "Aksesibilitas dan tampilan"'
      )
      check(
        (await dsk.$$eval(
          '.srow-sw',
          r => r.filter(x => x.getBoundingClientRect().height > 0).length
        )) === 0,
        'a11y: desktop tidak menduplikasi sakelar'
      )
      await dsk.click('.srow-open')
      await sleep(250)
      check(await vis(dsk, '#a11y-panel'), 'a11y: baris pembuka membuka panel')
      await dsk.keyboard.press('Escape')
      await sleep(200)
      check(
        (await active(dsk)).includes('srow-open'),
        'a11y: Esc mengembalikan fokus ke baris pembuka',
        String(await active(dsk))
      )
      await dsk.close()

      const hp = await openPage(PHONE)
      await go(hp, '/')
      check(
        !(await vis(hp, '.a11y-trigger')),
        'a11y: tombol melayang tidak ada di ponsel'
      )
      await hp.close()
    }
  )

  // ---------- Tombol kanan bawah ----------
  await section('kanan bawah: keadaan konfigurasi', async () => {
    const page = await openPage(DESKTOP)
    await go(page, '/')
    const ada = (await page.$('.fabs')) !== null
    check(
      ada === (ASISTEN || WA !== ''),
      `kanan bawah: widget dirender hanya bila ada fitur aktif (${ASISTEN}, ${WA !== ''})`
    )
    check(
      ((await page.$('#chat-panel')) !== null) === ASISTEN,
      'kanan bawah: panel Asisten hanya dirender bila Asisten aktif'
    )
    check(
      ((await page.$('.fab-wa')) !== null) === (WA !== ''),
      'kanan bawah: tombol WhatsApp hanya dirender bila nomor diisi'
    )
    check(
      ((await page.$('.fab-chat')) !== null) === ASISTEN,
      'kanan bawah: tombol Asisten hanya dirender bila Asisten aktif'
    )
    if (!ASISTEN) {
      check(
        (await page.$('.fab-trigger')) === null,
        'kanan bawah: tanpa Asisten tidak ada pemicu menu'
      )
      check(
        (await page.$('#fab-menu')) === null,
        'kanan bawah: tanpa Asisten tidak ada menu'
      )
    }
    check(
      page.log.asisten === 0,
      'kanan bawah: tidak ada permintaan ke Asisten sebelum dibuka',
      `n=${page.log.asisten}`
    )
    await page.close()
  })

  if (ASISTEN && WA !== '') {
    await section('kanan bawah: desktop dua tombol', async () => {
      const page = await openPage(DESKTOP)
      await go(page, '/')
      check(
        !(await vis(page, '.fab-trigger')),
        'kanan bawah/desktop: pemicu menu tersembunyi'
      )
      const opts = await page.$$eval('.fab-opt', o =>
        o.map(x => {
          const r = x.getBoundingClientRect()
          return {
            c: x.className,
            w: r.width,
            h: r.height,
            r: innerWidth - r.right,
            b: innerHeight - r.bottom,
            y: r.y
          }
        })
      )
      check(
        opts.length === 2 &&
          opts.every(o => o.w === 52 && o.h === 52 && o.r === 16),
        'kanan bawah/desktop: dua tombol bulat 52 px di kanan',
        JSON.stringify(opts)
      )
      check(
        opts[0].c.includes('fab-chat') && opts[0].y < opts[1].y,
        'kanan bawah/desktop: Asisten di atas, WhatsApp di bawah'
      )
      check(
        opts[1].b === 16,
        'kanan bawah/desktop: tombol bawah 16 px dari tepi',
        String(opts[1].b)
      )
      const wa = await page.$eval('.fab-wa', a => ({
        href: a.getAttribute('href'),
        t: a.target,
        rel: a.rel,
        name: a.textContent.replace(/\s+/g, ' ').trim()
      }))
      check(
        wa.href.startsWith(`https://wa.me/${WA}?text=`),
        'kanan bawah: tautan https://wa.me/<nomor>?text=...',
        wa.href
      )
      check(
        wa.t === '_blank' &&
          /noopener/.test(wa.rel) &&
          /noreferrer/.test(wa.rel),
        'kanan bawah: WhatsApp dibuka di tab baru dengan rel aman',
        `${wa.t} ${wa.rel}`
      )
      check(
        /membuka WhatsApp di tab baru/.test(wa.name),
        'kanan bawah: nama aksesibel WhatsApp menyebut tab baru',
        wa.name
      )
      const scripts = await page.$$eval('script[src]', s =>
        s.map(x => x.src).filter(x => /whatsapp|wa\.me|facebook/i.test(x))
      )
      check(
        scripts.length === 0,
        'kanan bawah: tidak ada skrip WhatsApp atau Meta'
      )
      await axe(page, 'kanan bawah/desktop')
      await sehat(page, 'kanan bawah/desktop')
      await page.close()
    })

    await section(
      'kanan bawah: satu tombol dan menu (ponsel, tablet)',
      async () => {
        for (const [nama, vp, rail] of [
          ['ponsel', PHONE, false],
          ['tablet', TABLET, true]
        ]) {
          const page = await openPage(vp)
          await go(page, '/')
          check(
            await vis(page, '.fab-trigger'),
            `menu/${nama}: satu pemicu terlihat`
          )
          const pm = await rect(page, '.fab-trigger')
          check(
            pm.w === 52 && pm.h === 52,
            `menu/${nama}: pemicu 52 px`,
            JSON.stringify(pm)
          )
          check(
            !(await vis(page, '.fab-menu')),
            `menu/${nama}: menu tertutup saat dimuat`
          )
          check(
            !(await active(page)).includes('fab'),
            `menu/${nama}: tidak ada autofokus`
          )
          await page.click('.fab-trigger')
          await sleep(250)
          check(
            (await page.$eval('.fab-trigger', b =>
              b.getAttribute('aria-expanded')
            )) === 'true',
            `menu/${nama}: aria-expanded true saat terbuka`
          )
          const tinggi = await page.$$eval('.fab-opt', o =>
            o.map(x => x.getBoundingClientRect().height)
          )
          check(
            tinggi.length === 2 && tinggi.every(h => h >= 56),
            `menu/${nama}: dua pilihan >= 56 px`,
            tinggi.join()
          )
          const menu = await rect(page, '.fab-menu')
          check(
            menu.x >= 0 &&
              menu.y >= 0 &&
              menu.r <= vp.width &&
              menu.b <= vp.height,
            `menu/${nama}: menu di dalam layar`,
            JSON.stringify(menu)
          )
          const nav = await rect(page, '.appnav')
          check(
            !intersects(menu, nav) &&
              !intersects(await rect(page, '.fab-trigger'), nav),
            `menu/${nama}: tidak menimpa ${rail ? 'rail kiri' : 'tab bawah'}`,
            JSON.stringify({ menu, nav })
          )
          await page.keyboard.press('Escape')
          await sleep(200)
          check(
            !(await vis(page, '.fab-menu')),
            `menu/${nama}: Esc menutup menu`
          )
          check(
            (await active(page)).includes('fab-trigger'),
            `menu/${nama}: fokus kembali ke pemicu`,
            String(await active(page))
          )
          // Klik di luar menutup.
          await page.click('.fab-trigger')
          await sleep(200)
          await page.mouse.click(10, 300)
          await sleep(200)
          check(
            !(await vis(page, '.fab-menu')),
            `menu/${nama}: klik di luar menutup menu`
          )
          // Papan ketik: Enter membuka, panah/Tab ke pilihan.
          await page.focus('.fab-trigger')
          await page.keyboard.press('Enter')
          await sleep(200)
          check(
            await vis(page, '.fab-menu'),
            `menu/${nama}: Enter membuka menu`
          )
          await page.keyboard.press('Tab')
          check(
            (await active(page)).includes('fab-chat'),
            `menu/${nama}: Tab dari pemicu ke pilihan Asisten`,
            String(await active(page))
          )
          // Memilih Asisten membuka panel dan menyembunyikan pemicu.
          await page.keyboard.press('Enter')
          await sleep(300)
          check(
            await vis(page, '#chat-panel'),
            `menu/${nama}: memilih Asisten membuka panel`
          )
          check(
            !(await vis(page, '.fab-menu')),
            `menu/${nama}: menu menutup saat Asisten dipilih`
          )
          check(
            !(await vis(page, '.fab-trigger')),
            `menu/${nama}: pemicu disembunyikan selama panel terbuka`
          )
          check(
            (await active(page)).includes('chat-title'),
            `menu/${nama}: fokus ke judul panel`,
            String(await active(page))
          )
          if (rail) {
            const p = await rect(page, '#chat-panel')
            check(
              p.x >= 80,
              'menu/tablet: panel tidak menimpa rail kiri',
              JSON.stringify(p)
            )
          }
          await page.keyboard.press('Escape')
          await sleep(250)
          check(
            !(await vis(page, '#chat-panel')),
            `menu/${nama}: Esc menutup panel`
          )
          check(
            (await active(page)).includes('fab-trigger'),
            `menu/${nama}: fokus kembali ke pemicu setelah panel`,
            String(await active(page))
          )
          await axe(page, `menu/${nama}`)
          await page.click('.fab-trigger')
          await sleep(250)
          await axe(page, `menu/${nama} terbuka`)
          await sehat(page, `menu/${nama}`)
          await page.close()
        }
      }
    )
  }

  if (WA !== '' && !ASISTEN) {
    await section('kanan bawah: hanya WhatsApp', async () => {
      for (const [nama, vp] of [
        ['desktop', DESKTOP],
        ['ponsel', PHONE],
        ['tablet', TABLET]
      ]) {
        const page = await openPage(vp)
        await go(page, '/')
        const solo = await page.$$eval('.fabs a, .fabs button', e =>
          e.map(x => `${x.tagName}.${x.className}`)
        )
        check(
          solo.length === 1 && solo[0].includes('fab-solo'),
          `wa-saja/${nama}: tepat satu tombol`,
          solo.join('|')
        )
        const r = await rect(page, '.fab-solo')
        check(
          r.w === 52 && r.h === 52,
          `wa-saja/${nama}: bulat 52 px`,
          JSON.stringify(r)
        )
        check(
          (await page.$('.fabs [aria-expanded], .fabs [aria-controls]')) ===
            null,
          `wa-saja/${nama}: tanpa menu dan atribut disclosure`
        )
        const href = await page.$eval('.fab-solo', a => a.getAttribute('href'))
        check(
          href.startsWith(`https://wa.me/${WA}?text=`),
          `wa-saja/${nama}: langsung membuka WhatsApp`,
          href
        )
        await axe(page, `wa-saja/${nama}`)
        await page.close()
      }
    })
  }

  if (ASISTEN && WA === '') {
    await section('kanan bawah: hanya Asisten', async () => {
      for (const [nama, vp] of [
        ['desktop', DESKTOP],
        ['ponsel', PHONE]
      ]) {
        const page = await openPage(vp)
        await go(page, '/')
        const solo = await page.$$eval('.fabs > a, .fabs > button', e =>
          e.map(x => x.className)
        )
        check(
          solo.length === 1 && solo[0].includes('fab-solo'),
          `asisten-saja/${nama}: tepat satu tombol`,
          solo.join('|')
        )
        check(
          (await page.$('.fab-wa')) === null,
          `asisten-saja/${nama}: tanpa WhatsApp`
        )
        await page.click('.fab-solo')
        await sleep(300)
        check(
          await vis(page, '#chat-panel'),
          `asisten-saja/${nama}: tombol langsung membuka panel`
        )
        if (vp === PHONE) {
          check(
            !(await vis(page, '.fab-solo')),
            'asisten-saja/ponsel: tombol disembunyikan selama panel terbuka'
          )
        }
        await page.keyboard.press('Escape')
        await sleep(250)
        check(
          !(await vis(page, '#chat-panel')),
          `asisten-saja/${nama}: Esc menutup panel`
        )
        check(
          (await active(page)).includes('fab-solo'),
          `asisten-saja/${nama}: fokus kembali ke tombol`,
          String(await active(page))
        )
        await axe(page, `asisten-saja/${nama}`)
        await page.close()
      }
    })
  }

  if (ASISTEN) {
    await section('asisten: percakapan', async () => {
      const page = await openPage(DESKTOP)
      await pasangPencegat(page)
      await go(page, '/')
      await page.click('.fab-chat')
      await sleep(300)
      check(
        page.log.asisten === 0,
        'asisten: membuka panel tidak mengirim permintaan',
        `n=${page.log.asisten}`
      )
      check(
        (await page.$$eval('.chips-q .chip', c => c.length)) === 3,
        'asisten: sapaan dengan tiga contoh pertanyaan'
      )
      check(
        /belum bisa membaca isi pasal/.test(
          String(await text(page, '.chat-log'))
        ),
        'asisten: sapaan menyebut lingkup yang jujur'
      )
      await axe(page, 'asisten/awal')

      await page.click('.chips-q .chip')
      await page.waitForSelector('.msg.bot .srcs', { timeout: 6000 })
      const me = await text(page, '.msg.me .bub')
      check(
        /retribusi pasar/i.test(String(me)),
        'asisten: pertanyaan tampil sebagai gelembung pengguna',
        String(me)
      )
      const src = await page.$$eval('.srcs .src', s =>
        s.map(x => ({
          tag: x.tagName,
          href: x.getAttribute('href'),
          t: x.textContent.replace(/\s+/g, ' ').trim()
        }))
      )
      check(src.length === 2, 'asisten: dua kartu sumber', JSON.stringify(src))
      check(
        src[0].tag === 'A' && src[0].href === '/dokumen/117',
        'asisten: sumber dari host sendiri menjadi rute /dokumen/117',
        JSON.stringify(src[0])
      )
      check(
        src[1].tag === 'DIV' && src[1].href === null,
        'asisten: sumber dari situs lain tampil tanpa tautan',
        JSON.stringify(src[1])
      )
      check(
        /Berlaku/.test(src[0].t) && /Dicabut/.test(src[1].t),
        'asisten: status berlaku dan dicabut ditampilkan'
      )
      check(
        (await page.$$eval('.chat-log a[target=_blank]', a => a.length)) === 0,
        'asisten: tidak ada tautan keluar di jawaban'
      )
      check(
        (await page.$('.chips-q')) === null,
        'asisten: contoh pertanyaan hilang setelah percakapan dimulai'
      )
      await axe(page, 'asisten/jawaban')
      // Tautan sumber membuka dokumen di dalam aplikasi.
      await page.click('.srcs a.src')
      await page.waitForFunction(() => location.pathname === '/dokumen/117', {
        timeout: 6000
      })
      check(true, 'asisten: kartu sumber membuka halaman dokumen di aplikasi')
      await sleep(600)
      // Berpindah halaman memindahkan fokus ke judul; fokus yang keluar menutup panel (seperti
      // menu dan widget aksesibilitas), tetapi percakapan bertahan selama halaman tidak dimuat ulang.
      check(
        !(await vis(page, '#chat-panel')),
        'asisten: berpindah halaman memindahkan fokus ke judul dan menutup panel'
      )
      await page.click('.fab-chat')
      await sleep(300)
      check(
        (await page.$$eval('.msg.me', m => m.length)) === 1,
        'asisten: percakapan bertahan setelah panel dibuka kembali'
      )

      // Masukan: batas panjang, Enter, Shift+Enter.
      await page.click('#chat-q')
      await page.type('#chat-q', 'ab')
      await page.keyboard.press('Enter')
      await sleep(200)
      check(
        /minimal 3/.test(String(await text(page, '#chat-err'))),
        'asisten: pertanyaan < 3 karakter ditolak dengan pesan',
        String(await text(page, '#chat-err'))
      )
      check(
        (await page.$eval('#chat-q', t => t.getAttribute('aria-invalid'))) ===
          'true',
        'asisten: kolom ditandai aria-invalid'
      )
      check(
        (await page.$$eval('.msg.me', m => m.length)) === 1,
        'asisten: pertanyaan yang ditolak tidak dikirim'
      )
      await page.type('#chat-q', 'c')
      await page.keyboard.down('Shift')
      await page.keyboard.press('Enter')
      await page.keyboard.up('Shift')
      check(
        (await page.$eval('#chat-q', t => t.value)).includes('\n'),
        'asisten: Shift+Enter membuat baris baru, tidak mengirim'
      )
      check(
        (await text(page, '.chat-count')) === '4/500',
        'asisten: penghitung karakter',
        String(await text(page, '.chat-count'))
      )
      check(
        (await page.$eval('#chat-q', t => t.maxLength)) === 500,
        'asisten: batas 500 karakter pada kolom'
      )
      await page.$eval('#chat-q', t => {
        t.value = ''
        t.dispatchEvent(new Event('input'))
      })
      await page.type('#chat-q', 'kosong sama sekali')
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () =>
          document.querySelectorAll('.msg.bot').length >= 2 &&
          !document.querySelector('.msg.bot[aria-busy=true]'),
        { timeout: 6000 }
      )
      check(
        (await page.$eval('#chat-q', t => t.value)) === '',
        'asisten: kolom dikosongkan setelah terkirim'
      )
      check(
        /Cari di Dokumen/.test(String(await ultimaBot(page))),
        'asisten: tanpa sumber menawarkan "Cari di Dokumen"',
        await ultimaBot(page)
      )

      // Keadaan galat.
      await page.type('#chat-q', 'tes limit')
      await page.keyboard.press('Enter')
      await page.waitForSelector('.chat-banner.warn', { timeout: 6000 })
      check(
        (await page.$eval('.chat-banner', b => b.getAttribute('role'))) ===
          'alert' &&
          /Terlalu banyak pertanyaan/.test(
            String(await text(page, '.chat-banner'))
          ),
        'asisten: 429 menampilkan "Terlalu banyak pertanyaan" (role=alert)'
      )
      await page.type('#chat-q', 'tes galat')
      await page.keyboard.press('Enter')
      await page.waitForSelector('.chat-banner.bad', { timeout: 6000 })
      check(
        (
          await page.$$eval('.chat-banner.bad .acts .btn', b =>
            b.map(x => x.textContent.trim().replace(/\s+/g, ' '))
          )
        )
          .join('|')
          .startsWith(
            WA !== ''
              ? 'Coba lagi|Cari manual|WhatsApp'
              : 'Coba lagi|Cari manual'
          ),
        'asisten: gangguan layanan menawarkan Coba lagi, Cari manual, dan WhatsApp bila nomor diisi'
      )
      const before = await page.$$eval('.msg.me', m => m.length)
      await page.click('.chat-banner.bad .acts button')
      await page.waitForSelector('.chat-banner.bad', { timeout: 6000 })
      check(
        (await page.$$eval('.msg.me', m => m.length)) === before,
        'asisten: Coba lagi tidak menggandakan gelembung pengguna'
      )
      await axe(page, 'asisten/galat')

      // Memuat dan Batal.
      await page.type('#chat-q', 'pertanyaan lambat')
      await page.keyboard.press('Enter')
      await page.waitForSelector('.msg.bot[aria-busy=true]', { timeout: 3000 })
      check(
        await page.$eval('.chat-send', b => b.disabled),
        'asisten: tombol kirim nonaktif saat memuat'
      )
      await page.evaluate(() =>
        [...document.querySelectorAll('.msg.bot button')]
          .find(b => b.textContent.trim() === 'Batal')
          .click()
      )
      await sleep(2300)
      check(
        (await page.$('.msg.bot[aria-busy=true]')) === null,
        'asisten: Batal menghentikan pemuatan'
      )
      check(
        !/lambat/.test(String(await ultimaBot(page))),
        'asisten: jawaban yang dibatalkan tidak muncul'
      )

      // Offline.
      await page.setOfflineMode(true)
      await page.type('#chat-q', 'ada perda pasar')
      await page.keyboard.press('Enter')
      await page.waitForSelector('.chat-banner.warn', { timeout: 6000 })
      check(
        /Tidak ada koneksi/.test(String(await text(page, '.chat-banner.warn'))),
        'asisten: offline menampilkan "Tidak ada koneksi"'
      )
      await page.setOfflineMode(false)

      // Tidak ada riwayat di perangkat.
      // Profil peramban dipakai bersama bagian uji lain: hanya kunci aplikasi (jdih:) yang dinilai.
      const keys = Object.keys(await storage(page)).filter(k =>
        k.startsWith('jdih:')
      )
      check(
        keys.every(k =>
          ['jdih:tampilan', 'jdih:aksesibilitas', 'jdih:notifikasi'].includes(k)
        ),
        'asisten: percakapan tidak disimpan di perangkat',
        keys.join()
      )
      // Hapus percakapan.
      await page.click('[aria-label="Hapus percakapan"]')
      await sleep(200)
      check(
        (await page.$$eval('.chips-q .chip', c => c.length)) === 3 &&
          (await page.$$eval('.msg.me', m => m.length)) === 0,
        'asisten: Hapus percakapan mengembalikan sapaan awal'
      )
      check(
        (await active(page)).includes('chat-title'),
        'asisten: fokus ke judul setelah hapus'
      )
      await sehat(page, 'asisten/desktop')
      await page.close()
    })

    await section('asisten: jawaban tak tepercaya', async () => {
      const page = await openPage(DESKTOP)
      await pasangPencegat(page, {
        asisten: {
          answer:
            '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script> jawaban',
          sources: [
            {
              judul: '<b>x</b>',
              jenis_peraturan: 'Perda',
              nomor_peraturan: '1',
              tahun_terbit: '2020',
              status: 'berlaku',
              url: 'javascript:window.__xss=1'
            },
            {
              judul: 'y',
              jenis_peraturan: 'Perda',
              nomor_peraturan: '2',
              tahun_terbit: '2020',
              url: 'https://evil.test/dokumen/5'
            },
            {
              judul: 'z',
              jenis_peraturan: 'Perda',
              nomor_peraturan: '3',
              tahun_terbit: '2020',
              url: '//evil.test/dokumen/5'
            }
          ]
        }
      })
      await go(page, '/')
      await page.click('.fab-chat')
      await page.type('#chat-q', 'apa saja')
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () =>
          /jawaban/.test(
            document.querySelector('.chat-log')?.textContent ?? ''
          ),
        { timeout: 6000 }
      )
      const hasil = await page.$eval('.chat-log', el => ({
        img: el.querySelectorAll('img,script,iframe,object,embed,svg:not(.i)')
          .length,
        on: [...el.querySelectorAll('*')].some(n =>
          [...n.attributes].some(a => /^on/i.test(a.name))
        ),
        links: [...el.querySelectorAll('a')].map(a => a.getAttribute('href')),
        xss: window.__xss,
        teks:
          [...el.querySelectorAll('.msg.bot .bub p')]
            .map(p => p.textContent)
            .find(t => /jawaban/.test(t)) ?? ''
      }))
      check(
        hasil.img === 0 && !hasil.on && !hasil.xss,
        'asisten: jawaban berupa teks biasa, HTML tidak dijalankan',
        JSON.stringify(hasil)
      )
      check(
        hasil.teks.includes('<img'),
        'asisten: markup dalam jawaban ditampilkan sebagai teks',
        hasil.teks
      )
      check(
        hasil.links.every(h => !h || h.startsWith('/')),
        'asisten: tautan sumber asing (javascript:, host lain) tidak menjadi tautan',
        JSON.stringify(hasil.links)
      )
      await page.close()
    })
  }

  if (WA !== '') {
    await section('whatsapp: pesan awal di halaman dokumen', async () => {
      const page = await openPage(DESKTOP)
      await go(page, `/dokumen/${DOC_ID}`)
      await page.waitForSelector('h1.dtitle', { timeout: 8000 })
      await sleep(300)
      const href = await page.$eval('.fab-wa', a => a.getAttribute('href'))
      const pesan = decodeURIComponent(href.split('?text=')[1] ?? '')
      check(
        /Perda|Peraturan Daerah/.test(pesan) &&
          pesan.includes(`/dokumen/${DOC_ID}`),
        'whatsapp: pesan awal memuat judul dan tautan dokumen',
        pesan
      )
      await go(page, '/')
      const href2 = await page.$eval('.fab-wa', a => a.getAttribute('href'))
      check(
        decodeURIComponent(href2.split('?text=')[1]).startsWith(
          'Halo, saya ingin bertanya tentang JDIH'
        ),
        'whatsapp: halaman lain memakai pesan bawaan'
      )
      await page.close()
    })
  }

  if (ASISTEN || WA !== '') {
    await section('kanan bawah: footer dan konten', async () => {
      for (const [nama, vp] of [
        ['desktop', DESKTOP],
        ['tablet', TABLET],
        ['desktop-1024', { width: 1024, height: 768 }]
      ]) {
        for (const path of ['/', '/dokumen', '/kebijakan-privasi']) {
          const page = await openPage(vp)
          await go(page, path)
          await page.evaluate(() =>
            window.scrollTo(0, document.documentElement.scrollHeight)
          )
          await sleep(500)
          const tabrak = await page.evaluate(() => {
            const fab = [
              ...document.querySelectorAll(
                '.fabs button:not([hidden]), .fabs a, .a11y-trigger'
              )
            ]
              .map(e => e.getBoundingClientRect())
              .filter(r => r.width > 0)
            const kena = []
            for (const el of document.querySelectorAll(
              '.footer a, .footer p, .footer h2, .footer img, .footer button'
            )) {
              const r = el.getBoundingClientRect()
              if (r.width === 0) continue
              for (const f of fab) {
                if (
                  r.left < f.right + 6 &&
                  r.right > f.left - 6 &&
                  r.top < f.bottom + 6 &&
                  r.bottom > f.top - 6
                ) {
                  kena.push(el.textContent.trim().slice(0, 30))
                }
              }
            }
            return kena
          })
          check(
            tabrak.length === 0,
            `kanan bawah/${nama}${path}: digulir mentok, tombol tidak menimpa teks, tautan, atau gambar footer`,
            tabrak.join('|')
          )
          await page.close()
        }
      }
    })
  }

  // ---------- Pratinjau PDF ----------
  await section('pratinjau: desktop (otomatis, inline)', async () => {
    const page = await openPage(DESKTOP)
    await pasangPencegat(page)
    await go(page, `/dokumen/${DOC_ID}`)
    await page.waitForSelector('.pv-inline canvas', { timeout: 15000 })
    await sleep(800)
    check(
      page.log.lampiran === 1,
      'pratinjau/desktop: berkas diunduh sekali saat seksi terlihat',
      `n=${page.log.lampiran}`
    )
    check(
      (await page.$('.pv-card')) === null || !(await vis(page, '.pv-card')),
      'pratinjau/desktop: tanpa kartu'
    )
    const piksel = await page.$eval('.pv-inline canvas', c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let gelap = 0
      for (let i = 0; i < d.length; i += 4) if (d[i] < 100) gelap++
      return { w: c.width, h: c.height, gelap }
    })
    check(
      piksel.w > 100 && piksel.gelap > 200,
      'pratinjau/desktop: halaman PDF tergambar di kanvas (ada teks gelap)',
      JSON.stringify(piksel)
    )
    check(
      /Halaman\s*1\s*dari\s*1/.test(
        String(await text(page, '.pv-pg .pv-long'))
      ),
      'pratinjau/desktop: penunjuk "Halaman 1 dari 1"',
      String(await text(page, '.pv-pg .pv-long'))
    )
    const label = await page.$eval(
      '.pv-inline .pv-page',
      p => `${p.getAttribute('role')}:${p.getAttribute('aria-label')}`
    )
    check(
      label === 'img:Halaman 1 dari 1',
      'pratinjau/desktop: halaman berperan img berlabel "Halaman 1 dari 1"',
      label
    )
    check(
      (await page.$eval('.pv-stage', s => s.getAttribute('tabindex'))) === '0',
      'pratinjau/desktop: area halaman dapat difokus papan ketik (gulir)'
    )
    const z0 = await text(page, '.pv-zoom .num')
    await page.click('[aria-label="Perbesar"]')
    await sleep(500)
    const z1 = await text(page, '.pv-zoom .num')
    check(
      parseInt(z1) > parseInt(z0),
      'pratinjau/desktop: Perbesar menaikkan persen',
      `${z0} -> ${z1}`
    )
    await page.click('[aria-label="Lebar halaman"]')
    await sleep(500)
    check(
      (await text(page, '.pv-zoom .num')) === z0,
      'pratinjau/desktop: Lebar halaman kembali ke lebar kolom',
      String(await text(page, '.pv-zoom .num'))
    )
    // Ganti berkas.
    await page.evaluate(() =>
      [...document.querySelectorAll('.pv-files button')]
        .find(b => b.textContent.trim() === 'Abstrak')
        .click()
    )
    await sleep(1500)
    check(
      page.log.lampiran === 2,
      'pratinjau/desktop: berkas lain diunduh saat dipilih',
      `n=${page.log.lampiran}`
    )
    check(
      (await page.$eval('.pv-files button[aria-pressed=true]', b =>
        b.textContent.trim()
      )) === 'Abstrak',
      'pratinjau/desktop: chip berkas ditandai aria-pressed'
    )
    // Layar penuh.
    await page.click('[aria-label="Layar penuh"]')
    await sleep(900)
    const modal = await page.evaluate(() => {
      const m = document.querySelector('.pv-modal')
      return (
        m && {
          modal: m.getAttribute('aria-modal'),
          inert: document.getElementById('q-app').hasAttribute('inert'),
          lock: document.documentElement.classList.contains('pv-lock'),
          kanvas: m.querySelectorAll('canvas').length,
          fokus: document.activeElement?.id
        }
      )
    })
    check(
      modal &&
        modal.modal === 'true' &&
        modal.inert &&
        modal.lock &&
        modal.kanvas >= 1,
      'pratinjau/desktop: layar penuh berupa dialog modal, latar inert, halaman tergambar',
      JSON.stringify(modal)
    )
    check(
      modal?.fokus === 'pv-mt',
      'pratinjau/desktop: fokus awal ke judul dialog',
      String(modal?.fokus)
    )
    check(
      !(await vis(page, '.fabs')) && !(await vis(page, '.a11y')),
      'pratinjau/desktop: widget kiri dan kanan tersembunyi saat layar penuh'
    )
    await axe(page, 'pratinjau/desktop layar penuh')
    await page.keyboard.press('Escape')
    await sleep(500)
    check(
      (await page.$('.pv-modal')) === null &&
        !(await page.evaluate(() =>
          document.getElementById('q-app').hasAttribute('inert')
        )),
      'pratinjau/desktop: Esc menutup dialog dan melepas inert'
    )
    check(
      (await active(page)).includes('icon-btn'),
      'pratinjau/desktop: fokus kembali ke tombol Layar penuh',
      String(await active(page))
    )
    await axe(page, 'pratinjau/desktop')
    await sehat(page, 'pratinjau/desktop')
    check(
      page.log.console.filter(m => !/Failed to load resource|favicon/i.test(m))
        .length === 0,
      'pratinjau/desktop: tanpa galat konsol',
      page.log.console.join(' | ')
    )
    await page.close()
  })

  await section('pratinjau: ponsel (kartu, diunduh saat diketuk)', async () => {
    const page = await openPage(PHONE)
    await pasangPencegat(page)
    await go(page, `/dokumen/${DOC_ID}`)
    await sleep(800)
    check(await vis(page, '.pv-card'), 'pratinjau/ponsel: kartu tampil')
    check(
      !(await vis(page, '.pv-inline')),
      'pratinjau/ponsel: tanpa pratinjau inline'
    )
    check(
      page.log.lampiran === 0,
      'pratinjau/ponsel: berkas belum diunduh sebelum diketuk',
      `n=${page.log.lampiran}`
    )
    const btn = await rect(page, '.pv-card .btn')
    check(
      btn.h >= 48,
      'pratinjau/ponsel: tombol Buka pratinjau >= 48 px',
      JSON.stringify(btn)
    )
    await axe(page, 'pratinjau/ponsel kartu')
    await page.click('.pv-card .btn')
    await page.waitForSelector('.pv-modal canvas', { timeout: 15000 })
    await sleep(800)
    check(
      page.log.lampiran === 1,
      'pratinjau/ponsel: berkas diunduh setelah diketuk',
      `n=${page.log.lampiran}`
    )
    check(
      (await vis(page, '.pv-modal')) && (await active(page)).includes('pv-mt'),
      'pratinjau/ponsel: penampil layar penuh, fokus ke judul',
      String(await active(page))
    )
    const tombol = await page.$$eval('.pv-modal .icon-btn, .pv-modal .btn', b =>
      b
        .filter(x => x.getBoundingClientRect().width > 0)
        .map(x =>
          Math.min(
            x.getBoundingClientRect().width,
            x.getBoundingClientRect().height
          )
        )
    )
    check(
      tombol.every(h => h >= 48),
      'pratinjau/ponsel: semua kontrol penampil >= 48 px',
      tombol.join()
    )
    await axe(page, 'pratinjau/ponsel penampil')
    await page.keyboard.press('Escape')
    await sleep(500)
    check(
      (await page.$('.pv-modal')) === null,
      'pratinjau/ponsel: Esc menutup penampil'
    )
    check(
      (await active(page)).includes('btn'),
      'pratinjau/ponsel: fokus kembali ke tombol Buka pratinjau',
      String(await active(page))
    )
    check(
      /halaman/.test(String(await text(page, '.pv-cardtxt'))),
      'pratinjau/ponsel: kartu menampilkan jumlah halaman setelah dimuat',
      String(await text(page, '.pv-cardtxt'))
    )
    await page.click('.pv-card .btn')
    await sleep(600)
    check(
      page.log.lampiran === 1,
      'pratinjau/ponsel: membuka lagi memakai berkas yang sudah dimuat',
      `n=${page.log.lampiran}`
    )
    await sehat(page, 'pratinjau/ponsel')
    await page.close()
  })

  await section(
    'pratinjau: keadaan terlalu besar, situs lain, dan galat',
    async () => {
      // Terlalu besar menurut metadata: tidak ada permintaan berkas sama sekali.
      const besar = await openPage(DESKTOP)
      await pasangPencegat(besar, {
        detail: json => {
          json.data.lampiran[0].ukuran = 30_000_000
          return json
        }
      })
      await go(besar, `/dokumen/${DOC_ID}`)
      await sleep(1200)
      check(
        /terlalu besar untuk pratinjau/.test(
          String(await text(besar, '.pv-msg'))
        ),
        'pratinjau/besar: pesan "terlalu besar" bila ukuran > 25 MB',
        String(await text(besar, '.pv-msg'))
      )
      check(
        besar.log.lampiran === 0,
        'pratinjau/besar: berkas tidak diunduh',
        `n=${besar.log.lampiran}`
      )
      check(
        await page_has(besar, '.pv-msg a.btn[href*="/lampiran/"]'),
        'pratinjau/besar: tersedia tombol Unduh PDF'
      )
      await axe(besar, 'pratinjau/besar')
      await besar.close()

      const luar = await openPage(DESKTOP)
      await pasangPencegat(luar, { lampiran: 'alih' })
      await go(luar, `/dokumen/${DOC_ID}`)
      await sleep(1500)
      check(
        /disimpan di situs lain/.test(String(await text(luar, '.pv-msg'))),
        'pratinjau/luar: pengalihan ke host lain menjadi "berkas di situs lain"',
        String(await text(luar, '.pv-msg'))
      )
      const tl = await luar.$eval('.pv-msg a.btn', a => ({
        t: a.target,
        rel: a.rel
      }))
      check(
        tl.t === '_blank' && /noopener/.test(tl.rel),
        'pratinjau/luar: tautan situs asal dibuka di tab baru dengan rel aman',
        JSON.stringify(tl)
      )
      await luar.close()

      const galat = await openPage(DESKTOP)
      await pasangPencegat(galat, { lampiran: 'galat' })
      await go(galat, `/dokumen/${DOC_ID}`)
      await sleep(1500)
      check(
        /Pratinjau tidak dapat dimuat/.test(
          String(await text(galat, '.pv-msg.bad'))
        ) &&
          (await galat.$eval('.pv-msg.bad', e => e.getAttribute('role'))) ===
            'alert',
        'pratinjau/galat: pesan gagal dimuat (role=alert)'
      )
      await axe(galat, 'pratinjau/galat')
      galat.opsi.lampiran = 'ok'
      await galat.click('.pv-msg.bad .btn-tonal')
      await galat.waitForSelector('.pv-inline canvas', { timeout: 15000 })
      check(
        true,
        'pratinjau/galat: Coba lagi memuat pratinjau setelah jaringan pulih'
      )
      await galat.close()
    }
  )
} finally {
  await browser.close()
}

async function page_has(page, sel) {
  return (await page.$(sel)) !== null
}

let gagal = 0
for (const r of results) {
  if (!r.ok) gagal++
  console.log(
    `${r.ok ? 'LULUS' : 'GAGAL'}  ${r.name}${r.ok || !r.detail ? '' : `\n         -> ${r.detail}`}`
  )
}
console.log(
  `\n${results.length - gagal}/${results.length} lulus, ${gagal} gagal`
)
process.exit(gagal > 0 ? 1 : 0)
