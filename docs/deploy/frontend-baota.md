# Deploy frontend (SPA) dan penyatuan jalur di satu hostname (aaPanel/Baota)

Dokumen ini melengkapi bagian Docker di [`api/README.md`](../../api/README.md) (API sebagai container).
Semua nilai produksi memakai penanda `GANTI_...`; tidak ada nilai produksi di repo (repo publik).

## 1. Arsitektur

Satu hostname produksi, `jdih.dprd.singkawangkota.go.id`, tanpa subdomain baru. nginx adalah nginx Baota
**di host** (bukan container). Origin API di klien (`src/config/hosts.js`) sudah hostname ini, jadi
tidak ada variabel `.env` klien baru.

| Jalur                                           | Tujuan                                         | Metode          | Header keamanan SPA |
| ----------------------------------------------- | ---------------------------------------------- | --------------- | ------------------- |
| `/api/`                                         | `127.0.0.1:3000` (container `jdih_api`)        | hanya GET, HEAD | tidak               |
| `/backend`                                      | `127.0.0.1:8080` (container `ildis_app`)       | semua           | tidak               |
| `/feed/`                                        | `127.0.0.1:8080` (feed JSON, `ildis_cron`)     | semua           | tidak               |
| `/common/dokumen/`                              | `127.0.0.1:8080` (logo, avatar, PDF feed)      | semua           | tidak               |
| `/assets/`, `/index.html`, `/` (selain di atas) | SPA statis (`dist/spa`), fallback `index.html` | GET, HEAD       | **ya**              |

Berkas konfigurasi: [`deploy/baota-locations.conf`](../../deploy/baota-locations.conf) (hanya `location`, untuk
ditempel ke editor "Config" situs), [`deploy/security-headers.conf`](../../deploy/security-headers.conf), dan
[`deploy/nginx.conf`](../../deploy/nginx.conf) (vhost lengkap untuk nginx di luar Baota, hanya membungkus
berkas pertama).

Tiga aturan di `baota-locations.conf` (dijaga oleh `tests/unit/nginx-config.test.js` dan terbukti perilakunya
di bagian 7):

1. Semua location awalan memakai `^~`. Vhost Baota lazimnya punya location regex (cache `.js/.css/.png`,
   tolak dotfile) yang menang atas awalan biasa dan mencuri `/backend/assets/x.js` serta
   `/common/dokumen/logo.png`.
2. Header keamanan SPA hanya di-include di location SPA, di tiap location itu. nginx mewarisi `add_header`
   tingkat server ke location yang tidak punya `add_header` sendiri; CSP SPA (`script-src 'self'`) merusak
   dashboard `/backend` yang memuat skrip dari `cdn.jsdelivr.net`.
3. `proxy_pass` ke `ildis_app` tanpa URI, jadi jalur `/backend...` tidak dipotong.

## 2. Yang harus Anda isi dari server sendiri

| Nilai                                                        | Dari mana                                                                                                                                                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway dan subnet `baota_net` (`TRUST_PROXY`, host akun DB) | `docker network inspect baota_net --format '{{range .IPAM.Config}}subnet={{.Subnet}} gateway={{.Gateway}}{{end}}'`, lalu amati ulang lewat `docker logs jdih_api` (lihat `api/README.md`) |
| Baris proxy ke `ildis_app` dan `client_max_body_size`        | vhost situs sekarang (bagian di antara `SALIN-DARI-VHOST-LAMA` di `baota-locations.conf`). Isi bawaan hanyalah dasar yang umum di Baota dan BELUM dicocokkan dengan vhost Anda.           |
| Blok `location /` lama                                       | vhost sekarang (untuk blok `LAMA-MULAI`, jalan kembali)                                                                                                                                   |
| `JDIH_FOOTER_CONTACT`                                        | alamat/kontak footer asli; kosong = kolom Kontak tidak tampil                                                                                                                             |
| Jalur root SPA, jalur berkas `jdih-security-headers.conf`    | bebas; contoh di bawah memakai `/www/wwwroot/jdih-spa` dan `/www/server/nginx/conf/`                                                                                                      |

## 3. Build (di mesin pengembang atau CI)

