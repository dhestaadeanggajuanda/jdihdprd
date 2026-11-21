# API JDIH DPRD Kota Singkawang

API **baca-saja** untuk aplikasi Quasar (web dan Android). Node.js + Fastify 5 + `mysql2`.
Membaca database JDIH yang sudah ada (skema Yii2/JDIHN); tidak menulis apa pun.

- Kontrak: [`../docs/api/openapi.yaml`](../docs/api/openapi.yaml) (basis `/api/v1`, 11 jalur, semuanya `GET`).
- Aplikasi lama (Yii2) tidak disentuh; API ini hanya tambahan di sampingnya.

## Persyaratan

- Node.js 22.12 atau lebih baru (diuji pada 24).
- MySQL/MariaDB berisi skema JDIH. Diuji pada MySQL 8.4.11; dump yang diberikan pemilik berasal dari
  server 8.4.4 (rilis yang sama, patch berbeda). Fungsi yang dipakai di antaranya `REGEXP_REPLACE`
  (MySQL 8+ atau MariaDB 10.0.5+) dan `FIND_IN_SET`.
- Akun database **SELECT-only** (lihat bawah). Jangan memakai akun aplikasi Yii2 atau `root`.

## Menjalankan

```sh
cd api
npm ci
DB_URL='mysql://jdih_ro:SANDI@127.0.0.1:3306/db_jdihdprd' \
CORS_ORIGINS='https://jdih.dprd.singkawangkota.go.id' \
TRUST_PROXY=loopback \
FILES_DIR=/path/ke/common/dokumen FILES_MODE=accel \
npm start
```

Mendengar di `127.0.0.1:3000` (di belakang nginx; jangan dibuka langsung ke internet).
`GET /health` (di luar `/api/v1`, jadi tidak diteruskan nginx) mengembalikan status tanpa menyentuh data;
cocok untuk pemeriksaan kesehatan dari host itu sendiri.

### Variabel lingkungan

| Variabel              | Bawaan                         | Fungsi                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_URL`              | (wajib)                        | `mysql://pengguna:sandi@host:3306/db`. Gunakan akun SELECT-only.                                                                                                                                                                                                                                  |
| `HOST`, `PORT`        | `127.0.0.1`, `3000`            | Alamat dengar.                                                                                                                                                                                                                                                                                    |
| `CORS_ORIGINS`        | (kosong = tanpa CORS)          | Origin yang boleh memanggil dari peramban, dipisah koma. Hanya `https://…` atau `http://localhost`. Untuk Android (Capacitor, `androidScheme: https`) tambahkan `https://localhost`.                                                                                                              |
| `TRUST_PROXY`         | `0`                            | Alamat proxy tepercaya agar pembatas laju memakai IP klien asli: `loopback` bila nginx di mesin yang sama dan API tanpa Docker; pada Docker isi **gateway jaringan** (lihat bagian Docker). `true`, angka, dan `/0` ditolak saat start. Kosong = tanpa proxy, header `X-Forwarded-For` diabaikan. |
| `RATE_LIMIT_MAX`      | `120`                          | Permintaan per menit per IP.                                                                                                                                                                                                                                                                      |
| `FILES_DIR`           | (kosong)                       | Folder berkas dokumen di server (`common/dokumen`).                                                                                                                                                                                                                                               |
| `FILES_MODE`          | `stream`                       | `accel`: nginx yang mengirim berkas lewat `X-Accel-Redirect` (disarankan). `stream`: Node membaca berkas.                                                                                                                                                                                         |
| `FILES_ACCEL_PREFIX`  | `/internal-dokumen/`           | Lokasi internal nginx untuk mode `accel`.                                                                                                                                                                                                                                                         |
| `FILE_REDIRECT_HOSTS` | `bphn.jdihn.go.id,jdihn.go.id` | Host eksternal yang boleh dialihkan bila lampiran berupa URL penuh. Host lain ditolak (404).                                                                                                                                                                                                      |
| `PAGE_FILES_DIR`      | (kosong)                       | Folder gambar halaman Tentang (struktur organisasi, SOP).                                                                                                                                                                                                                                         |
| `API_SAMPLE`          | `0`                            | `1` menandai respons sebagai data contoh. Hanya untuk lingkungan uji.                                                                                                                                                                                                                             |

