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

| Kategori              | Status                                         | Yang diperiksa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Access control    | **Clean**                                      | Tanpa akun dan aksi tulis. Parameter rute divalidasi di definisi rute (`:id(\d{1,10})`, slug) dan di `parseListQuery`; nilai tak sah jatuh ke 404 atau bawaan (uji e2e `/dokumen/abc`, parameter berbahaya). Tidak ada `redirect(from/next/returnTo)`; `router.push` hanya dengan jalur tetap dan kueri tervalidasi. ID dokumen/lampiran divalidasi (`opaqueId`) sebelum membentuk URL.                                                                                                                                                       |
| A02 Kriptografi       | **Clean**                                      | Pencarian kunci/rahasia (pola penyedia utama, `password\|secret\|api_key\|token`) di `src`, `dev`, `scripts`, `deploy`, konfigurasi, Gradle: hanya referensi ke `keystore.properties` (di luar repo, di-ignore). `.env` hanya `JDIH_NEWS_FILTER` dan `JDIH_FOOTER_CONTACT` (publik, didokumentasikan). `localStorage` hanya preferensi tampilan/notifikasi (`jdih:tampilan`, `jdih:notifikasi`). HTTPS: konstanta host `https://`; Android `androidScheme=https`, `cleartext=false`, `allowMixedContent=false`, `usesCleartextTraffic=false`. |
| A03 Injeksi / XSS     | **Clean**                                      | `v-html` hanya di `SafeHtml.vue` (DOMPurify allowlist, URI https/mailto/tel); `innerHTML`/`eval`/`new Function`/`document.write` nihil (gerbang statis memaksa). Teks berita lewat `DOMParser` → `textContent`. Query lewat `URLSearchParams`. 12 payload XSS kanonik + halaman uji `/tentang/uji-sanitasi` di peramban: tidak ada kode berjalan. Tidak ada `<script>` JSON-LD. `AppIcon` dan `StateView` memakai `<component :is>` hanya dari data statis.                                                                                   |
| A04 Desain tidak aman | **Clean** (klien); kontrol server **Deferred** | Batas panjang `q`, halaman, dan ukuran respons; pembatalan permintaan usang; batas waktu. Rate limit adalah tugas API (lihat temuan).                                                                                                                                                                                                                                                                                                                                                                                                         |
| A05 Misconfiguration  | Temuan di atas                                 | CSP ketat (`script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), `referrer: no-referrer`, peta sumber mati, font di-host sendiri, tanpa CDN. Manifest Android: `allowBackup=false`, tanpa cleartext, izin hanya INTERNET, FileProvider dipersempit ke cache, R8 aktif pada rilis, WebView debugging hanya di dev. Tidak ada berkas duplikat/sisa.                                                                                                                                                               |
| A06 Komponen rentan   | **Clean**                                      | `npm audit` 0 (root dan `src-capacitor`); runtime: quasar, vue, vue-router, dompurify, @capacitor/app/core.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| A07 Autentikasi       | **N/A**                                        | Tidak ada autentikasi atau sesi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| A08 Integritas data   | **Clean**                                      | Payload API divalidasi runtime (`SchemaError`, allowlist kolom). Lockfile ada; tanpa skrip CDN (SRI tidak relevan). Penandatanganan rilis Android lewat `keystore.properties`.                                                                                                                                                                                                                                                                                                                                                                |
| A09 Logging           | **Clean** dengan catatan                       | Galat global tanpa jejak tumpukan ke pengguna; tanpa analitik/pelacak. Satu-satunya blok `catch` yang menelan galat bersifat degradasi sengaja (gambar berita gagal, perkiraan jumlah filter, papan klip) dan tidak membawa sinyal serangan di sisi klien.                                                                                                                                                                                                                                                                                    |
| A10 SSRF / redirect   | **Clean**                                      | `getJson` memeriksa origin awal dan origin akhir setelah redirect; `credentials: omit`, `referrerPolicy: no-referrer`. `safeExternalUrl` dengan kecocokan host persis menolak: skema non-https, userinfo, `@`-host, port, punycode, titik di akhir host, subdomain palsu, IPv4 (desimal/heksa/oktal), IPv6, IPv4-mapped, metadata cloud, CGNAT, link-local (diuji di `tests/unit/url.test.js`). Klien tidak mengambil URL dari masukan pengguna.                                                                                              |

## Perbaikan selama audit

- Menambah uji bypass allowlist (IP literal, IPv6, metadata, `localhost.`) pada `safeExternalUrl`.
- Menghapus `src/utils/open.js` (kode mati yang membawa `window.open`).
- Mencabut `@vue/test-utils` (menghilangkan 5 peringatan audit dev).

## Rencana perbaikan berurutan

1. **Sebelum rilis produksi:** pasang `deploy/security-headers.conf` dan `deploy/nginx.conf` di server sebenarnya lalu verifikasi `curl -I`; konfirmasi versi MySQL/MariaDB; akun SELECT-only dari `api/db/grants.sql` dibuat pengelola database; cocokkan asumsi data di `api/README.md` dengan isi produksi.
2. **Sebelum rilis Android:** keystore dari pemilik, `appId` final, konfirmasi bahwa tautan luar dibuka di peramban sistem pada perangkat nyata.
3. **Terjadwal:** tinjau ulang CSP `style-src` saat Quasar/Vue mendukung nonce; audit ulang setelah mekanisme notifikasi diputuskan (FCM menambah izin, pihak ketiga, dan layanan pengirim).

## Lampiran: audit API (`api/`)

- **Cakupan:** `api/src`, `api/db`, `api/scripts`, `api/test`, `api/Dockerfile`, `deploy/nginx.conf`, `deploy/docker-compose.yml`, `deploy/.env.example`, `deploy/render-grants.sh`. Node 24, Fastify 5.12, mysql2 3.24, sanitize-html 2.18.
- **Metode:** pencarian pola per kategori dan bacaan mendalam pada setiap sink (SQL, berkas, HTML, jaringan keluar); 54 tes (53 lulus, 0 gagal, 1 dilewati bersyarat bila `TEST_DB_URL` kosong); uji nyata pembatas laju di belakang nginx 1.28 dengan `X-Forwarded-For` palsu (dengan kontrol positif); fuzz 319 permintaan (SQLi, `%`/`_`, `__proto__`, bilangan tak hingga, jalur traversal, Unicode, metode tulis) pada instance dengan batas laju longgar; uji nyata API di belakang nginx 1.28 (header, `X-Accel-Redirect`, `limit_except`); inspeksi header dan CORS di kabel; 45 pemeriksaan peramban terhadap API nyata; `npm audit` (0).
- **Catatan kejujuran:** peninjau sama dengan pembangun, jadi bias yang berkorelasi masih mungkin. Dua temuan MEDIUM (IP klien pada batas laju dan `akses_lampiran` daftar-tolak) lolos dari audit saya dan baru ditemukan oleh tinjauan keamanan otomatis atas commit yang sudah di-push; baris "Clean" untuk A01 dan A04 pada audit awal keliru dan telah dikoreksi di bawah. Itu bukti bahwa audit mandiri tidak cukup: tinjauan pihak lain atas kode ini tetap dianjurkan sebelum rilis. Putaran fuzz pertama menghasilkan temuan palsu dari alat uji sendiri (pola kebocoran `ER_` cocok dengan `per_page`; batas laju 429 membuat sisa pemeriksaan tidak bermakna). Keduanya diperbaiki dan fuzz diulang; hanya hasil ulang yang dilaporkan di sini. Data yang diuji sintetis dan dump contoh 4 dokumen, bukan data produksi.
- **Putaran kedua (deploy Docker):** image dan compose dibangun dan diuji pada Docker Desktop 29.8.2 (Windows + WSL2) dengan jaringan `baota_net` tiruan 172.29.0.0/16, `mysql:8.4` (8.4.11), `node:24-alpine` (v24.22.3), dan nginx 1.28.2 sungguhan. Tes API (60: 59 lulus, 0 gagal, 1 dilewati bersyarat) dijalankan dari dalam jaringan itu sebagai uid 1000, juga pada empat `sql_mode`. Unduhan lewat volume read-only, batas laju (lima skenario dengan dua pengunjung beralamat asal berbeda dan kontrol positif), dan pengerasan container diuji pada container yang berjalan; feed situs berjalan dibaca dan dicocokkan dengan dump. Peninjau tetap sama dengan pembangun. Dua cacat nyata (header galat unduhan dan `EACCES`) lolos dari tes unit dan baru terlihat saat uji di Docker; satu mutasi saya sendiri salah bangun (backslash terpangkas oleh lapisan shell, sehingga SQL tidak valid dan tes gagal di mode normal), hasilnya dibuang dan mutasi diulang dari berkas git HEAD.

### Temuan (semua diperbaiki; yang bertanda Accepted Risk diterima dan dijelaskan)

#### [MEDIUM] A04/API4: IP klien pada pembatas laju dapat dipalsukan lewat `X-Forwarded-For` (Fixed)

**File:** `api/src/config.js`, `api/src/server.js`, `deploy/nginx.conf`
**Deskripsi:** `TRUST_PROXY=1` dipetakan ke `trustProxy: true` ("percaya semua hop") dan nginx memakai `$proxy_add_x_forwarded_for` (menambahkan di kanan nilai kiriman klien). Pembatas laju memakai `req.ip`, yaitu entri **paling kiri**, yang dikendalikan klien: mengganti `X-Forwarded-For` tiap permintaan menghindari batas laju sepenuhnya. Ditemukan oleh tinjauan keamanan otomatis atas commit yang sudah di-push; lolos dari audit saya sebelumnya karena uji batas laju hanya langsung ke API, tidak lewat proxy dengan header palsu.
**Perbaikan:** (1) `TRUST_PROXY` kini berupa alamat proxy tepercaya (`loopback`, atau IP/CIDR); `true`, angka, dan `/0` ditolak saat start. IP klien diambil dari kanan (entri terakhir yang bukan proxy tepercaya), header dari soket non-proxy diabaikan. (2) nginx menimpa header: `X-Forwarded-For $remote_addr`. **Catatan:** percobaan pertama saya memakai bentuk angka (`1` = satu hop) berdasarkan asumsi tentang semantik Fastify; diukur langsung, bentuk angka tidak berperilaku demikian (IP klien jatuh ke alamat nginx dan semua orang berbagi satu keranjang), sehingga tes pertama sempat lulus karena alasan yang salah. Desain diganti ke daftar alamat, yang benar pada tiga skenario terukur (nginx menambah, nginx menimpa, klien langsung memalsukan).
**Bukti:** 4 tes baru (`api/test/ratelimit.test.js`, tanpa database), termasuk pelindung terhadap lulus karena alasan salah (klien berbeda mendapat keranjang berbeda) dan penolakan nilai berbahaya; mutasi `trustProxy=true` membuat 3 tes gagal. Uji nyata API + nginx 1.28 dengan klien non-loopback dan `X-Forwarded-For` berbeda tiap permintaan (batas 5/menit): arahan baru 4×200 lalu 8×429; arahan nginx lama + perbaikan API saja juga 8×429 (berlapis); kontrol positif (API mempercayai IP klien sendiri) 12×200, membuktikan uji mampu mendeteksi pemalsuan.

#### [MEDIUM] A01: `akses_lampiran` dinilai dengan daftar-tolak, nilai tak dikenal dilayani (Fixed)

**File:** `api/src/files.js`, `api/src/sql.js`
**Deskripsi:** `isRestricted` hanya menolak bila `akses_lampiran` memuat kata tertentu (`tertutup`, `terbatas`, ...). Nilai yang tidak diperkirakan ("Hanya anggota", "login", "1", "tidak terbuka") dilayani (gagal-terbuka). Pola yang sama ada pada filter terbit: `sembunyikan_di_opac` bernilai di luar `ya/1/y/true` (mis. "iya", "disembunyikan") membuat dokumen terbit. Nilai data produksi belum diketahui, jadi daftar-tolak tidak aman. Ditemukan oleh tinjauan otomatis yang sama (butir pertama); filter terbit saya tambahkan karena akar masalahnya sama.
**Perbaikan:** daftar-izin, gagal-tertutup. Lampiran dilayani hanya bila `akses_lampiran` kosong, `-`, atau `terbuka/open/publik/public/umum/bebas` **dan** `pembatasan_lampiran` kosong, `-`, atau menyatakan tanpa pembatasan. Dokumen terbit hanya bila `sembunyikan_di_opac` kosong atau `-/0/n/no/tidak/tdk/false`. Akibat samping yang disengaja: bila data produksi memakai kata lain untuk "terbuka", lampiran atau dokumen tampak hilang (terlihat dan mudah disesuaikan), bukan bocor.
**Bukti:** tes `isRestricted` diperluas (13 nilai dibatasi, 10 nilai terbuka); tes baru terhadap MySQL untuk filter terbit (9 nilai terbit, 10 nilai tersembunyi); mutasi kembali ke daftar-tolak membuat tes gagal.

#### [INFO] A05: `grants.sql` tidak memperbarui sandi akun yang sudah ada (Fixed)

**File:** `api/db/grants.sql`
**Deskripsi:** `CREATE USER IF NOT EXISTS` tidak mengubah sandi akun yang sudah ada, sehingga menjalankan ulang templat dengan sandi baru diam-diam mempertahankan sandi lama (terlihat saat tes ulang: akses ditolak dengan sandi yang baru diberikan). **Perbaikan:** `ALTER USER ... IDENTIFIED BY` setelahnya (idempoten).

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

#### [LOW] A05/API8: respons galat unduhan membawa header unduhan dan cache publik (Fixed)

**File:** `api/src/routes.js`, `api/src/server.js`
**Deskripsi:** Rute unduhan mengatur `Content-Disposition: attachment`, `Content-Type`, dan `Cache-Control: public, max-age=300` sebelum berkas dibuka. Bila berkas tidak ada (404) atau gagal dibuka (500), respons galat `problem+json` tetap membawanya: peramban yang membuka tautan unduhan menyimpan JSON galat sebagai "nama.pdf" (berkas rusak), dan perantara boleh menyimpan galat itu 5 menit. Hook `onSend` juga memberi `public, max-age=60` ke semua respons termasuk 429 dan 500; bila kelak ada CDN atau cache di depan API, 429 milik satu klien dapat disajikan ke semua orang. Tidak membocorkan data. Ditemukan pada uji Docker (nama ada di database tetapi tidak ada di volume).
**Perbaikan:** header unduhan baru diatur setelah berkas terbukti terbuka; semua respons ≥ 400 membawa `Cache-Control: no-store`.
**Bukti:** tes baru (galat unduhan, 429); mutasi (hook dimatikan: 2 tes gagal; header sebelum berkas: 1 tes gagal); diulang pada container: 404/500/400 tanpa `Content-Disposition` dan `no-store`, sukses tetap `public, max-age=300`.

#### [LOW] A05: berkas ada tetapi tak terbaca menjadi galat di tengah respons (Fixed)

**File:** `api/src/files.js`
**Deskripsi:** `createReadStream` membuka berkas secara asinkron setelah `openLocal` kembali, sehingga `EACCES` (mis. berkas 0600 milik uid lain pada volume) muncul setelah respons disiapkan: 500 dengan header unduhan, dan jalur berkas di log. Pada produksi (berkas ditulis `ildis_app`, API berjalan sebagai uid 1000) ini skenario yang wajar. Badan 500 sudah generik; jalur hanya di log server.
**Perbaikan:** `openLocal` membuka berkas lebih dulu (`open` dengan `O_NOFOLLOW`, `stat` pada handle, aliran dari handle). Tidak ada, bukan berkas biasa, di luar folder, atau symlink menghasilkan 404; `EACCES`/`EPERM` dilempar sebagai 500 generik yang terlihat di log dan pemantau, bukan 404 yang menyamarkan salah izin.
**Bukti:** tes (hanya bermakna untuk non-root POSIX; dijalankan sebagai uid 1000); mutasi yang menelan `EACCES` membuat tes gagal; pada container: 500 generik, `no-store`, `EACCES` di log, tanpa jalur di badan.

#### [LOW] A05: `LIKE ... ESCAPE '\\'` gagal pada `sql_mode` `NO_BACKSLASH_ESCAPES` (Fixed)

**File:** `api/src/repo.js`, `api/src/util.js`
**Deskripsi:** `my.cnf` kustom MySQL Baota tidak terlihat, jadi tes dijalankan pada beberapa `sql_mode`. Bawaan 8.4, kosong, dan `ANSI` (termasuk `ANSI_QUOTES`, `PIPES_AS_CONCAT`, `IGNORE_SPACE`) lulus. `NO_BACKSLASH_ESCAPES` membuat `'\\'` menjadi dua karakter sehingga pencarian teks dan filter subjek berujung 500 (masalah ketersediaan; kueri tetap terparameter, bukan injeksi).
**Perbaikan:** karakter escape `|` (`ESCAPE '|'`, `likeEscape` meloloskan `%`, `_`, `|`).
**Bukti:** tes unit dan tes DB yang memaksa mode itu pada satu koneksi (dengan pemeriksaan bahwa mode benar-benar aktif). Kode lama pada server ber-`NO_BACKSLASH_ESCAPES`: 5 tes gagal; kode baru pada server yang sama: 59 lulus, 0 gagal.

#### [INFO] A05: daftar pengalihan bawaan mengirim semua unduhan data sekarang ke host BPHN (Resolved di konfigurasi)

**File:** `api/src/config.js` (bawaan `FILE_REDIRECT_HOSTS`), `deploy/docker-compose.yml`
**Deskripsi:** Pada keempat baris `data_lampiran` di dump (dan feed), `url_lampiran` adalah URL penuh ke `bphn.jdihn.go.id` (sisa templat), padahal berkas yang sama ada di situs DPRD. Dengan daftar bawaan kode semua unduhan dialihkan (302) ke host eksternal: bukan celah keamanan (host ada di allowlist), tetapi unduhan jadi bergantung pada pihak lain dan volume lokal tidak terpakai.
**Perbaikan:** compose mengosongkan daftar sehingga berkas dibaca dari volume memakai nama berkasnya; kode bawaan tidak diubah. **Bukti:** pada dump asli, daftar kosong menghasilkan 200 `application/pdf` (4 dari 4), daftar bawaan 302 ke BPHN (2 dari 2 yang dicoba). Akibat yang diterima: berkas yang tidak ada di volume menghasilkan 404, tanpa cadangan ke BPHN.

#### [INFO] A04: port yang dipublikasikan ke loopback menjadikan host sebagai batas kepercayaan (Accepted Risk)

**Deskripsi:** `TRUST_PROXY` berisi gateway `baota_net`, yaitu alamat asal sambungan dari nginx host. Proses apa pun di host (atau container `network_mode: host`) yang dapat menjangkau `127.0.0.1:PORT` juga tampak sebagai proxy tepercaya dan dapat memalsukan `X-Forwarded-For`. Container lain di `baota_net` tidak dipercaya (soketnya bukan gateway; diuji, skenario E). **Mitigasi:** port hanya di loopback (diuji: alamat LAN dan WSL ditolak) dan batas ini sama dengan akses administrator ke nginx. **Residual:** diterima.

### Per kategori (API)

| Kategori              | Status                                                                                                                                                           | Yang diperiksa                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Access control    | Satu temuan, diperbaiki (`akses_lampiran` daftar-tolak)                                                                                                          | Tanpa akun dan aksi tulis. Dokumen draf atau tersembunyi (ID 10 dan 11 pada data uji) tidak muncul di daftar, detail, relasi, dan statistik; detail 404. Lampiran harus milik dokumen yang diminta (`l.id_dokumen = ?`) dan dokumen harus terbit; lampiran nonaktif, terbatas, atau berhost tidak diizinkan tidak dilayani. Parameter jalur berpola ketat (400). |
| A02 Kriptografi       | **Clean**                                                                                                                                                        | `DB_URL` hanya dari lingkungan; tidak ada rahasia atau kata sandi uji di berkas repo (pencarian). HSTS pada API; TLS di nginx.                                                                                                                                                                                                                                   |
| A03 Injeksi / XSS     | **Clean**                                                                                                                                                        | Prepared statement (`execute`). Interpolasi ke teks SQL hanya konstanta, kunci enum (`sort`, `tipe`, `status`) dan bilangan bulat tervalidasi; `LIKE` di-escape dengan `ESCAPE '\|'` (tidak bergantung pada `sql_mode`). `sanitize-html` allowlist untuk HTML. Tanpa `eval`, `exec`, `child_process`, `new Function` (pencarian).                                |
| A04 Desain tidak aman | Dua temuan, diperbaiki (koersi Ajv; IP klien pada batas laju); satu risiko diterima (port loopback = batas host)                                                 | Batas laju per IP, `bodyLimit` 1 KiB, `per_page` ≤ 50, `page` ≤ 1000, `q` 2 sampai 100 karakter, `maxParamLength` 200 (414).                                                                                                                                                                                                                                     |
| A05 Misconfiguration  | Delapan temuan, semua diperbaiki (CSP helmet, nginx, persen-encoding, skrip data uji, header galat unduhan, `EACCES`, `NO_BACKSLASH_ESCAPES`, daftar pengalihan) | Header penuh dan CORS diperiksa di kabel; metode selain GET/HEAD/OPTIONS 405; tanpa `X-Powered-By`; peringatan deprekasi Fastify dibersihkan. Container: non-root, `CapEff=0`, `no-new-privileges`, root FS read-only, volume dokumen read-only, port hanya di loopback (diuji pada container yang berjalan).                                                    |
| A06 Komponen rentan   | **Clean**                                                                                                                                                        | `npm audit` 0 (dengan dan tanpa dev).                                                                                                                                                                                                                                                                                                                            |
| A07 Autentikasi       | **N/A**                                                                                                                                                          | Tidak ada autentikasi.                                                                                                                                                                                                                                                                                                                                           |
| A08 Integritas data   | **Clean**                                                                                                                                                        | Lockfile; keluaran dibatasi skema respons (allowlist kolom); HTML dari database disanitasi.                                                                                                                                                                                                                                                                      |
| A09 Logging           | **Clean** dengan catatan                                                                                                                                         | Log terstruktur dengan redaksi `authorization` dan `cookie`; galat internal dicatat tanpa SQL atau jalur ke klien. Log permintaan memuat IP klien (data operasional): atur retensi di server.                                                                                                                                                                    |
| A10 SSRF / redirect   | **Clean**                                                                                                                                                        | API tidak melakukan permintaan jaringan keluar (pencarian `fetch`/`http.request`/`axios`: nihil). Satu-satunya pengalihan adalah lampiran ke host allowlist yang cocok persis, `https`, tanpa userinfo dan port.                                                                                                                                                 |
| OWASP API Top 10      | **Clean**                                                                                                                                                        | API1 (lampiran terikat ke dokumen), API3 (skema respons = allowlist), API4 (batas sumber daya), API5 (tanpa fungsi admin, metode tulis ditolak), API8 (header, CORS), API9 (`openapi.yaml`: 11 jalur cocok dengan rute).                                                                                                                                         |

### Yang tidak dapat dibuktikan di sini

- Isi data produksi: feed dan dump hanya memuat 4 dokumen contoh, jadi nilai `sembunyikan_di_opac`, `akses_lampiran`, `pembatasan_lampiran`, bentuk `url_lampiran` untuk unggahan DPRD yang sebenarnya, dan awalan `judul` belum terlihat.
- Lingkungan Baota: nginx Baota sungguhan, `my.cnf` kustom (hanya `sql_mode` bawaan, kosong, `ANSI`, dan `NO_BACKSLASH_ESCAPES` yang diuji; karakter set server selain `utf8mb4` tidak), `ildis_cron`, izin berkas yang ditulis `ildis_app`, dan perilaku port yang dipublikasikan di Linux (alamat gateway diamati pada Docker Desktop; di Linux harus diamati ulang).
- MariaDB (hanya MySQL 8.4 yang diuji); header pada server sebenarnya; perilaku Chromium untuk header ganda (lihat temuan nginx); mode `stream` pada beban tinggi; TLS antara API dan MySQL (tidak dipakai di jaringan Docker).

## Lampiran: audit penyatuan jalur di satu hostname (nginx + SPA)

- **Cakupan:** `deploy/baota-locations.conf`, `deploy/nginx.conf`, `deploy/security-headers.conf`, `deploy/.env.example` (CORS/TRUST_PROXY), `docs/deploy/frontend-baota.md`, `tests/e2e/real-api.mjs` (alat uji), perbandingan rute SPA (`src/router/routes.js`) dengan URL lama `ildis_app`.
- **Metode:** konfigurasi diuji pada nginx 1.28.2 sungguhan (73 pernyataan) dengan SPA hasil build, API Docker (compose asli) dan stub `ildis_app`, ditambah location regex gaya Baota; tes statis konfigurasi (`tests/unit/nginx-config.test.js`, `tests/unit/csp-selaras.test.js`) dengan 8 mutasi yang semuanya tertangkap; 5 skenario batas laju lewat konfigurasi baru (dua pengunjung beralamat asal berbeda, kontrol positif); e2e Chrome pada build produksi tanpa diubah (origin API tertanam `https://jdih.dprd.singkawangkota.go.id` dipetakan ke nginx uji, situs produksi tidak disentuh): 45/45 pada satu hostname dan 45/45 dari origin sementara, 8/8 pemeriksaan "tanpa pelanggaran CSP" bersih; e2e dev: `npm run test:e2e` 278/278 (API palsu) dan `real-api.mjs` 45/45 (API Docker) pada server dev terisolasi. Pemindaian rahasia dan alamat pada berkas yang diubah: nihil.
- **Catatan kejujuran:** peninjau sama dengan pembangun. Dua hal di bawah ditemukan oleh uji saya sendiri sebelum commit (bukan oleh pihak lain), dan vhost produksi tidak tersedia, jadi bagian yang bergantung padanya adalah dasar, bukan bukti.

### Temuan

#### [LOW] A05: location regex bawaan Baota dapat mengalahkan location awalan dan mencuri jalur proxy (Mitigated by design, terbukti)

**File:** `deploy/baota-locations.conf`
**Deskripsi:** Di nginx, location regex (`~`) menang atas location awalan biasa. Vhost Baota lazimnya memuat regex untuk cache statis (`.js`, `.css`, `.png`, ...) dan penolak dotfile. Bila `/backend`, `/feed/`, `/common/dokumen/` ditulis tanpa `^~`, permintaan seperti `/backend/assets/app.js` dan `/common/dokumen/logo.png` dilayani dari root SPA, bukan dari `ildis_app`: dashboard kehilangan aset dan logo/PDF feed tidak sampai. Bukan celah langsung, tetapi kegagalan ketersediaan yang senyap pada hari peralihan.
**Perbaikan:** semua location awalan memakai `^~`; dijaga tes statis.
**Bukti:** pada konfigurasi tanpa `^~` (mutasi) uji nginx nyata menunjukkan kedua jalur dicuri regex; dengan `^~` keduanya dijawab `ildis_app` dan tanpa `expires` dari regex. Penghapusan `^~` dari `/backend` membuat 3 tes statis gagal. **Batas:** pola regex Baota di uji adalah perkiraan, bukan salinan vhost Anda.

#### [LOW] A04: jalan kembali (rollback) pada rancangan awal tidak lengkap (Fixed sebelum commit)

**File:** `deploy/baota-locations.conf`
**Deskripsi:** Rancangan pertama hanya meminta `location /` SPA dikomentari saat rollback. `location ^~ /assets/` SPA akan tetap menimpa `/assets/` milik situs lama, sehingga situs lama kembali tanpa CSS/JS setelah rollback. Ditemukan saat merancang uji rollback.
**Perbaikan:** ketiga location SPA satu paket (`SPA-MULAI ... SPA-SELESAI`) dan blok `LAMA-MULAI ... LAMA-SELESAI` untuk `location /` lama; prosedur dan uji mengikuti penanda itu.
**Bukti:** uji rollback nyata (prosedur dokumen diterapkan pada salinan konfigurasi): `/`, `/dokumen/1-tesla`, `/assets/...` dan `/index.html` kembali dilayani `ildis_app`, `/api/` dan `/backend` tetap jalan; tes statis memeriksa penanda.

#### [INFO] A05: `add_header` tingkat server pada vhost lama diwarisi location yang tidak punya `add_header` (Accepted, didokumentasikan)

**File:** `deploy/baota-locations.conf`
**Deskripsi:** Header keamanan SPA di-include hanya di location SPA, dan karena itu menggantikan header tingkat server di sana (tidak ada CSP ganda di SPA). Sebaliknya `/backend`, `/feed/`, `/common/dokumen/` terus mewarisi header lama (perilaku sekarang dipertahankan), dan `/api/` ikut mewarisinya sehingga respons API bisa memuat header ganda (CSP/XFO) bila vhost lama punya header itu. CSP ganda hanya memperketat (irisan kebijakan; API sudah `default-src 'none'`), tetapi tidak rapi.
**Bukti:** uji varian dengan `add_header X-Legacy...` di tingkat server: tidak bocor ke SPA, terwarisi di `/backend`, `/feed/`, `/api/`. **Tindak lanjut:** periksa `curl -I https://HOST/api/v1/ringkasan` sesudah Tahap 1 (`docs/deploy/frontend-baota.md`).

#### [INFO] A05: `limit_except GET HEAD` pada `/api/` juga menolak preflight `OPTIONS` (Accepted)

**Deskripsi:** Permintaan CORS non-sederhana akan ditolak nginx (403) sebelum sampai ke API. Klien saat ini hanya mengirim `Accept` dan `credentials: 'omit'` (permintaan sederhana, tanpa preflight), jadi tidak ada dampak sekarang; bila kelak ada header khusus, `limit_except` harus dilonggarkan dengan sengaja.
**Bukti:** `OPTIONS /api/v1/ringkasan` dari origin `https://localhost` menjawab 403; e2e 45/45 (termasuk dari origin sementara, lintas-origin) tanpa preflight.

#### [INFO] A01/A05: SPA, API, dan dashboard admin lama berbagi satu origin (Accepted Risk, keputusan arsitektur)

**Deskripsi:** XSS di SPA kini berada di origin yang sama dengan `/backend`; cookie `HttpOnly` tidak mencegah permintaan same-origin dari skrip. Dashboard memakai CSP longgar (`unsafe-inline`, `unsafe-eval`, `cdn.jsdelivr.net`), jadi batas keamanannya adalah ketahanan SPA terhadap XSS (CSP `script-src 'self'`, DOMPurify, gerbang statis; audit klien: tidak ada sink HTML mentah di luar `SafeHtml.vue`). Klien memanggil API dengan `credentials: 'omit'`, sehingga cookie sesi `ildis_app` (`HttpOnly; Secure; SameSite=Lax; path=/` pada feed saat ini) tidak ikut terkirim oleh kode SPA; navigasi ke tautan unduh same-origin tetap mengirim cookie, dan API mengabaikannya (log meredaksi `cookie`).
**Header ke peramban:** CSP SPA (`frame-ancestors 'none'`, XFO `DENY`) hanya pada location SPA; pembingkaian halaman produksi dari origin lain ditolak peramban (terbukti dengan induk tanpa CSP).

#### [INFO] A04: tautan lama bentrok dengan rute SPA (ketersediaan, usulan belum diterapkan)

**Deskripsi:** Setelah `/` pindah ke SPA, `/dokumen/<id>-<slug>` (dimuat feed sebagai `urlDetailPeraturan`), `/dokumen/download?...`, `/dokumen/<tipe>`, `/berita/index`, dan `/site/<halaman>` menampilkan "tidak ditemukan" (status 200). Bukan celah, tetapi memutus tautan yang beredar, termasuk yang dipakai pihak lain dari feed. Usulan pengalihan 301 di nginx sudah dirancang dan diuji (11 kasus) tetapi TIDAK dipasang di `deploy/` sebelum disetujui; lihat `docs/deploy/frontend-baota.md`, bagian 7.

#### [INFO] A05: header proxy ke `ildis_app` belum dicocokkan dengan vhost produksi

**Deskripsi:** Vhost produksi tidak tersedia saat pengerjaan. Baris proxy di antara penanda `SALIN-DARI-VHOST-LAMA` adalah dasar umum Baota (`X-Forwarded-For $proxy_add_x_forwarded_for` menambah, tidak menimpa, dan `X-Forwarded-Proto` sengaja tidak ditambahkan agar rantai pengalihan `/backend` tidak berubah). Jika aplikasi lama memakai `X-Forwarded-For` (mis. pembatasan login per IP), awalan kiriman klien bisa dipalsukan; ini sama seperti sebelum peralihan, tetapi tidak dapat diverifikasi di sini.

### Per kategori (penyatuan jalur)

| Kategori              | Status                                                       | Yang diperiksa                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Access control    | Satu risiko diterima (satu origin dengan `/backend`)         | Metode `/api/` dibatasi di nginx (POST/PUT/DELETE/PATCH/OPTIONS 403); `/backend` tidak diubah.                                                                          |
| A02 Kriptografi       | **Clean**                                                    | Pemindaian rahasia dan alamat pada berkas yang diubah: nihil; `deploy/.env.example` hanya berisi penanda `GANTI_...`; tidak ada sandi lama aplikasi di berkas mana pun. |
| A03 Injeksi / XSS     | **Clean**                                                    | CSP `<meta>` dan header selaras (tes); tanpa perubahan kode klien; e2e tanpa pelanggaran CSP.                                                                           |
| A04 Desain tidak aman | Satu temuan diperbaiki (rollback), satu usulan (tautan lama) | Lihat di atas.                                                                                                                                                          |
| A05 Misconfiguration  | Satu mitigasi terbukti (`^~`), empat catatan INFO            | Lihat di atas.                                                                                                                                                          |
| A06 Komponen rentan   | **Clean**                                                    | Tidak ada dependensi baru.                                                                                                                                              |
| A07 Autentikasi       | **N/A**                                                      | `/backend` milik aplikasi lama dan di luar cakupan.                                                                                                                     |
| A08 Integritas data   | **N/A**                                                      | Tidak ada perubahan.                                                                                                                                                    |
| A09 Logging           | **Clean**                                                    | Tidak ada perubahan log; nginx mencatat akses seperti sebelumnya.                                                                                                       |
| A10 SSRF / redirect   | **Clean**                                                    | Usulan pengalihan memakai `https://$host/...` dengan sasaran tetap (angka tervalidasi), tanpa nilai yang dikendalikan pengguna selain ID numerik.                       |

### Yang tidak dapat dibuktikan di sini

- nginx Baota sungguhan: sertifikat, include, vhost, dan proxy terbalik Baota yang bisa menangkap `/` di luar editor "Config".
- Perilaku `ildis_app` sebenarnya (stub hanya meniru yang disebutkan), `ildis_cron`, pembuatan feed, dan JDIHN.
- HTTP/2 dan HTTP/3, perangkat Android sungguhan, dan beban tinggi.
