# Keamanan: JDIH DPRD Kota Singkawang

Standar: OWASP Top 10 (2021), OWASP API Security Top 10 (2023), dan OWASP MASVS untuk build Android. Dokumen ini adalah model ancaman ringkas, peta kontrol, dan cara memeriksanya.

## Model ancaman

Aplikasi ini **hanya membaca**. Tidak ada akun, tidak ada formulir yang mengirim data pengguna, tidak ada penulisan lewat API publik, dan klien tidak pernah menjangkau database.

| Aset                            | Ancaman utama                                               | Pertahanan                                                                                       |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Integritas dokumen hukum        | Data atau berkas dimanipulasi di jalan atau di API          | HTTPS saja, API baca saja, berkas lewat ID buram                                                 |
| Pengguna (peramban dan WebView) | XSS lewat isi halaman dari backend, tautan berbahaya        | DOMPurify allowlist, CSP ketat, allowlist tautan keluar                                          |
| API dan database                | Injeksi, IDOR, enumerasi, penyalahgunaan sumber daya        | Parameter divalidasi, skema respons = allowlist kolom, rate limit, user DB hanya SELECT (`api/`) |
| Perangkat Android               | Kebocoran data, pembongkaran, lalu lintas tidak terenkripsi | `allowBackup=false`, tanpa cleartext, R8, debugging WebView mati pada rilis                      |
| Privasi                         | Pelacakan perilaku, kebocoran ke pihak ketiga               | Tanpa analitik, tanpa font/CDN pihak ketiga, `referrer: no-referrer`                             |

Di luar lingkup kode ini: keamanan server produksi (OS, nginx, sertifikat), backend Yii2 lama, dan layanan Media Center.

## Peta kontrol

| Kategori              | Kontrol                                                                                                                                                                 | Lokasi                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A01 Access control    | Tanpa akun dan aksi tulis. Parameter rute divalidasi lalu 404. Skema respons = allowlist kolom. Berkas lewat ID buram.                                                  | `src/router/routes.js`, `src/utils/validators.js`, `src/services/normalizers.js`, `docs/api/openapi.yaml` |
| A02 Kriptografi       | HTTPS saja; skema Android `https`, tanpa cleartext. Hanya variabel berawalan `JDIH_` sampai ke klien.                                                                   | `src/config/endpoints.js`, `src-capacitor/capacitor.config.js`, `quasar.config.js`                        |
| A03 Injeksi / XSS     | Tanpa `v-html` kecuali `SafeHtml.vue` (DOMPurify). Query lewat `URLSearchParams`. Teks berita lewat `DOMParser` ke `textContent`. Gerbang statis menolak pola berisiko. | `src/utils/sanitize.js`, `src/utils/text.js`, `scripts/check-security.mjs`                                |
| A04 Desain tidak aman | Batas panjang dan halaman, pembatalan permintaan usang, batas waktu, batas ukuran respons.                                                                              | `src/services/http.js`, `src/utils/validators.js`                                                         |
| A05 Misconfiguration  | CSP ketat (`script-src 'self'`, tanpa eval), HSTS, nosniff, Referrer-Policy, Permissions-Policy. Font di-host sendiri. Tanpa peta sumber.                               | `index.html`, `quasar.config.js`, `deploy/`                                                               |
| A06 Komponen rentan   | Dependensi runtime minimal (quasar, vue, vue-router, dompurify, @capacitor/app). `npm audit` bersih.                                                                    | `package.json`                                                                                            |
| A07 Autentikasi       | Tidak berlaku (tanpa login).                                                                                                                                            | —                                                                                                         |
| A08 Integritas data   | Payload API divalidasi runtime (SchemaError). Tanpa skrip CDN. APK rilis ditandatangani.                                                                                | `src/utils/schema.js`, `src-capacitor/android/app/build.gradle`                                           |
| A09 Logging           | Penanganan galat global tanpa jejak tumpukan ke pengguna; tanpa analitik dan pelacak.                                                                                   | `src/boot/errors.js`                                                                                      |
| A10 SSRF / redirect   | `getJson` memeriksa origin awal dan akhir (setelah redirect). `safeExternalUrl` menolak userinfo, port, punycode, titik di akhir host, subdomain palsu.                 | `src/services/http.js`, `src/utils/url.js`                                                                |
| MASVS (Android)       | `allowBackup=false`, `usesCleartextTraffic=false`, R8, izin hanya INTERNET, FileProvider dipersempit, keystore di luar repo.                                            | `src-capacitor/android/`                                                                                  |

### Kontrol sisi API (`api/`)