Contoh `systemd` (jalankan sebagai pengguna tanpa hak istimewa, mis. `jdih-api`):

```ini
[Service]
User=jdih-api
WorkingDirectory=/opt/jdih/api
EnvironmentFile=/etc/jdih-api.env        # chmod 600; berisi DB_URL dan variabel di atas
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ReadOnlyPaths=/path/ke/common/dokumen
```

## Akun database baca-saja

[`db/grants.sql`](db/grants.sql) adalah templat: `SELECT` pada 12 tabel yang dibaca API saja
(`document`, `data_lampiran`, `data_status`, `data_subyek`, `data_pengarang`, `pengarang`,
`tipe_pengarang`, `jenis_pengarang`, `document_type`, `frontend_config`, `hit_counter`,
`download_counter`). Tidak ada akses ke tabel akun, anggota, atau log. Ganti `{{DB}}`, `{{USER}}`,
`{{HOST}}`, `{{PASSWORD}}` dan jalankan oleh pengelola database; jangan menyimpan sandi di repo.
Di produksi gunakan [`../deploy/render-grants.sh`](../deploy/render-grants.sh) (lihat bagian Docker);
`scripts/load-db.mjs` hanya untuk database uji dan **tidak boleh** dipakai di produksi.

Tes `akun database baca-saja` membuktikan akun itu ditolak untuk `INSERT`/`UPDATE`/`DELETE`/DDL
dan tidak bisa membaca tabel di luar daftar.

## Docker (aaPanel/Baota)

Berkas: [`Dockerfile`](Dockerfile), [`.dockerignore`](.dockerignore),
[`../deploy/docker-compose.yml`](../deploy/docker-compose.yml), [`../deploy/.env.example`](../deploy/.env.example),
[`../deploy/render-grants.sh`](../deploy/render-grants.sh). Lingkungan yang diasumsikan: jaringan Docker
eksternal `baota_net`, container `mysql_server` (MySQL 8.4; compose-nya **tidak diubah**), `ildis_app`
(menulis berkas dokumen ke volume `jdihdprd_dokumen-uploads`), dan nginx Baota **di host** (bukan container).
Image tidak memuat `test/`, `db/`, maupun `scripts/` (jadi `load-db.mjs` tidak ada di produksi).

### 1. Akun database (sekali, oleh pengelola database)

Host akun dibatasi ke subnet `baota_net`, bukan `%`:

```sh
docker network inspect baota_net --format '{{range .IPAM.Config}}{{.Subnet}}  gateway {{.Gateway}}{{end}}'
# contoh: 172.19.0.0/16  gateway 172.19.0.1   ->   DB_RO_HOST='172.19.%'   (subnet /24: '172.19.0.%')
```

```sh
read -rs -p 'Sandi akun API: ' DB_RO_PASSWORD; export DB_RO_PASSWORD; echo   # buat: openssl rand -hex 24
export MYSQL_PWD='sandi-root-mysql'          # atau lihat catatan di bawah
DB_NAME=nama_database DB_RO_USER=jdih_ro DB_RO_HOST='172.19.%' \
  bash deploy/render-grants.sh | docker exec -i -e MYSQL_PWD mysql_server mysql -uroot
```

`render-grants.sh` menolak `DB_RO_HOST` berupa `%` atau nama bebas, nama database/akun berkarakter aneh,
dan sandi di bawah 16 karakter atau berkarakter khusus. `docker exec -i ... mysql -uroot -p` tidak bisa
meminta sandi karena stdin dipakai pipa; bila sandi root tidak ingin ditaruh di variabel lingkungan, jalankan
`docker exec -it mysql_server mysql -uroot -p` secara interaktif lalu tempelkan keluaran `render-grants.sh`.
Periksa hasilnya: `SHOW GRANTS FOR 'jdih_ro'@'172.19.%';` (12 baris `SELECT`, tanpa hak lain).

**Periksa `my.cnf` kustom** (tidak bisa saya lihat; hanya MySQL 8.4 bawaan yang diuji):

```sql
SELECT @@GLOBAL.sql_mode, @@character_set_server, @@collation_server, @@skip_name_resolve, VERSION();
```