```bash
cp .env.example .env     # lalu isi:
#   JDIH_NEWS_FILTER=produk hukum,peraturan daerah,dprd
#   JDIH_FOOTER_CONTACT=GANTI_ALAMAT_DAN_KONTAK        (kosong = kolom Kontak tidak tampil)
npm ci
npm run check            # format, lint, gerbang keamanan, tes unit
npm run build            # hasil: dist/spa (nilai .env DITANAM ke bundel: PUBLIK)
```

Mengganti `.env` berarti build ulang. Pastikan `dist/spa/index.html` memuat CSP `<meta>` dan jangan
mengubah `src/config/hosts.js` (origin API produksi).

## 4. Pasang berkas di server

```bash
# di server (nginx Baota berjalan sebagai pengguna `www`)
mkdir -p /www/wwwroot/jdih-spa                         # direktori KHUSUS, kosong dari berkas lain
rsync -a --delete dist/spa/ /www/wwwroot/jdih-spa/     # atau scp/tar dari mesin build
chown -R root:www /www/wwwroot/jdih-spa                # pemilik root; nginx hanya membaca
find /www/wwwroot/jdih-spa -type d -exec chmod 755 {} +
find /www/wwwroot/jdih-spa -type f -exec chmod 644 {} +
cp deploy/security-headers.conf /www/server/nginx/conf/jdih-security-headers.conf
```

Rilis berikutnya: bangun ulang, `rsync --delete` ke direktori baru lalu tukar (mis. `jdih-spa.NEW` ->
`jdih-spa`) agar tidak ada keadaan setengah-tersalin; `index.html` tidak di-cache, aset berhash di-cache
setahun.

## 5. Sebelum Tahap 3 (peralihan `/`): yang HARUS Anda cek

Keputusan penting ada di sini: begitu `/` pindah ke SPA, URL lama yang dilayani `ildis_app` berubah arti.

1. **Siapa yang membaca `/feed/` dan `/common/dokumen/`?** Log yang pendek (tanpa rotasi) tidak
   membuktikan "tidak ada". JDIHN (BPHN) atau pihak lain bisa membaca `feed/document.json` berkala.
   Periksa seluruh log yang tersedia, dan tanyakan ke pengelola JDIHN apakah URL feed Anda terdaftar:

   ```bash
   LOG='/www/wwwlogs/GANTI_NAMA_SITUS.log*'
   zcat -f $LOG | grep -E '"(GET|HEAD) /feed/' | awk '{print $1}' | sort | uniq -c | sort -rn | head
   zcat -f $LOG | grep -E '"(GET|HEAD) /feed/' | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head
   ```

   Kedua jalur itu TETAP diteruskan ke `ildis_app` setelah peralihan, jadi pembacaan feed dan PDF
   tidak putus. Yang berubah adalah **isi tautan di dalam feed** (butir 2).

2. **Tautan lama yang beredar.** Feed memuat `urlDetailPeraturan` berbentuk `/dokumen/<id>-<slug>`
   (relatif ke hostname ini), yang dipakai pihak lain (mis. portal JDIHN) sebagai tautan ke detail
   dokumen. Rute SPA hanya `/dokumen/<id>` (`\d{1,10}`), jadi `/dokumen/1-tesla` menampilkan halaman
   "tidak ditemukan". Hal yang sama untuk tautan unduh `/dokumen/download?id=...&docId=...`, daftar
   `/dokumen/peraturan` dst., dan `/site/...` (tabel di bagian 6). Lihat jalur paling sering diminta:

   ```bash
   zcat -f $LOG | awk '{print $7}' | sed 's/?.*//' | sort | uniq -c | sort -rn | head -50
   ```

3. **Apa yang menangkap `/` sekarang.** Cari di vhost `location /`, `location ^~ /`, dan baris `include`
   ke `.../vhost/nginx/proxy/GANTI_NAMA_SITUS/*.conf` (proxy terbalik Baota). Bila `/` dikelola proxy
   terbalik Baota, blok itu TIDAK terlihat di editor "Config": nonaktifkan lewat panel (Reverse proxy)
   atau `location ^~ /` akan terus menang atas `location /` SPA dan SPA tidak pernah tampil.