| Kontrol                                                                                                                                                    | Lokasi                                   | Dibuktikan oleh                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Akun database SELECT-only pada 12 tabel; INSERT/UPDATE/DELETE/DDL ditolak                                                                                  | `api/db/grants.sql`                      | tes "akun database baca-saja"                                                     |
| Hanya `GET`/`HEAD`/`OPTIONS`; metode lain 405; nginx juga menolak (`limit_except`)                                                                         | `api/src/server.js`, `deploy/nginx.conf` | tes 405; uji nyata di nginx: POST 403                                             |
| Prepared statement (`execute`); hanya bilangan bulat tervalidasi yang disisipkan (`LIMIT`/`OFFSET`/`IN`); `sort`, `tipe`, `status` berupa enum             | `api/src/repo.js`, `api/src/schemas.js`  | fuzz 319 permintaan (SQLi, `%`/`_`, `__proto__`, Unicode): 0 temuan, 0 galat      |
| Bilangan bulat query wajib digit desimal polos (Ajv meloloskan `Infinity`/`1e999` melewati batas rentang)                                                  | `api/src/server.js` (`preValidation`)    | tes regresi; terbukti gagal saat hook dimatikan                                   |
| Dokumen draf/tersembunyi dan relasi ke dokumen tak terbit tidak pernah keluar (daftar, detail, relasi, statistik)                                          | `api/src/sql.js` (`PUBLISHED`)           | tes integrasi dan fuzz (ID tak terbit selalu 404)                                 |
| Unduhan lewat ID buram; jalur dari database; nama tanpa pemisah jalur, ekstensi allowlist, realpath tetap di `FILES_DIR`; lampiran terbatas tidak dilayani | `api/src/files.js`, `api/src/routes.js`  | tes traversal (400/404), lampiran terbatas/nonaktif/host tak diizinkan            |
| Pengalihan hanya ke host allowlist (`FILE_REDIRECT_HOSTS`), `https` saja                                                                                   | `api/src/files.js`                       | tes host tidak diizinkan (404)                                                    |
| HTML halaman dari database dibersihkan di server (`sanitize-html`, allowlist) dan lagi di klien (DOMPurify)                                                | `api/src/html.js`                        | 7 tes sanitasi (9 payload XSS kanonik); e2e nyata: skrip/`onerror` tidak berjalan |
| CORS allowlist (bukan `*`), preflight hanya GET/HEAD/OPTIONS                                                                                               | `api/src/server.js`                      | uji nyata: origin asing tanpa `Access-Control-Allow-Origin`                       |
| Batas laju per IP (429, problem+json); `bodyLimit` 1 KiB; `per_page` ≤ 50, `page` ≤ 1000                                                                   | `api/src/server.js`                      | uji nyata: 118×200 lalu 12×429                                                    |
| Header: CSP `default-src 'none'; frame-ancestors 'none'` (tanpa `useDefaults`), HSTS, `nosniff`, `no-referrer`; tanpa `X-Powered-By`                       | `api/src/server.js`                      | tes header persis pada semua jenis respons                                        |
| Galat `problem+json` tanpa SQL, jalur, atau jejak tumpukan; ID permintaan dibuat server; log meredaksi `authorization` dan `cookie`                        | `api/src/server.js`, `api/src/index.js`  | tes galat database (500 generik); fuzz tanpa kebocoran                            |
| Dependensi runtime: fastify, @fastify/{cors,helmet,rate-limit}, mysql2, sanitize-html; `npm audit` 0                                                       | `api/package.json`                       | `npm audit` di `api/`                                                             |
| Skrip data uji menolak database yang namanya bukan `test`/`tmp`/`dev` (tidak boleh menyuntikkan data sintetis ke produksi)                                 | `api/scripts/load-db.mjs`                | uji penolakan `db_jdihdprd` dan `jdih_real`                                       |

Hasil audit OWASP per kategori (temuan, disposisi, dan bukti): [docs/security/owasp-audit-2026-11-20.md](docs/security/owasp-audit-2026-11-20.md) (klien dan lampiran API).

## Cara memeriksa

```bash
npm run check          # format, lint, gerbang keamanan statis, uji unit
npm audit              # kerentanan dependensi (jalankan juga di api/ dan src-capacitor/)
npm run dev            # lalu di terminal lain:
npm run test:e2e       # peramban sungguhan: alur, axe WCAG 2.2 AA, CSP, XSS, galat, offline
npm run test:api       # API: butuh TEST_DB_URL ke database uji (lihat api/README.md)
```

`npm run test:e2e` memeriksa antara lain: tidak ada pelanggaran CSP, tidak ada permintaan ke host selain API dan Media Center, isi halaman jahat tidak menjalankan kode, dan parameter berbahaya tidak merusak halaman.

## Hal yang masih terbuka

- **API belum diverifikasi di lingkungan produksi.** Semua kontrol di atas terbukti pada database uji (skema nyata, data sintetis), pada dump contoh pemilik (4 dokumen, uji kompatibilitas), dan di belakang nginx 1.28 lokal. Yang tersisa untuk hari rilis: `curl -I` pada server sebenarnya (header lewat `deploy/security-headers.conf`), versi MySQL/MariaDB produksi, akun SELECT-only dibuat oleh pengelola database, dan asumsi data yang tercantum di `api/README.md` (nilai `sembunyikan_di_opac`, `akses_lampiran`, `pembatasan_lampiran`, format `url_lampiran`).
- **Notifikasi peraturan baru**: mekanisme belum diputuskan. FCM menyentuh pihak ketiga (Google) dan menambah izin notifikasi Android 13+. Alternatif tanpa Firebase: pemeriksaan berkala di perangkat terhadap `GET /dokumen?sort=terbaru` lalu notifikasi lokal (tanpa server pengirim dan tanpa layanan Google, tetapi tidak instan). Lihat `PRODUCT.md`.
- **Penghitung dilihat/diunduh**: user database baca saja tidak bisa menaikkannya, dan sementara ini hanya dibaca. Menaikkannya butuh `GRANT UPDATE` terbatas pada dua kolom (`hit_see`, `hit_download`), yang berarti melonggarkan prinsip "API tidak menulis". Menunggu keputusan pemilik.
- **Backend Yii2 lama** (di luar kode ini): hasil tinjauan terhadap situs yang sedang berjalan disampaikan langsung kepada pengelola, tidak dicantumkan di repositori publik ini.
- **Rilis Android**: keystore dibuat dan disimpan pemilik (tidak di repo); `appId` bersifat permanen setelah rilis Play Store.

## Melaporkan kerentanan

Hubungi pengelola JDIH DPRD Kota Singkawang secara langsung dan jangan membuka isu publik berisi detail eksploitasi. (Alamat kontak resmi untuk `security.txt` menunggu dari pemilik.)