- `sql_mode`: tes penuh lulus pada bawaan 8.4 (strict), kosong, `ANSI` (termasuk `ANSI_QUOTES`,
  `PIPES_AS_CONCAT`, `IGNORE_SPACE`), dan `NO_BACKSLASH_ESCAPES`. Mode di luar itu tidak diuji.
- `character_set_server`: koneksi API memakai `utf8mb4` dan tabel dump `utf8mb4`; server berkarakter set
  lain tidak diuji.
- Pola host `172.19.%` dicocokkan dengan alamat IP klien; image resmi memakai `skip_name_resolve=ON`.

### 2. Konfigurasi dan menjalankan

```sh
cp deploy/.env.example deploy/.env && chmod 600 deploy/.env   # isi nilainya; tidak di-commit
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
docker ps --filter name=jdih_api            # harus (healthy)
curl -s http://127.0.0.1:3000/api/v1/ringkasan
```

Variabel wajib (`DB_NAME`, `DB_RO_PASSWORD`, `TRUST_PROXY`) yang kosong menghentikan compose dengan
pesan jelas. Nilai contoh `TRUST_PROXY` sengaja tidak valid, jadi API menolak start bila lupa diganti.

**`TRUST_PROXY` = alamat yang dilihat API sebagai asal sambungan dari nginx host**, yaitu gateway
`baota_net` (bukan `127.0.0.1`, bukan seluruh subnet). Pastikan dengan pengamatan, bukan dugaan:

```sh
curl -s http://127.0.0.1:3000/health ; docker logs --tail 3 jdih_api      # "remoteAddress" = gateway
```

Nilai itu dilihat langsung pada Docker Desktop (host Windows, WSL2); di Linux (Baota) amati lagi dengan
perintah di atas. Salah isi tidak membuka celah, tetapi semua pengunjung berbagi satu keranjang batas laju
dan saling memblokir (terbukti pada uji). Container lain di `baota_net` yang memanggil `jdih_api:3000`
langsung tidak dipercaya (soketnya bukan gateway), sehingga `X-Forwarded-For` palsu darinya diabaikan.

Port API hanya dipublikasikan ke `127.0.0.1` host (pada Docker Desktop terbukti: alamat LAN dan WSL
ditolak). Di Linux, setelah deploy, uji dari **mesin lain** di jaringan: `curl http://IP-SERVER:3000/health`
harus gagal. Siapa pun yang punya akses shell ke host dapat menjangkau
port itu sebagai "proxy tepercaya" dan memalsukan `X-Forwarded-For`; itu batas administrator, sama dengan nginx.

### 3. Berkas dokumen

Volume dipasang **read-only** pada `/data/dokumen`; `FILES_MODE=stream` (Node membaca dan mengalirkan
berkas, karena `/var/lib/docker` biasanya tidak terbaca oleh pengguna nginx Baota). Dari feed situs
berjalan, berkas ada langsung di root folder `common/dokumen` (isi `FILES_SUBDIR` bila di volume ternyata
berada di sub-folder). Proses berjalan sebagai uid 1000:

- Berkas yang ada tetapi tidak terbaca oleh uid itu (mis. mode 0600 milik pengguna lain) menghasilkan
  **500** generik dan baris `EACCES` di log (kesalahan konfigurasi server, bukan 404). Periksa
  `docker exec ildis_app ls -ln <folder>`, lalu ubah izin menjadi terbaca semua (644/755) atau isi
  `API_UID`/`API_GID` dengan pemilik/grup berkas.
- `FILE_REDIRECT_HOSTS` dikosongkan pada compose. Pada data sekarang, `url_lampiran` keempat dokumen
  berisi URL penuh `https://bphn.jdihn.go.id/common/dokumen/<berkas>` (sisa templat BPHN) padahal berkas
  yang sama ada di situs DPRD. Dengan daftar bawaan kode (`bphn.jdihn.go.id,jdihn.go.id`) semua unduhan
  dialihkan (302) ke BPHN; dengan daftar kosong dibaca dari volume memakai nama berkasnya (terbukti 200
  pada dump asli). Akibatnya: berkas yang tidak ada di volume menghasilkan 404, tanpa cadangan ke BPHN.

### 4. nginx