4. **Berkas di akar yang dilayani situs lama**: `robots.txt`, `sitemap.xml`, `favicon.ico`, `/images/*`.
   Setelah peralihan, jalur yang tidak ada di `dist/spa` jatuh ke `index.html` (HTML, status 200). Periksa:

   ```bash
   zcat -f $LOG | grep -E ' /(robots\.txt|sitemap\.xml|favicon\.ico|images/)' | awk '{print $7}' | sort | uniq -c | sort -rn | head
   ```

   Bila `robots.txt` atau `sitemap.xml` dipakai, sediakan berkasnya (di `public/` lalu build ulang).

5. **`/site/login`** (halaman login di luar `/backend`) dan alur admin lain di luar `/backend`: pastikan tidak ada.

6. **`add_header` tingkat server di vhost lama** (mis. CSP/HSTS/X-Frame-Options). Header itu terus
   dibawa `/backend`, `/feed/`, `/common/dokumen/` (perilaku sekarang dipertahankan) dan juga `/api/`
   (header ganda di respons API). Lihat `curl -I https://HOST/api/v1/ringkasan` sesudah Tahap 1.

## 6. Urutan peralihan bertahap

Cadangkan vhost dulu: `cp /www/server/panel/vhost/nginx/GANTI_NAMA_SITUS.conf ~/GANTI_NAMA_SITUS.conf.bak-$(date +%F)`.
Perubahan lewat editor "Config" Baota: simpan, lalu `nginx -t` dan reload (jalur lazim
`/www/server/nginx/sbin/nginx`).

### Tahap 1: aktifkan `/api/` saja (aditif)

Tidak mengganggu situs lama: situs lama tidak memakai `/api/`.

1. Siapkan API sesuai bagian Docker di `api/README.md` (jaringan `baota_net`, `render-grants.sh`, `deploy/.env`,
   `docker compose ... up -d --build`). Pastikan `TRUST_PROXY` = gateway yang TERLIHAT (`docker logs jdih_api`).
2. Tempel HANYA blok `location ^~ /api/ { ... }` dari `deploy/baota-locations.conf` ke vhost, `nginx -t`, reload.
3. Periksa:

   ```bash
   H=jdih.dprd.singkawangkota.go.id
   curl -s https://$H/api/v1/ringkasan | head -c 120; echo
   curl -s -o /dev/null -w 'POST: %{http_code}\n' -X POST https://$H/api/v1/ringkasan     # 403
   curl -sI https://$H/ | head -3                                                         # masih situs lama
   ```

### Tahap 2: uji SPA dari origin sementara (tanpa DNS/subdomain)

Bundel produksi memanggil `https://jdih.dprd.singkawangkota.go.id/api/v1` (absolut), jadi origin sementara
memanggil API produksi dari origin lain: perlu CORS.

1. Pasang SPA (bagian 4) dan salin `baota-locations.conf` ke `/www/server/nginx/conf/jdih-locations.conf`
   (ganti jalur header di dalamnya bila perlu). Buat server sementara di loopback, mis.
   `/www/server/panel/vhost/nginx/jdih-spa-uji.conf`:

   ```nginx
   server {
       listen 127.0.0.1:18080;
       server_name _;
       root /www/wwwroot/jdih-spa;
       index index.html;
       include /www/server/nginx/conf/jdih-locations.conf;
   }
   ```

2. Izinkan origin itu di API: tambahkan `http://localhost:18080` ke `CORS_ORIGINS` di `deploy/.env`, lalu
   `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d`.
3. Dari komputer Anda: `ssh -L 18080:127.0.0.1:18080 pengguna@server`, buka `http://localhost:18080`.
   Periksa: data tampil, konsol tanpa pelanggaran CSP, unduhan PDF berjalan.
4. Selesai: HAPUS `http://localhost:18080` dari `CORS_ORIGINS`, buat ulang container, hapus server sementara
   dan salinan `jdih-locations.conf`.

Tanpa langkah 2, konsol menampilkan galat CORS dan data tidak tampil (dibuktikan di bagian 7).

### Tahap 3: pindahkan `/` ke SPA

