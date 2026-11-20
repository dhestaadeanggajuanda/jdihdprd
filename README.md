# JDIH DPRD Kota Singkawang

Frontend portal produk hukum DPRD Kota Singkawang. **Satu basis kode Quasar** menghasilkan situs web (SPA) dan aplikasi Android (Capacitor). Data dokumen datang dari service API terpisah (baca saja); berita datang dari Media Center Kota Singkawang.

- Produk, pengguna, dan prinsip: [PRODUCT.md](PRODUCT.md)
- Desain yang disetujui (mockup, 2026-11-20): [design/mockups/](design/mockups/README.md)
- Keamanan (OWASP): [SECURITY.md](SECURITY.md) dan [hasil audit](docs/security/owasp-audit-2026-11-20.md)
- Kontrak API: [docs/api/openapi.yaml](docs/api/openapi.yaml); implementasi dan cara menjalankannya: [api/README.md](api/README.md)

## Prasyarat

- Node.js 22.12+ atau 24
- Untuk API: MySQL/MariaDB berisi skema JDIH (diuji pada MySQL 8.4) dan akun SELECT-only (lihat [api/README.md](api/README.md))
- Untuk APK Android (belum terpasang di mesin pengembangan ini): Android Studio terbaru, **JDK 21**, Android SDK Platform 36, `ANDROID_HOME`

## Menjalankan

```bash
npm install
cp .env.example .env     # opsional; atur JDIH_NEWS_FILTER
npm run dev              # http://localhost:9000, memakai API palsu (data contoh)
```

Mode pengembangan melayani **API palsu** pada `/api/v1` (`dev/mock-api`): 173 dokumen contoh yang konsisten dengan mockup. Respons membawa `X-Data-Sample: true`, sehingga aplikasi menampilkan spanduk "Data contoh". Untuk menguji keadaan lain:

```bash
MOCK_MODE=slow  npm run dev   # respons lambat (1,8 detik)
MOCK_MODE=error npm run dev   # semua respons 503
MOCK_MODE=empty npm run dev   # daftar kosong
```

(PowerShell: `$env:MOCK_MODE='error'; npm run dev`.)

Untuk mencoba dengan **API nyata** (bukan palsu), jalankan API di `api/` lalu arahkan server pengembangan ke sana. `DEV_API` bukan variabel klien (tanpa awalan `JDIH_`), hanya dipakai proxy dev:

```bash
DEV_API=http://localhost:3000 npm run dev      # PowerShell: $env:DEV_API='http://localhost:3000'; npm run dev
```

## Variabel `.env`

Dua variabel klien, keduanya berawalan `JDIH_`:

| Variabel              | Fungsi                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `JDIH_NEWS_FILTER`    | Kata kunci (dipisah koma) untuk berita dari `mediacenter.singkawangkota.go.id`. Tiap kata kunci dicari sebagai frasa utuh, hasilnya digabung tanpa duplikat dan diurutkan dari yang terbaru. Bawaan: `produk hukum,peraturan daerah,dprd`. |
| `JDIH_FOOTER_CONTACT` | Alamat dan kontak di footer, baris dipisah `\|`. Surel dan telepon yang berdiri sendiri menjadi tautan `mailto:`/`tel:`. Kosong = kolom Kontak tidak ditampilkan.                                                                          |

```
JDIH_NEWS_FILTER=produk hukum,peraturan daerah,dprd
JDIH_FOOTER_CONTACT=Sekretariat DPRD Kota Singkawang|Jl. ... Singkawang|(0562) 000000|jdih@contoh.go.id
```

Nilai ditanam ke bundel saat build, jadi **publik** (jangan isi rahasia). Mengganti nilai berarti build ulang web dan rilis ulang Android. Aturan lengkap (karakter yang diizinkan, batas) ada di [.env.example](.env.example). URL API dan host Media Center adalah konstanta di `src/config/hosts.js`, bukan variabel `.env`. Variabel API sisi server (`DB_URL`, `CORS_ORIGINS`, dst.) terpisah dan dijelaskan di [api/README.md](api/README.md).

## Perintah