Satu hostname produksi: `/api/` ke API, `/backend`, `/feed/`, `/common/dokumen/` ke `ildis_app`, selain itu
SPA statis. Blok `location` ada di [`../deploy/baota-locations.conf`](../deploy/baota-locations.conf)
(ditempel ke editor "Config" situs Baota; vhost lengkap untuk nginx biasa:
[`../deploy/nginx.conf`](../deploy/nginx.conf)). Untuk API: `limit_except GET HEAD`,
`proxy_pass http://127.0.0.1:API_PORT`, dan `X-Forwarded-For` **ditimpa** (`$remote_addr`). Lokasi
`/internal-dokumen/` tidak ada di berkas itu (hanya untuk `FILES_MODE=accel`, tanpa Docker). Urutan
peralihan bertahap (mulai dari `/api/` saja, yang aditif), rollback, dan semua pemeriksaan:
[`../docs/deploy/frontend-baota.md`](../docs/deploy/frontend-baota.md).

### Yang diuji dan yang tidak

Diuji di mesin pengembang (Docker Desktop 29.8.2, Windows + WSL2), dengan jaringan `baota_net` tiruan
(172.29.0.0/16), `mysql:8.4` (8.4.11), `node:24-alpine` (v24.22.3), dan nginx 1.28.2 untuk Windows:

- Akun SELECT-only dibuat lewat `render-grants.sh | docker exec -i`; INSERT/UPDATE/DELETE/DDL dan tabel lain
  ditolak; klien di luar subnet ditolak MySQL (`Access denied`); tes API penuh (60 tes: 59 lulus, 0 gagal,
  1 dilewati bersyarat) dijalankan dari dalam `baota_net` sebagai uid 1000.
- Unduhan lewat volume read-only: 200 dengan isi utuh (5 MiB, sha256 sama), 404 untuk akses tertutup, host
  asing, `../../etc/passwd`, symlink keluar folder, dan berkas hilang; 400 untuk ID berbahaya; 500 generik
  untuk berkas tak terbaca. Penulisan ke volume, kode, dan root filesystem ditolak.
- Batas laju lewat nginx dengan dua pengunjung beralamat asal berbeda: `X-Forwarded-For` palsu tidak
  menghindari batas (nginx baru maupun lama), pengunjung lain tidak ikut terblokir, kontrol positif
  menunjukkan pemalsuan berhasil bila API mempercayai IP klien, dan salah isi `TRUST_PROXY` menghasilkan
  keranjang bersama.
- Container: uid 1000, `CapEff=0`, `no-new-privileges`, root FS read-only, `/tmp` tmpfs `noexec`,
  HEALTHCHECK sehat, berhenti rapi 0,4 detik (kode keluar 0), memori sekitar 45 MiB.

**Tidak diuji di sini:** nginx Baota sungguhan (jalur sertifikat, include, dan vhost-nya), `my.cnf` kustom,
`ildis_cron` dan pembuatan feed (feed hanya dibaca), izin berkas yang ditulis `ildis_app` yang sebenarnya,
perilaku port yang dipublikasikan di Linux (gateway diamati pada Docker Desktop), TLS antara API dan MySQL
(tidak dipakai di dalam jaringan Docker), dan beban tinggi.

## nginx

Lihat [`../deploy/baota-locations.conf`](../deploy/baota-locations.conf): hanya `GET`/`HEAD` yang diteruskan
ke `/api/` (`limit_except`; permintaan preflight `OPTIONS` ikut ditolak 403, dan klien saat ini hanya
mengirim `Accept`, header yang aman-CORS sehingga tidak ada preflight; bila kelak ada header khusus, longgarkan
`limit_except` dengan sengaja). Pada deploy Docker, API membaca volume sendiri (`FILES_MODE=stream`). Pada mode `accel`
(tanpa Docker), `/internal-dokumen/` bersifat `internal` (tidak bisa diakses langsung dari klien), API
memberi `Content-Type` dan `Content-Disposition` (nama berkas), nginx menyajikan byte berkas; jangan
menambah `Content-Disposition` di nginx (header ganda ditolak Chrome).

## Pengujian

Butuh MySQL uji dengan **nama database memuat `test`, `tmp`, atau `dev`**, tempat skema dan data
sintetis dimuat (skrip menolak database lain, agar tidak tercampur dengan data produksi):