1. Set `root` situs ke `/www/wwwroot/jdih-spa`.
2. Beri komentar pada `location /` lama (dan, bila ada, nonaktifkan proxy terbalik Baota yang menangkap `/`),
   lalu salin blok itu persis ke bagian `LAMA-MULAI ... LAMA-SELESAI` (tetap berkomentar) sebagai jalan kembali.
3. Tempel sisa `baota-locations.conf`: tiga blok `ildis_app` dan paket `SPA-MULAI ... SPA-SELESAI`. Ganti baris di antara
   `SALIN-DARI-VHOST-LAMA` dengan baris persis dari vhost lama (jangan menyederhanakan header proxy),
   dan samakan `client_max_body_size`.
4. `nginx -t` lalu reload. Periksa (kolom kanan = yang diharapkan):

   ```bash
   H=jdih.dprd.singkawangkota.go.id
   curl -sI https://$H/                | grep -iE '^(HTTP|content-security|cache-control|strict-transport)'  # 200, CSP SPA, no-cache
   curl -sI https://$H/dokumen/2       | grep -iE '^(HTTP|cache-control)'                                    # 200 (index.html), no-cache
   curl -sI https://$H/assets/GANTI.js | grep -iE '^(HTTP|cache-control)'                                    # immutable, 1 tahun
   curl -sI https://$H/backend/        | grep -iE '^(HTTP|location|content-security)'                        # 302, TANPA CSP SPA
   curl -sI https://$H/feed/document.json       | grep -iE '^(HTTP|content-security)'                       # 200, TANPA CSP SPA
   curl -sI https://$H/common/dokumen/logojdihdprd.png | grep -iE '^(HTTP|content-type|content-security)'   # 200 image, TANPA CSP SPA
   curl -s -o /dev/null -w 'POST api: %{http_code}\n' -X POST https://$H/api/v1/ringkasan                    # 403
   ```

   Buka juga `/backend/` di peramban: login dan unggah satu PDF kecil. Pantau log 24 jam pertama
   (lonjakan 404/5xx, jalur lama yang sering diminta).

### Rollback (kurang dari satu menit)

1. Beri komentar pada SELURUH paket `SPA-MULAI ... SPA-SELESAI` (tiga location, termasuk `/assets/`: `/assets/`
   lama milik `ildis_app`) dan buka komentar blok `LAMA-MULAI ... LAMA-SELESAI`. (Bila Anda menonaktifkan proxy terbalik Baota, aktifkan kembali.)
2. Kembalikan `root` bila perlu, `nginx -t`, reload.
3. `/api/`, `/backend`, `/feed/`, `/common/dokumen/` tidak terpengaruh: ketiganya aman dibiarkan.

Cadangan penuh: pulihkan `GANTI_NAMA_SITUS.conf.bak-TANGGAL` lalu reload.

## 7. Bentrok rute SPA dengan URL lama, dan usulan penjaga (BELUM diterapkan)

Daftar URL lama diambil dari penjelajahan situs publik lama dan isi feed (belum tentu lengkap; cocokkan dengan
log, bagian 5). Rute SPA: `/`, `/dokumen`, `/dokumen/:id(\d{1,10})`, `/pembentukan-puu/:kategori?`, `/berita`,
`/statistik`, `/tentang/:slug?`, `/info`; selain itu halaman "tidak ditemukan" di dalam SPA (status 200).

