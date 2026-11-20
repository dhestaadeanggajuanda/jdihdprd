# API JDIH DPRD Kota Singkawang

API **baca-saja** untuk aplikasi Quasar (web dan Android). Node.js + Fastify 5 + `mysql2`.
Membaca database JDIH yang sudah ada (skema Yii2/JDIHN); tidak menulis apa pun.

- Kontrak: [`../docs/api/openapi.yaml`](../docs/api/openapi.yaml) (basis `/api/v1`, 11 jalur, semuanya `GET`).
- Aplikasi lama (Yii2) tidak disentuh; API ini hanya tambahan di sampingnya.

## Persyaratan

- Node.js 22.12 atau lebih baru (diuji pada 24).
- MySQL/MariaDB berisi skema JDIH. Diuji pada MySQL 8.4. **Versi server produksi belum dikonfirmasi**:
  fungsi yang dipakai di antaranya `REGEXP_REPLACE` (MySQL 8+ atau MariaDB 10.0.5+) dan `FIND_IN_SET`.
- Akun database **SELECT-only** (lihat bawah). Jangan memakai akun aplikasi Yii2 atau `root`.

## Menjalankan

```sh
cd api
npm ci
DB_URL='mysql://jdih_ro:SANDI@127.0.0.1:3306/db_jdihdprd' \
CORS_ORIGINS='https://jdih.dprd.singkawangkota.go.id' \
TRUST_PROXY=1 \
FILES_DIR=/path/ke/common/dokumen FILES_MODE=accel \
npm start
```

Mendengar di `127.0.0.1:3000` (di belakang nginx; jangan dibuka langsung ke internet).
`GET /health` (di luar `/api/v1`, jadi tidak diteruskan nginx) mengembalikan status tanpa menyentuh data;
cocok untuk pemeriksaan kesehatan dari host itu sendiri.

### Variabel lingkungan

| Variabel              | Bawaan                         | Fungsi                                                                                                                                                                               |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DB_URL`              | (wajib)                        | `mysql://pengguna:sandi@host:3306/db`. Gunakan akun SELECT-only.                                                                                                                     |
| `HOST`, `PORT`        | `127.0.0.1`, `3000`            | Alamat dengar.                                                                                                                                                                       |
| `CORS_ORIGINS`        | (kosong = tanpa CORS)          | Origin yang boleh memanggil dari peramban, dipisah koma. Hanya `https://…` atau `http://localhost`. Untuk Android (Capacitor, `androidScheme: https`) tambahkan `https://localhost`. |
| `TRUST_PROXY`         | `0`                            | Isi `1` di belakang nginx agar pembatas laju memakai IP klien asli.                                                                                                                  |
| `RATE_LIMIT_MAX`      | `120`                          | Permintaan per menit per IP.                                                                                                                                                         |
| `FILES_DIR`           | (kosong)                       | Folder berkas dokumen di server (`common/dokumen`).                                                                                                                                  |
| `FILES_MODE`          | `stream`                       | `accel`: nginx yang mengirim berkas lewat `X-Accel-Redirect` (disarankan). `stream`: Node membaca berkas.                                                                            |
| `FILES_ACCEL_PREFIX`  | `/internal-dokumen/`           | Lokasi internal nginx untuk mode `accel`.                                                                                                                                            |
| `FILE_REDIRECT_HOSTS` | `bphn.jdihn.go.id,jdihn.go.id` | Host eksternal yang boleh dialihkan bila lampiran berupa URL penuh. Host lain ditolak (404).                                                                                         |
| `PAGE_FILES_DIR`      | (kosong)                       | Folder gambar halaman Tentang (struktur organisasi, SOP).                                                                                                                            |
| `API_SAMPLE`          | `0`                            | `1` menandai respons sebagai data contoh. Hanya untuk lingkungan uji.                                                                                                                |

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