```sh
ADMIN_DB_URL='mysql://root@127.0.0.1:3307/jdih_test' \
DB_RO_PASSWORD='sandi-uji' node scripts/load-db.mjs --fresh --grants

TEST_DB_URL='mysql://jdih_ro:sandi-uji@127.0.0.1:3307/jdih_test' npm test
```

Tanpa `TEST_DB_URL`, tes yang butuh database dilewati (bukan gagal); tes pembersih HTML tetap jalan.
Hasil terakhir (dengan `TEST_DB_URL`): 60 tes, 59 lulus, 0 gagal, 1 dilewati (satu tes bersyarat yang memang hanya jalan tanpa `TEST_DB_URL`).
Satu tes (`openLocal ... EACCES`) hanya berarti bagi pengguna non-root di POSIX dan dilewati di Windows atau sebagai root.
Dari akar proyek, `npm run test:api` menjalankannya. Pengujian terhadap MySQL di Docker: lihat bagian Docker di atas.

Uji peramban terhadap API nyata: [`../tests/e2e/real-api.mjs`](../tests/e2e/real-api.mjs).

## Cara kerja dan konvensi data

- **Allowlist kolom.** Skema respons Fastify adalah daftar kolom yang boleh keluar; kolom lain di
  database tidak pernah diserialisasi. Query memakai prepared statement (`execute`); hanya bilangan
  bulat yang sudah divalidasi yang dimasukkan ke `LIMIT`/`OFFSET`/`IN`.
- **Terbit** = `is_publish = 1` dan `sembunyikan_di_opac` kosong atau menyatakan tidak disembunyikan
  (daftar-izin gagal-tertutup; lihat Asumsi nomor 1).
- **Tipe** (`document.tipe_dokumen`): 1 peraturan, 2 monografi, 3 artikel, 4 putusan.
- **Kode jenis** = slug ASCII dari teks `jenis_peraturan` (mis. `Peraturan Daerah Kota` → `peraturan-daerah-kota`).
- **Status** berlaku/dicabut diturunkan dari `document.status` **atau** relasi "dicabut" ke dokumen
  terbit pada `data_status`. Relasi ke dokumen yang belum terbit tidak dihitung dan tidak ditampilkan.
- **Pembentukan PUU** = `document_type.document_group_label = 'legislation_formation'`, dikaitkan lewat
  `document.dokumen_type_id`.
- **Halaman Tentang** dari `frontend_config` (8 kunci). Halaman HTML dibersihkan di server
  (`sanitize-html`) dan lagi di klien (DOMPurify). Halaman berbasis berkas (struktur organisasi, SOP)
  dilayani `/halaman/{slug}/berkas` dari `PAGE_FILES_DIR`.
- **Unduhan** memakai ID buram `/dokumen/{id}/lampiran/{lampiranId}`. Jalur berkas selalu dari
  database; nama divalidasi (tanpa pemisah jalur, ekstensi allowlist) dan jalur akhir dipastikan
  tetap di `FILES_DIR` (realpath, dibuka dengan `O_NOFOLLOW`). Lampiran yang dibatasi tidak dilayani.
  Header unduhan (`attachment`, `Cache-Control: public`) hanya menempel pada respons sukses; berkas yang
  ada tetapi tak terbaca (izin) gagal sebelum respons dimulai (500 generik, `EACCES` di log).
- **Cache.** Respons sukses `public, max-age=60` (berkas 300); semua respons galat (4xx/5xx, termasuk 429)
  `no-store`, supaya galat milik satu klien tidak disajikan perantara ke orang lain.
- **Pencarian teks** meloloskan `%`, `_`, dan `|` dengan `ESCAPE '|'` (bukan backslash), sehingga tidak
  bergantung pada `sql_mode` `NO_BACKSLASH_ESCAPES`.
- **Penghitung** `hit_see`/`hit_download` hanya **dibaca**. Menaikkannya butuh `GRANT UPDATE`
  terbatas pada dua kolom itu; keputusan pemilik belum diambil.
- **Galat** `application/problem+json` tanpa SQL, jalur berkas, atau jejak tumpukan; setiap respons
  membawa `X-Request-Id` yang dibuat server (nilai dari klien tidak dipercaya).

## Asumsi yang perlu diverifikasi dengan data produksi