| URL lama (ildis_app)                                                                                                          | Setelah peralihan                              | Bentrok?                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| `/dokumen/<id>-<slug>` (feed `urlDetailPeraturan`)                                                                            | tidak cocok rute -> "tidak ditemukan"          | **ya**                        |
| `/dokumen/download?id=<berkas>&docId=<id>`                                                                                    | "tidak ditemukan"                              | **ya** (tautan unduh beredar) |
| `/dokumen/peraturan`, `/dokumen/monografi`, `/dokumen/artikel`, `/dokumen/putusan`, `/dokumen/index`, `/dokumen/index2?id=UU` | "tidak ditemukan"                              | **ya**                        |
| `/berita/index`                                                                                                               | "tidak ditemukan"                              | **ya**                        |
| `/site/sekilas-sejarah`, `dasar-hukum`, `visi`, `misi`, `sop`                                                                 | "tidak ditemukan" (padanan: `/tentang/<slug>`) | **ya**                        |
| `/site/pengelola`, `/site/sto`, `/site/stoinstansi`                                                                           | "tidak ditemukan" (padanan belum jelas)        | ya, butuh keputusan           |
| `/site/login`                                                                                                                 | "tidak ditemukan"                              | periksa (bagian 5, butir 5)   |
| `/dokumen`, `/statistik`                                                                                                      | halaman SPA dengan nama yang sama              | tidak (maksudnya sama)        |
| `/backend...`, `/feed/...`, `/common/dokumen/...`                                                                             | tetap `ildis_app` (`^~`)                       | tidak                         |
| `/assets/...`                                                                                                                 | aset SPA (aset situs lama tidak dibutuhkan)    | sengaja                       |
| `/frontend/assets/...`, `/images/...`, `robots.txt`, `sitemap.xml`                                                            | jatuh ke `index.html` (HTML, status 200)       | periksa (bagian 5, butir 4)   |

**Usulan penjaga di nginx (tidak ada di `deploy/`; tempel di vhost SEBELUM `location /` bila Anda setuju).**
Regex yang memuat `{...}` wajib diberi tanda kutip. Diuji dengan nginx 1.28 (bagian 8).

```nginx
location ~ "^/dokumen/([0-9]{1,10})-[a-z0-9-]*$" { return 301 https://$host/dokumen/$1; }
location = /dokumen/peraturan                    { return 301 https://$host/dokumen; }
location ~ ^/dokumen/(monografi|artikel|putusan)$ { return 301 https://$host/dokumen?tipe=$1; }
location = /dokumen/index                        { return 301 https://$host/dokumen; }
location = /berita/index                         { return 301 https://$host/berita; }
location ~ ^/site/(sekilas-sejarah|dasar-hukum|visi|misi|sop)$ { return 301 https://$host/tentang/$1; }
location = /dokumen/download {
    if ($arg_docId ~ "^[0-9]{1,10}$") { return 302 https://$host/dokumen/$arg_docId; }
    return 302 https://$host/dokumen;
}
```

Alternatif di sisi SPA (router `redirect`): tidak membutuhkan perubahan nginx, tetapi mengubah kode klien
dan hanya bekerja setelah SPA termuat. Usulan nginx lebih disarankan: 301 sebelum aplikasi dimuat, juga untuk mesin pencari dan JDIHN.
Catatan: `docId` pada tautan lama dipetakan ke `/dokumen/<id>`; apakah `docId` lama sama dengan ID baru
bergantung pada data produksi (periksa dengan satu contoh nyata).

## 8. Pengujian yang sudah dilakukan (mesin pengembang) dan yang belum

Lingkungan: Docker Desktop 29.8.2, jaringan `baota_net` tiruan (subnet tetap), `mysql:8.4.11` dengan
`schema.sql` + `seed.sql`, akun SELECT-only dari `deploy/render-grants.sh`, `jdih_api` dari image yang
dibangun `deploy/docker-compose.yml`, stub `ildis_app` (container kecil), nginx 1.28.2 (Windows) dengan konfigurasi
yang dibangun dari berkas repo (`deploy/nginx.conf` -> `baota-locations.conf` -> `security-headers.conf`; hanya port,
sertifikat uji, root, dan jalur include yang diganti, dan pembangun gagal bila bentuk berkas berubah),
ditambah location regex gaya Baota, dan Chrome sungguhan.