Tes `akun database baca-saja` membuktikan akun itu ditolak untuk `INSERT`/`UPDATE`/`DELETE`/DDL
dan tidak bisa membaca tabel di luar daftar.

## nginx

Lihat [`../deploy/nginx.conf`](../deploy/nginx.conf): hanya `GET`/`HEAD` yang diteruskan ke `/api/`
(`limit_except`), dan `/internal-dokumen/` bersifat `internal` (tidak bisa diakses langsung dari
klien). Pada mode `accel`, API memberi `Content-Type` dan `Content-Disposition` (nama berkas), nginx
menyajikan byte berkas; jangan menambah `Content-Disposition` di nginx (header ganda ditolak Chrome).

## Pengujian

Butuh MySQL uji dengan **nama database memuat `test`, `tmp`, atau `dev`**, tempat skema dan data
sintetis dimuat (skrip menolak database lain, agar tidak tercampur dengan data produksi):

```sh
ADMIN_DB_URL='mysql://root@127.0.0.1:3307/jdih_test' \
DB_RO_PASSWORD='sandi-uji' node scripts/load-db.mjs --fresh --grants

TEST_DB_URL='mysql://jdih_ro:sandi-uji@127.0.0.1:3307/jdih_test' npm test
```

Tanpa `TEST_DB_URL`, tes yang butuh database dilewati (bukan gagal); tes pembersih HTML tetap jalan.
Hasil terakhir (dengan `TEST_DB_URL`): 49 tes, 48 lulus, 0 gagal, 1 dilewati (satu tes bersyarat yang memang hanya jalan tanpa `TEST_DB_URL`).
Dari akar proyek, `npm run test:api` menjalankannya.

Uji peramban terhadap API nyata: [`../tests/e2e/real-api.mjs`](../tests/e2e/real-api.mjs).

## Cara kerja dan konvensi data

- **Allowlist kolom.** Skema respons Fastify adalah daftar kolom yang boleh keluar; kolom lain di
  database tidak pernah diserialisasi. Query memakai prepared statement (`execute`); hanya bilangan
  bulat yang sudah divalidasi yang dimasukkan ke `LIMIT`/`OFFSET`/`IN`.
- **Terbit** = `is_publish = 1` dan `sembunyikan_di_opac` bukan `ya`/`1`.
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
  tetap di `FILES_DIR` (realpath). Lampiran yang dibatasi tidak dilayani.
- **Penghitung** `hit_see`/`hit_download` hanya **dibaca**. Menaikkannya butuh `GRANT UPDATE`
  terbatas pada dua kolom itu; keputusan pemilik belum diambil.
- **Galat** `application/problem+json` tanpa SQL, jalur berkas, atau jejak tumpukan; setiap respons
  membawa `X-Request-Id` yang dibuat server (nilai dari klien tidak dipercaya).

## Asumsi yang perlu diverifikasi dengan data produksi

Dump contoh hanya berisi 4 dokumen dan nilai kolom di bawah semuanya `NULL`, jadi aturan konservatif
dipakai dan perlu dicocokkan dengan data asli sebelum rilis:

1. `sembunyikan_di_opac`, `akses_lampiran`, `pembatasan_lampiran`: nilai apa yang berarti "disembunyikan"
   atau "dibatasi" (`isRestricted` di `src/files.js` menolak bila ragu).
2. `promosikan_ke_beranda`: tidak dipakai; beranda memakai dokumen terbaru.
3. Isi `judul`: apakah sudah memuat awalan jenis/nomor/tahun (`stripSubjectPrefix` adalah heuristik).
4. Format `data_lampiran.url_lampiran`: nama berkas, jalur relatif, atau URL penuh.
5. Lokasi berkas gambar untuk `strukturjdih`, `strukturbaghukum`, `sop` (`PAGE_FILES_DIR`).
6. Dokumen PUU tidak dikeluarkan dari daftar monografi.
7. Versi MySQL/MariaDB produksi (lihat Persyaratan).