Dump contoh hanya berisi 4 dokumen dan nilai kolom di bawah semuanya `NULL`, jadi aturan konservatif
dipakai dan perlu dicocokkan dengan data asli sebelum rilis.

**Pencocokan dengan feed** (`/feed/document.json`, dibaca 2026-11-20): feed memuat persis 4 dokumen yang
sama dengan dump (semuanya judul "Tesla", tahun 2024), jadi **situs berjalan belum berisi data nyata dan
feed tidak membuktikan bentuk data produksi**. Yang dapat dipastikan dari feed dan dump:

- Cocok: jenis, nomor, tahun, judul, dan tanggal penetapan keempat dokumen sama antara feed dan API yang
  dijalankan pada dump (`ringkasan`: 1 dokumen per koleksi). Feed memberi `status: "Berlaku"` ke semua
  tipe, API hanya ke peraturan (disengaja: status keberlakuan hanya untuk peraturan).
- `url_lampiran` (nomor 4): pada keempat baris berisi URL penuh `https://bphn.jdihn.go.id/common/dokumen/<berkas>`;
  nama berkas ada di kolom terpisah `dokumen_lampiran` (tidak dibaca API). Berkas yang sama ada di situs
  DPRD pada `/common/dokumen/<berkas>` (HTTP 200, `application/pdf`; juga `urlAbstrak` berupa jalur relatif
  `/common/dokumen/...`), langsung di root folder tanpa sub-folder.
- `judul` (nomor 3): hanya "Tesla"; jenis/nomor/tahun ada di kolom terpisah. Tidak membuktikan apakah judul
  dokumen nyata memuat awalan.
- Feed tidak memuat kolom akses/pembatasan/tersembunyi (nomor 1), jadi tidak ada bukti untuk daftar-izinnya;
  daftar-izin **tidak dilonggarkan**.

Daftar asumsi:

1. `sembunyikan_di_opac`, `akses_lampiran`, `pembatasan_lampiran`: **daftar-izin, gagal-tertutup**.
   Dokumen terbit hanya bila `sembunyikan_di_opac` kosong atau `Tidak`/`0`/`No`/`-` (`src/sql.js`);
   lampiran dilayani hanya bila `akses_lampiran` kosong, `-`, atau `Terbuka`/`Publik`/`Umum`/`Open`
   dan `pembatasan_lampiran` kosong atau menyatakan tanpa pembatasan (`isRestricted` di
   `src/files.js`). Nilai lain, termasuk yang tidak dikenal, membuat dokumen/lampiran disembunyikan.
   Bila data produksi memakai kata lain untuk "tidak disembunyikan"/"terbuka", dokumen atau lampiran
   tampak hilang (bukan bocor): sesuaikan daftar itu.
2. `promosikan_ke_beranda`: tidak dipakai; beranda memakai dokumen terbaru.
3. Isi `judul`: apakah sudah memuat awalan jenis/nomor/tahun (`stripSubjectPrefix` adalah heuristik).
   **Belum terbukti** (satu-satunya contoh: "Tesla"); cek pada beberapa dokumen nyata pertama.
4. Format `data_lampiran.url_lampiran`: **terbukti hanya untuk data templat** (URL penuh ke BPHN, berkas
   ada lokal dengan nama yang sama). Untuk unggahan DPRD yang sebenarnya, bentuknya belum terlihat
   (nama berkas, jalur relatif, atau URL penuh ke host DPRD sama-sama dibaca dari volume bila
   `FILE_REDIRECT_HOSTS` kosong); cek satu unggahan baru:
   `SELECT id, url_lampiran, dokumen_lampiran FROM data_lampiran ORDER BY id DESC LIMIT 5;`
5. Lokasi berkas gambar untuk `strukturjdih`, `strukturbaghukum`, `sop` (`PAGE_FILES_DIR`).
6. Dokumen PUU tidak dikeluarkan dari daftar monografi.
7. Versi MySQL: **terjawab**, 8.4 (dump dari 8.4.4; diuji pada 8.4.11). MariaDB tidak diuji.
8. Lokasi volume: berkas ada di root `common/dokumen` menurut feed; nama sub-folder di dalam volume
   Docker `jdihdprd_dokumen-uploads` belum dikonfirmasi (`FILES_SUBDIR` kosong = root volume).