| Pengujian                                                       | Hasil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nginx nyata, konfigurasi repo + location regex gaya Baota       | 73/73 pernyataan. SPA: 10 deep link = `index.html` (no-cache, header keamanan persis isi `security-headers.conf`), aset berhash `public, max-age=31536000, immutable`, aset hilang 404 (bukan `index.html`). `ildis_app`: nol header SPA, jalur dan metode tidak berubah, rantai pengalihan `/backend` apa adanya (302 tetap ke skema `http`), POST lolos, 20 MiB utuh (sha256 sama), 60 MiB ditolak 413. `/api/`: POST/PUT/DELETE/PATCH/OPTIONS 403, GET/HEAD 200, unduhan PDF lewat volume read-only, traversal 400/404. |
| Mutasi: hapus `^~`                                              | `/backend/assets/app.js` dan `/common/dokumen/logo.png` DICURI location regex: jebakan terbukti nyata, `^~` perlu.                                                                                                                                                                                                                                                                                                                                                                                                         |
| Vhost lama dengan `add_header` tingkat server                   | Tidak bocor ke SPA (digantikan); terwarisi di `/backend`, `/feed/`, dan `/api/` (bagian 5, butir 6).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Rollback (prosedur bagian 6 diterapkan pada salinan)            | `/`, `/dokumen/1-tesla`, `/assets/...`, `/index.html` kembali ke `ildis_app`; `/api/` dan `/backend` tetap jalan.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Usulan penjaga tautan lama                                      | 13/13: 11 pengalihan sesuai tabel, rute SPA yang sah tetap 200, jalur aneh tanpa 500 atau kebocoran.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Batas laju lewat konfigurasi baru (5 skenario)                  | Dua pengunjung beralamat asal berbeda (192.168.10.140 dan 172.18.80.1, non-loopback). A: XFF palsu 12 permintaan = 5x200 lalu 7x429, pengunjung lain 3x200. B: nginx lama (XFF ditambah) tetap terlindungi oleh API. C: kontrol positif (API mempercayai IP pengunjung) = 12x200, pemalsuan berhasil. D: `TRUST_PROXY=loopback` = keranjang bersama (bukan celah). E: container lain di `baota_net` dengan XFF palsu = 5x200 lalu 7x429.                                                                                   |
| e2e Chrome pada build produksi yang tidak diubah, satu hostname | 45/45 (`tests/e2e/real-api.mjs`), 8/8 pemeriksaan "tanpa pelanggaran CSP". Host produksi dipetakan ke nginx uji di Chrome uji saja.                                                                                                                                                                                                                                                                                                                                                                                        |
| e2e dari origin sementara (CORS)                                | 45/45 dengan `CORS_ORIGINS` memuat origin sementara; tanpa itu data diblokir CORS (kontrol negatif). Halaman produksi tidak bisa dibingkai dari origin lain (header `frame-ancestors`/XFO dari nginx).                                                                                                                                                                                                                                                                                                                     |
| e2e dev (server dev terisolasi)                                 | `npm run test:e2e` 278/278 (API palsu); `real-api.mjs` 45/45 (API Docker).                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tes statis konfigurasi dan CSP                                  | `tests/unit/nginx-config.test.js` dan `tests/unit/csp-selaras.test.js`: 12 tes; 8 mutasi konfigurasi, semuanya tertangkap.                                                                                                                                                                                                                                                                                                                                                                                                 |
| API                                                             | 60 tes (59 lulus, 0 gagal, 1 dilewati bersyarat), dijalankan dari dalam `baota_net` sebagai uid 1000 terhadap MySQL 8.4.11.                                                                                                                                                                                                                                                                                                                                                                                                |

Skrip pengujian nginx/Docker/Chrome ini tidak disimpan di repo (dibuat di folder sementara). Hasil di atas dapat diulang dengan mengikuti langkah di dokumen ini pada mesin uji.

**Tidak dapat diuji di sini:** nginx Baota sungguhan (sertifikat, include, vhost, proxy terbalik Baota yang
menangkap `/`), perilaku `ildis_app` sebenarnya (stub hanya meniru yang Anda sebutkan; header proxy bawaan di
`baota-locations.conf` adalah dasar yang umum dan harus diganti dengan salinan vhost Anda), `ildis_cron` dan pembuatan feed,
JDIHN (apakah dan bagaimana membaca feed), HTTP/2 dan HTTP/3 (uji memakai HTTP/1.1), perilaku `my.cnf` kustom
Baota, alamat gateway di Linux (diamati hanya di Docker Desktop), perangkat Android sungguhan.
Location regex gaya Baota di uji adalah PERKIRAAN pola bawaan, bukan salinan vhost Anda.
