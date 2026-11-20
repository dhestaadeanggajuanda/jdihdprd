# Audit keamanan OWASP: JDIH DPRD Kota Singkawang (klien)

- **Tanggal:** 2026-11-20
- **Cakupan:** `src/`, `index.html`, `quasar.config.js`, `src-capacitor/capacitor.config.js`, `src-capacitor/android/app` (manifest dan `build.gradle`), `dev/mock-api` (hanya pengembangan), `scripts/`, `deploy/`.
- **Di luar cakupan:** server produksi, backend Yii2 lama, Media Center, dan isi database produksi. API (`api/`) diaudit pada lampiran di bawah, hanya dengan data sintetis dan dump contoh pemilik (4 dokumen).
- **Stack:** Quasar 3 + Vue 3 (JavaScript), Capacitor 8 (Android), DOMPurify. Aplikasi hanya membaca: tanpa akun, tanpa penulisan, tanpa database di sisi klien.
- **Metode:** pencarian pola per kategori OWASP Top 10 (2021), bacaan mendalam pada setiap temuan, uji peramban sungguhan (278 pemeriksaan: CSP, XSS, permintaan pihak ketiga, galat, offline), `npm audit`, lalu putaran kedua dengan sudut pandang adversarial. **Catatan kejujuran:** putaran kedua dilakukan oleh peninjau yang sama (bukan model atau agen berbeda), jadi bias yang berkorelasi masih mungkin.

## Ringkasan

| Tingkat                  | Jumlah                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Critical / High / Medium | 0                                                                                      |
| Low                      | 2 diterima dengan syarat (klien); 4 ditemukan dan diperbaiki pada audit API (lampiran) |
| Info                     | 3 (2 klien; 1 skrip data uji API, diperbaiki)                                          |

Tidak ada temuan terbuka yang menghalangi rilis. Yang tersisa sebelum produksi adalah verifikasi di server sebenarnya, bukan perbaikan kode (lihat "Rencana perbaikan berurutan").

## Temuan

#### [LOW] A05: CSP memakai `style-src 'unsafe-inline'` (Accepted Risk)

**File:** `index.html` (lewat `quasar.config.js` → `htmlVariables.csp`), `deploy/security-headers.conf`
**CWE:** CWE-693
**Deskripsi:** Vue dan Quasar menulis atribut `style` saat runtime (lebar skeleton, QDialog), sehingga CSP tanpa `'unsafe-inline'` untuk gaya merusak antarmuka.

1. _Mengapa tidak diperbaiki sekarang:_ butuh mengganti semua `:style` dan perilaku internal QDialog.
2. _Kontrol kompensasi:_ `script-src 'self'` tanpa `'unsafe-inline'`/`'unsafe-eval'` (tidak ada eksekusi skrip), `img-src` dan `connect-src` dibatasi ke dua origin (CSS tidak bisa mengirim data keluar), DOMPurify membuang atribut `style` dari konten backend.
3. _Pemicu evaluasi ulang:_ Quasar/Vue mendukung CSP dengan nonce atau gaya hanya lewat CSSOM, atau `:style` dihapus dari kode.

#### [LOW] A04/A05: Kontrol sisi API (Resolved)

**File:** `api/`, `docs/api/openapi.yaml`, `deploy/nginx.conf`
**Deskripsi:** Sebelumnya hanya didefinisikan di kontrak. Kini diimplementasikan dan semua syarat gerbang terbukti: INSERT/UPDATE/DELETE/DDL ditolak akun database, traversal pada lampiran 400/404, 429 setelah batas, preflight CORS dari origin tidak sah tanpa `Access-Control-Allow-Origin`. Bukti dan temuan tambahan: lampiran di bawah.

#### [LOW] A05: Server pengembangan terbuka di jaringan lokal (Accepted Risk, hanya dev)