| Perintah                                   | Fungsi                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                              | Server pengembangan + API palsu                                                                                                              |
| `npm run build`                            | Build SPA produksi ke `dist/spa` (mode riwayat, perlu fallback ke `index.html`)                                                              |
| `npm run check`                            | Format, lint, gerbang keamanan statis, dan uji unit                                                                                          |
| `npm test`                                 | Uji unit (Vitest)                                                                                                                            |
| `npm run lint:security`                    | Gerbang keamanan statis (`scripts/check-security.mjs`)                                                                                       |
| `npm run test:e2e`                         | Uji peramban sungguhan: alur, axe WCAG 2.2 AA, CSP, XSS, galat, offline. Jalankan `npm run dev` lebih dulu (`BASE_URL` bila port bukan 9000) |
| `npm run test:api`                         | Uji API (49 tes). Butuh `TEST_DB_URL` ke database uji; tanpa itu tes yang butuh database dilewati. Lihat [api/README.md](api/README.md)      |
| `npx quasar build -m capacitor -T android` | Build Android (perlu toolchain di atas)                                                                                                      |

## Struktur

```
src/
  config/       hosts.js (konstanta host), endpoints.js, env.js (JDIH_NEWS_FILTER, JDIH_FOOTER_CONTACT)
  services/     http.js (klien HTTP tunggal), api.js, normalizers.js, news.js, notifications.js
  utils/        schema, validators, url (allowlist), sanitize (DOMPurify), text, format, errors, storage
  composables/  useResource, useAppearance, useToast, useOnline, useBarTitle
  components/   AppHeader/AppNav/AppFooter, HeroSlider, SearchCard, DocCard, PostCard, FilterForm/FilterSheet,
                StateView/ErrorState/SkeletonCards, charts/*, SafeHtml, AppIcon (ikon SVG inline)
  pages/        Beranda, Dokumen, Detail, Berita, Statistik, Tentang, Info, PUU, 404
  css/app.scss  token dan komponen (dari mockup yang disetujui)
api/            API baca-saja (Node + Fastify + MySQL): src, db (skema, data uji, hak akses), scripts, test
dev/mock-api/   API palsu untuk pengembangan
src-capacitor/  proyek Android (Capacitor 8)
tests/          unit (Vitest) dan e2e (puppeteer-core + axe-core; real-api.mjs memakai API nyata)
deploy/         contoh nginx dan header keamanan
docs/           kontrak API (openapi.yaml) dan laporan audit keamanan
design/         mockup yang disetujui, logo, dan DDL
```

## Android

- `src-capacitor/capacitor.config.js`: skema `https`, tanpa cleartext, `appId` `id.go.singkawangkota.dprd.jdih` (dikonfirmasi pemilik 2026-11-20; permanen setelah rilis Play Store).
- `src-capacitor/android/`: `allowBackup=false`, R8 aktif pada rilis, penandatanganan dari `keystore.properties` (tidak di-commit).
- Notifikasi peraturan baru belum aktif: mekanismenya belum diputuskan (lihat [PRODUCT.md](PRODUCT.md)). UI dan antarmuka penyedia sudah ada di `src/services/notifications.js`.
- Ikon: `public/icons/*` dan `favicon.ico` dibuat dari `design/favicon.png`, yang hanya 32×32 px, jadi ukuran besar adalah hasil pembesaran dan tampak buram. Untuk ikon Android dan Play Store sediakan PNG logo minimal 1024×1024 px. Layar pembuka belum dibuat.

## Status

Fase mockup disetujui, dan fase kode (fondasi, layar, Capacitor) serta API baca-saja (`api/`) selesai dan teruji pada database uji (skema nyata, data sintetis) serta dump contoh. Build Android belum bisa dibuat di mesin ini (tanpa JDK 21 dan Android SDK). Belum diverifikasi di lingkungan produksi: header di server sebenarnya, versi MySQL/MariaDB produksi, dan asumsi data yang tercantum di [api/README.md](api/README.md). Hal yang masih terbuka: lihat bagian "Hal yang masih terbuka" di [SECURITY.md](SECURITY.md) dan daftar keputusan di [PRODUCT.md](PRODUCT.md).