**File:** `quasar.config.js` (`devServer`), `dev/mock-api/plugin.js`
**Deskripsi:** `quasar dev` mendengarkan semua antarmuka agar perangkat Android bisa menguji lewat LAN; API palsu ikut terlayani. Berisi data contoh, tanpa rahasia. Plugin hanya aktif saat `ctx.dev` dan terverifikasi tidak ikut bundel produksi (`dist/spa` bebas dari data contoh dan kode API palsu).
**Kontrol kompensasi:** hanya dipakai di jaringan pengembang; tanpa data sensitif. **Pemicu evaluasi ulang:** bila API palsu kelak memuat data nyata.

#### [INFO] A05: Header penuh hanya lewat server

`frame-ancestors`, HSTS, dan Permissions-Policy tidak bisa lewat `<meta>`. Disediakan di `deploy/security-headers.conf`; harus benar-benar dipasang saat deploy (verifikasi `curl -I`).

#### [INFO] A06: Peringatan audit dev sudah dibersihkan

`@vue/test-utils` (dev) menarik `js-beautify`/`editorconfig`/`minimatch` dengan 5 peringatan moderat. Dicabut (uji memakai `createApp` bawaan Vue). `npm audit`: 0 kerentanan, juga untuk `src-capacitor`.

## Per kategori

| Kategori              | Status                                         | Yang diperiksa                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Access control    | **Clean**                                      | Tanpa akun dan aksi tulis. Parameter rute divalidasi di definisi rute (`:id(\d{1,10})`, slug) dan di `parseListQuery`; nilai tak sah jatuh ke 404 atau bawaan (uji e2e `/dokumen/abc`, parameter berbahaya). Tidak ada `redirect(from/next/returnTo)`; `router.push` hanya dengan jalur tetap dan kueri tervalidasi. ID dokumen/lampiran divalidasi (`opaqueId`) sebelum membentuk URL.                                                                     |
| A02 Kriptografi       | **Clean**                                      | Pencarian kunci/rahasia (pola penyedia utama, `password                                                                                                                                                                                                                                                                                                                                                                                                     | secret | api_key | token`) di `src`, `dev`, `scripts`, `deploy`, konfigurasi, Gradle: hanya referensi ke `keystore.properties`(di luar repo, di-ignore).`.env`hanya`JDIH_NEWS_FILTER`(publik, didokumentasikan).`localStorage` hanya preferensi tampilan/notifikasi (`jdih:tampilan`, `jdih:notifikasi`). HTTPS: konstanta host `https://`; Android `androidScheme=https`, `cleartext=false`, `allowMixedContent=false`, `usesCleartextTraffic=false`. |
| A03 Injeksi / XSS     | **Clean**                                      | `v-html` hanya di `SafeHtml.vue` (DOMPurify allowlist, URI https/mailto/tel); `innerHTML`/`eval`/`new Function`/`document.write` nihil (gerbang statis memaksa). Teks berita lewat `DOMParser` → `textContent`. Query lewat `URLSearchParams`. 12 payload XSS kanonik + halaman uji `/tentang/uji-sanitasi` di peramban: tidak ada kode berjalan. Tidak ada `<script>` JSON-LD. `AppIcon` dan `StateView` memakai `<component :is>` hanya dari data statis. |
| A04 Desain tidak aman | **Clean** (klien); kontrol server **Deferred** | Batas panjang `q`, halaman, dan ukuran respons; pembatalan permintaan usang; batas waktu. Rate limit adalah tugas API (lihat temuan).                                                                                                                                                                                                                                                                                                                       |
| A05 Misconfiguration  | Temuan di atas                                 | CSP ketat (`script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), `referrer: no-referrer`, peta sumber mati, font di-host sendiri, tanpa CDN. Manifest Android: `allowBackup=false`, tanpa cleartext, izin hanya INTERNET, FileProvider dipersempit ke cache, R8 aktif pada rilis, WebView debugging hanya di dev. Tidak ada berkas duplikat/sisa.                                                                             |
| A06 Komponen rentan   | **Clean**                                      | `npm audit` 0 (root dan `src-capacitor`); runtime: quasar, vue, vue-router, dompurify, @capacitor/app/core.                                                                                                                                                                                                                                                                                                                                                 |
| A07 Autentikasi       | **N/A**                                        | Tidak ada autentikasi atau sesi.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A08 Integritas data   | **Clean**                                      | Payload API divalidasi runtime (`SchemaError`, allowlist kolom). Lockfile ada; tanpa skrip CDN (SRI tidak relevan). Penandatanganan rilis Android lewat `keystore.properties`.                                                                                                                                                                                                                                                                              |
| A09 Logging           | **Clean** dengan catatan                       | Galat global tanpa jejak tumpukan ke pengguna; tanpa analitik/pelacak. Satu-satunya blok `catch` yang menelan galat bersifat degradasi sengaja (gambar berita gagal, perkiraan jumlah filter, papan klip) dan tidak membawa sinyal serangan di sisi klien.                                                                                                                                                                                                  |
| A10 SSRF / redirect   | **Clean**                                      | `getJson` memeriksa origin awal dan origin akhir setelah redirect; `credentials: omit`, `referrerPolicy: no-referrer`. `safeExternalUrl` dengan kecocokan host persis menolak: skema non-https, userinfo, `@`-host, port, punycode, titik di akhir host, subdomain palsu, IPv4 (desimal/heksa/oktal), IPv6, IPv4-mapped, metadata cloud, CGNAT, link-local (diuji di `tests/unit/url.test.js`). Klien tidak mengambil URL dari masukan pengguna.            |

## Perbaikan selama audit

- Menambah uji bypass allowlist (IP literal, IPv6, metadata, `localhost.`) pada `safeExternalUrl`.
- Menghapus `src/utils/open.js` (kode mati yang membawa `window.open`).
- Mencabut `@vue/test-utils` (menghilangkan 5 peringatan audit dev).

## Rencana perbaikan berurutan

1. **Sebelum rilis produksi:** pasang `deploy/security-headers.conf` dan `deploy/nginx.conf` di server sebenarnya lalu verifikasi `curl -I`; konfirmasi versi MySQL/MariaDB; akun SELECT-only dari `api/db/grants.sql` dibuat pengelola database; cocokkan asumsi data di `api/README.md` dengan isi produksi.
2. **Sebelum rilis Android:** keystore dari pemilik, `appId` final, konfirmasi bahwa tautan luar dibuka di peramban sistem pada perangkat nyata.
3. **Terjadwal:** tinjau ulang CSP `style-src` saat Quasar/Vue mendukung nonce; audit ulang setelah mekanisme notifikasi diputuskan (FCM menambah izin, pihak ketiga, dan layanan pengirim).

## Lampiran: audit API (`api/`)

- **Cakupan:** `api/src`, `api/db`, `api/scripts`, `api/test`, `deploy/nginx.conf`. Node 24, Fastify 5.12, mysql2 3.24, sanitize-html 2.18.
- **Metode:** pencarian pola per kategori dan bacaan mendalam pada setiap sink (SQL, berkas, HTML, jaringan keluar); 49 tes (48 lulus, 0 gagal, 1 dilewati bersyarat bila `TEST_DB_URL` kosong); fuzz 319 permintaan (SQLi, `%`/`_`, `__proto__`, bilangan tak hingga, jalur traversal, Unicode, metode tulis) pada instance dengan batas laju longgar; uji nyata API di belakang nginx 1.28 (header, `X-Accel-Redirect`, `limit_except`); inspeksi header dan CORS di kabel; 45 pemeriksaan peramban terhadap API nyata; `npm audit` (0).
- **Catatan kejujuran:** peninjau sama dengan pembangun, jadi bias yang berkorelasi masih mungkin. Putaran fuzz pertama menghasilkan temuan palsu dari alat uji sendiri (pola kebocoran `ER_` cocok dengan `per_page`; batas laju 429 membuat sisa pemeriksaan tidak bermakna). Keduanya diperbaiki dan fuzz diulang; hanya hasil ulang yang dilaporkan di sini. Data yang diuji sintetis dan dump contoh 4 dokumen, bukan data produksi.

### Temuan (semua diperbaiki selama audit)

#### [LOW] A04: koersi Ajv meloloskan `Infinity` melewati batas rentang (Fixed)

**File:** `api/src/server.js`
**Deskripsi:** Ajv 8.20 mengoersi `Infinity`, `-Infinity`, dan `1e999` menjadi `Infinity`, yang lolos `minimum`/`maximum` (diverifikasi langsung pada Ajv). `page=Infinity` dan `per_page=Infinity` berujung 500 di serializer; `tahun_dari=Infinity` lolos ke lapisan query (hasil kosong).
**Perbaikan:** hook `preValidation` mewajibkan `page`, `per_page`, `tahun_dari`, `tahun_sampai` berupa 1 sampai 5 digit desimal polos (selain itu 400). **Bukti:** tes regresi gagal pada `page=Infinity` (500) saat hook dimatikan dan lulus saat aktif; fuzz ulang 0 temuan.

#### [LOW] A05: CSP API memuat direktif longgar bawaan helmet (Fixed)

**File:** `api/src/server.js`
**Deskripsi:** Konfigurasi meniatkan `default-src 'none'`, tetapi helmet menggabungkan direktif bawaannya sehingga header membawa `style-src ... 'unsafe-inline'`, `script-src 'self'`, dan lainnya. Tidak dapat dieksploitasi (respons JSON tidak dirender), tetapi menyimpang dari niat dan terbaca sebagai temuan.
**Perbaikan:** `useDefaults: false`. **Bukti:** tes memeriksa header persis `default-src 'none';frame-ancestors 'none'` pada setiap jenis respons.

#### [LOW] A05: nginx menambah `Content-Disposition` kedua pada unduhan (Fixed)

**File:** `deploy/nginx.conf`
**Deskripsi:** Lokasi internal `/internal-dokumen/` menambah `Content-Disposition: attachment`, padahal nginx meneruskan `Content-Disposition` (nama berkas) dari respons API pada `X-Accel-Redirect`. Hasilnya dua header berbeda pada satu respons (terlihat langsung pada nginx 1.28). Chromium dikenal menolak respons seperti itu (`ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION`), yaitu unduhan gagal pada mode `accel`; perilaku peramban itu tidak saya uji di sesi ini. Bukan celah keamanan, tetapi cacat fungsi pada jalur yang direkomendasikan.
**Perbaikan:** nginx tidak lagi menambah `Content-Disposition`; menambah `X-Content-Type-Options: nosniff` (tidak diteruskan nginx dari API) dan CSP `default-src 'none'; sandbox`. **Bukti:** diuji ulang di nginx: satu `Content-Disposition` dengan nama berkas, `nosniff`, CSP ada; `/internal-dokumen/` langsung dari klien 404; traversal pada ID lampiran 400; POST ke `/api/` 403.

#### [LOW] A05: persen-encoding rusak pada `url_lampiran` melempar galat (Fixed)

**File:** `api/src/files.js`
**Deskripsi:** `decodeURIComponent` pada nama berkas dari URL lama (`.../common/dokumen/%E0%A4%A.pdf`) melempar `URIError` sehingga satu baris data rusak menjadi 500 pada unduhan itu. Bukan masukan klien (nilai dari database), dan responsnya generik tanpa kebocoran.
**Perbaikan:** dibungkus `try/catch`, lampiran tidak disajikan (404). **Bukti:** modul diberi tes unit (traversal, host palsu, userinfo, port, skema, persen-encoding rusak, symlink keluar folder), 7 tes baru.

#### [INFO] A05: skrip data uji dapat menyuntik data sintetis ke database mana pun (Fixed)

**File:** `api/scripts/load-db.mjs`
**Deskripsi:** Penjagaan nama database (`test`/`tmp`/`dev`) hanya berlaku bila `--fresh`. Tanpa opsi itu skrip menjalankan skema dan `seed.sql` pada database apa pun. **Perbaikan:** penjagaan selalu berlaku. **Bukti:** `db_jdihdprd` dan `jdih_real` (berisi dump pemilik) ditolak sebelum menyambung.

### Per kategori (API)

| Kategori              | Status                                                                              | Yang diperiksa                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Access control    | **Clean**                                                                           | Tanpa akun dan aksi tulis. Dokumen draf atau tersembunyi (ID 10 dan 11 pada data uji) tidak muncul di daftar, detail, relasi, dan statistik; detail 404. Lampiran harus milik dokumen yang diminta (`l.id_dokumen = ?`) dan dokumen harus terbit; lampiran nonaktif, terbatas, atau berhost tidak diizinkan tidak dilayani. Parameter jalur berpola ketat (400). |
| A02 Kriptografi       | **Clean**                                                                           | `DB_URL` hanya dari lingkungan; tidak ada rahasia atau kata sandi uji di berkas repo (pencarian). HSTS pada API; TLS di nginx.                                                                                                                                                                                                                                   |
| A03 Injeksi / XSS     | **Clean**                                                                           | Prepared statement (`execute`). Interpolasi ke teks SQL hanya konstanta, kunci enum (`sort`, `tipe`, `status`) dan bilangan bulat tervalidasi; `LIKE` di-escape. `sanitize-html` allowlist untuk HTML. Tanpa `eval`, `exec`, `child_process`, `new Function` (pencarian).                                                                                        |
| A04 Desain tidak aman | **Clean** (setelah perbaikan koersi Ajv)                                            | Batas laju per IP, `bodyLimit` 1 KiB, `per_page` ≤ 50, `page` ≤ 1000, `q` 2 sampai 100 karakter, `maxParamLength` 200 (414).                                                                                                                                                                                                                                     |
| A05 Misconfiguration  | Empat temuan, semua diperbaiki (CSP helmet, nginx, persen-encoding, skrip data uji) | Header penuh dan CORS diperiksa di kabel; metode selain GET/HEAD/OPTIONS 405; tanpa `X-Powered-By`; peringatan deprekasi Fastify dibersihkan.                                                                                                                                                                                                                    |
| A06 Komponen rentan   | **Clean**                                                                           | `npm audit` 0 (dengan dan tanpa dev).                                                                                                                                                                                                                                                                                                                            |
| A07 Autentikasi       | **N/A**                                                                             | Tidak ada autentikasi.                                                                                                                                                                                                                                                                                                                                           |
| A08 Integritas data   | **Clean**                                                                           | Lockfile; keluaran dibatasi skema respons (allowlist kolom); HTML dari database disanitasi.                                                                                                                                                                                                                                                                      |
| A09 Logging           | **Clean** dengan catatan                                                            | Log terstruktur dengan redaksi `authorization` dan `cookie`; galat internal dicatat tanpa SQL atau jalur ke klien. Log permintaan memuat IP klien (data operasional): atur retensi di server.                                                                                                                                                                    |
| A10 SSRF / redirect   | **Clean**                                                                           | API tidak melakukan permintaan jaringan keluar (pencarian `fetch`/`http.request`/`axios`: nihil). Satu-satunya pengalihan adalah lampiran ke host allowlist yang cocok persis, `https`, tanpa userinfo dan port.                                                                                                                                                 |
| OWASP API Top 10      | **Clean**                                                                           | API1 (lampiran terikat ke dokumen), API3 (skema respons = allowlist), API4 (batas sumber daya), API5 (tanpa fungsi admin, metode tulis ditolak), API8 (header, CORS), API9 (`openapi.yaml`: 11 jalur cocok dengan rute).                                                                                                                                         |

### Yang tidak dapat dibuktikan di sini

- Perilaku pada MySQL/MariaDB produksi (diuji pada MySQL 8.4); isi data produksi (nilai `sembunyikan_di_opac`, `akses_lampiran`, `pembatasan_lampiran`, format `url_lampiran`); header pada server sebenarnya; perilaku Chromium untuk header ganda (lihat temuan nginx); mode `stream` pada beban tinggi.
