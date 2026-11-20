---
name: JDIH DPRD Kota Singkawang
description: Portal produk hukum DPRD yang berperilaku seperti konvensi portal JDIH dan Material 3, dikerjakan serapi mungkin: pencarian di pusat, status selalu terbaca.
colors:
  navy: "#1f2b55"
  navy-2: "#2b3a6e"
  on-navy: "#ffffff"
  on-navy-2: "#c9d3f2"
  blue: "#1f4fc9"
  blue-hover: "#1a43ab"
  blue-tint: "#e3eafb"
  on-blue: "#ffffff"
  ground: "#f3f5fa"
  surface: "#ffffff"
  surface-2: "#eaeff8"
  line: "#d5dbea"
  line-strong: "#7c88ab"
  ink: "#121a36"
  ink-2: "#414d6e"
  ink-3: "#586487"
  ok: "#0f6b3c"
  ok-bg: "#e2f3e9"
  warn: "#7f4600"
  warn-bg: "#fdebd0"
  bad: "#a3222a"
  bad-bg: "#fbe3e4"
  notify-orange: "#c2410c"
  chart-warn: "#c77700"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: "3.5rem"
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "2.5rem"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.75rem"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  caption:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  sheet: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  gutter-phone: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-tonal:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.md}"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.blue}"
    rounded: "{rounded.md}"
    height: "48px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "36px"
    padding: "0 12px"
  chip-selected:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.navy}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "52px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  search-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
  status-ok:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    rounded: "{rounded.xs}"
    height: "24px"
  status-warn:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.xs}"
    height: "24px"
  status-bad:
    backgroundColor: "{colors.bad-bg}"
    textColor: "{colors.bad}"
    rounded: "{rounded.xs}"
    height: "24px"
  hero:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
  footer:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy-2}"
  nav-bar:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
  nav-bar-active-pill:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    width: "64px"
    height: "32px"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: JDIH DPRD Kota Singkawang

## Overview

**Creative North Star: "Loket Resmi yang Rapi"**

Sistem ini sengaja memakai standar kategori (arah "canon", dikonfirmasi pengguna): konvensi portal JDIH dan Material 3 diambil apa adanya, dan satu-satunya pembeda adalah kualitas eksekusi. Pengunjung harus langsung mengenali sumber resmi produk hukum, mencari lewat nomor + tahun atau kata kunci, lalu membaca jenis, Nomor/Tahun, dan status berlaku atau dicabut tanpa membuka dokumen. Tidak ada tanda tangan visual yang diselipkan; kerapian ritme, kontras, dan target sentuh adalah desainnya.

Permukaannya dingin dan datar: landasan abu kebiruan, kartu putih berbingkai tipis, navy untuk elemen aktif dan hero, biru tegas untuk aksi. Hero memakai foto dokumentasi sidang yang bergantian di bawah selubung navy 72% sehingga teks putih tetap terbaca di atas foto apa pun. Satu keluarga sans (Public Sans, di-host sendiri) menanggung semua peran. Ponsel dirancang sebagai tujuan utama (bottom bar, bottom sheet, satu tangan), bukan desktop yang diperkecil.

**Key Characteristics:**
- Pencarian di pusat: kartu putih di atas hero foto, tab Kata kunci dan Nomor & tahun.
- Status selalu berupa ikon + teks + warna, tidak pernah warna saja.
- Datar: kartu tanpa bayangan; kedalaman lewat lapisan nada dan garis tipis.
- Terang dan gelap penuh (Sistem/Terang/Gelap), skala teks 100/112,5/125% lewat rem.
- Target sentuh minimal 44-48px, fokus 3px terlihat di semua kontrol.

## Colors

Palet dingin condong navy dengan satu biru aksi dan tiga warna status semantik; semua pasangan teks/latar dipilih untuk WCAG AA. Mode gelap mendefinisikan ulang setiap token (nilai ada di sidecar), bukan membalik warna.

### Primary
- **Biru Aksi** (`blue`): tombol utama, tautan, indikator tab aktif, fokus, serta satu-satunya warna seri grafik. `blue-hover` untuk hover tombol utama.
- **Navy Resmi** (`navy`, `navy-2`): hero, footer, judul tebal dokumen, teks pada pil/tab aktif. Diturunkan dari warna teks logo.
- **Tinta Biru Muda** (`blue-tint`): latar status "terpilih": chip aktif, pil navigasi aktif, tombol tonal, kotak ikon koleksi dan berkas.

### Secondary (status semantik)
- **Hijau Berlaku** (`ok` pada `ok-bg`), **Ambar Diubah** (`warn` pada `warn-bg`), **Merah Dicabut** (`bad` pada `bad-bg`): lencana status dan banner galat. Selalu bersama ikon dan teks. Grafik memakai varian cadangan terpisah (`--cv-ok/warn/bad`, `chart-warn`) dengan teks gelap/terang yang disetel per mode.
- **Oranye Notifikasi** (`notify-orange`): hanya titik lencana notifikasi pada app bar.

### Neutral
- **Landasan Dingin** (`ground`): latar halaman. **Permukaan** (`surface`): kartu, app bar, kolom isian. **Permukaan 2** (`surface-2`): bottom bar, lencana netral, kotak kutipan, kerangka memuat.
- **Garis** (`line`) untuk bingkai kartu dan pemisah; **Garis Tegas** (`line-strong`) untuk bingkai kontrol interaktif (kolom, chip, segmen, tombol outline).
- **Tinta** (`ink`), **Tinta 2** (`ink-2`), **Tinta 3** (`ink-3`): teks utama, teks sekunder, teks meta dan placeholder.

### Named Rules
**The Status Triplet Rule.** Status dokumen selalu berupa warna + ikon + kata. Warna saja tidak pernah cukup.
**The One Action Blue Rule.** Biru aksi adalah satu-satunya warna interaktif dan satu-satunya warna seri grafik; navy menandai "sedang aktif/resmi", bukan "bisa diklik".
**The Veil Rule.** Teks di atas foto hero hanya berdiri di atas selubung navy seragam 72%; tanpa selubung, tanpa teks di atas foto.

## Typography

**Display/Body/Label Font:** Public Sans variabel (bobot 100-900, subset latin dan latin-ext, di-host sendiri) dengan cadangan system-ui, Segoe UI.

**Character:** Satu keluarga sans netral dan terbuka, bobot 700 untuk judul dan 400/500 untuk isi, sesuai nada portal resmi. Angka tabular (`.num`) pada kolom angka dan nilai grafik. Semua ukuran dalam rem agar skala teks pengguna bekerja.

### Hierarchy
- **Display** (700, 1.625rem ponsel / 2.25rem tablet / 3rem desktop, line-height 2rem / 2.75rem / 3.5rem): judul hero Beranda saja.
- **Headline** (700, 1.625rem ponsel, 2rem desktop; detail dokumen 1.5rem ke 2rem): judul halaman dan judul dokumen (baris nomor berwarna navy, baris judul bobot 400 di bawahnya).
- **Title** (700, 1.25rem/1.75rem): judul seksi, judul sheet, judul keadaan kosong. Judul panel 1.125rem.
- **Body** (400, 1rem/1.5rem; prosa 1rem/1.625rem maks 68ch): teks isi.
- **Label** (500, 0.875rem/1.25rem; teks tombol 1rem): tombol, chip, tab, label kolom.
- **Caption** (500, 0.75rem/1rem; meta 0.8125rem): lencana, meta, tanggal, penjelas.

### Named Rules
**The Rem Only Rule.** Ukuran teks selalu rem. Piksel untuk teks merusak pengaturan "Ukuran teks" dan skala sistem.
**The Tabular Numerals Rule.** Angka yang dibandingkan antarbaris (jumlah, tahun, nilai grafik) memakai angka tabular.

## Layout

Pembungkus konten maks 1200px, gutter 16px (ponsel), 24px (tablet), 32px (desktop). Ritme jarak kelipatan 4 (4, 8, 12, 16, 24, 28); jarak seksi 28px, dipadatkan ke 16px pada ponsel agar baris kedua koleksi berhenti di atas bottom bar pada 360x800.

Titik pecah: di bawah 600px ponsel dengan app bar atas dan bottom bar lima tujuan; 600-1023px tablet dengan rail kiri 80px; 1024px ke atas desktop dengan header 72px berisi navigasi utama dan bottom bar/rail hilang; 768px kartu pencarian menjadi satu baris (kata kunci, jenis, Cari); 1200px kolom cari di header melebar menjadi 208px. Beranda: hero, strip berita, koleksi (2x2 ponsel, 4 kolom tablet ke atas), daftar produk hukum terbaru dan berita (3 kolom desktop). Hasil pencarian: panel filter 304px sticky di desktop, bottom sheet di ponsel. Detail dokumen: kolom utama + aside 352px sticky di desktop.

Area aman (potongan layar, bilah gestur) dihormati di app bar dan bottom bar saat berjalan sebagai aplikasi Android.

## Elevation & Depth

Datar secara default. Kedalaman dibangun dari lapisan nada (ground, surface, surface-2) dan bingkai 1px; kartu tidak punya bayangan, hanya bingkai yang menegas saat hover. Bayangan hanya muncul pada lapisan yang benar-benar melayang di atas konten.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 -8px 32px var(--shadow)`): bottom sheet filter dan notifikasi.
- **Snackbar** (`box-shadow: 0 4px 16px var(--shadow)`): toast sementara.
- **Fokus kolom** (`box-shadow: 0 0 0 3px` biru 30%): cincin halo kolom isian saat fokus.
- **Keterbacaan hero** (`text-shadow: 0 1px 3px rgb(0 0 0/0.3)`): judul dan kalimat pembuka hero di atas foto.

### Named Rules
**The Flat Cards Rule.** Kartu, panel, dan daftar tidak pernah berbayang; hanya sheet dan snackbar yang melayang.

## Shapes

Radius berjenjang: 6px lencana dan status, 8px chip dan kotak ikon kecil, 12px kartu, kolom, dan tombol (radius standar), 16px kartu pencarian, 28px sudut atas bottom sheet, bulat penuh untuk tombol ikon, pil navigasi, dan segmen (20px). Bingkai tipis 1px untuk kartu, 1.5px garis tegas untuk kontrol. Ikon: SVG garis 24px, stroke 2, ujung bulat (18 dan 16px untuk ukuran kecil), satu set tunggal di `icons.js`.

## Components

### Buttons
- **Shape:** radius 12px, tinggi min 48px, padding horizontal 20px, bobot 500.
- **Primary:** latar biru aksi, teks putih; hover `blue-hover`.
- **Tonal:** latar biru muda, teks navy (teks tinta pada mode gelap).
- **Outline:** bingkai garis tegas, teks biru. **Text:** tanpa bingkai, teks biru.
- **Ikon:** tombol ikon bulat 48px; fokus selalu cincin 3px.

### Chips
- Tinggi 36px, radius 8px, bingkai garis tegas. Terpilih: latar biru muda tanpa bingkai kontras (`aria-pressed`). Di atas hero: latar navy tembus + bingkai putih, terpilih putih berteks navy. Chip topik read-only lebih kecil (28px, latar surface-2).

### Cards / Containers
- Radius 12px, latar surface, bingkai 1px `line`, padding 16px, tanpa bayangan; hover menegaskan bingkai. Kartu dokumen: lencana jenis dan status di atas, judul (nomor tebal navy), riwayat, meta, kaki dengan aksi. Seluruh kartu dapat diklik lewat tautan teregang.

### Inputs / Fields
- Tinggi 52px (48px pada filter), bingkai 1.5px garis tegas, radius 12px, ikon awalan abu. Fokus: bingkai biru + halo 3px. Galat: teks merah 0.875rem berbobot 500 di bawah kolom. Pilihan filter memakai input asli (radio/centang) yang bisa difokus.

### Navigation
- **Bottom bar (ponsel):** latar surface-2, lima tujuan, ikon di pil 64x32 (aktif: biru muda, label bobot 700). **Rail (tablet):** 80px, pil 56px. **Header (desktop):** tautan radius 10px, aktif biru muda berteks navy. Tab halaman: garis bawah biru 3px pada tab aktif.

### Hero dan Kartu Pencarian (komponen penanda)
- Foto bergantian crossfade 1 dtk, ganti tiap 6 dtk, dapat dijeda (tombol 40px), titik slider dan panah 48px pada desktop. Selubung navy 72%. Kartu pencarian putih radius 16px di dalamnya, segmen dua tab, kolom, jenis, tombol Cari, lalu baris pintasan chip.

### Status, Grafik, Keadaan
- Lencana status 24px radius 6px, bobot 700, ikon + teks. Grafik: bar horizontal, kolom, dan bar segmen status; selalu disertai tabel padanan dalam `details`. KPI: angka 2rem bobot 700. Keadaan: kosong/galat dengan cincin ikon 72px, banner offline/galat, kerangka memuat dengan shimmer, snackbar gelap.

### Gerak
- Hanya crossfade hero, transisi titik slider 0.25 dtk, dan shimmer 1.4 dtk. `prefers-reduced-motion` mematikan semua animasi dan transisi.

## Do's and Don'ts

### Do:
- **Do** tampilkan jenis, Nomor/Tahun, dan status (ikon + kata + warna) pada setiap hasil.
- **Do** tulis ukuran teks dalam rem dan uji pada skala 125%.
- **Do** jaga target sentuh 44-48px dan cincin fokus 3px (putih di atas hero).
- **Do** definisikan setiap warna baru untuk mode terang dan gelap sekaligus.
- **Do** beri setiap grafik tabel padanan dan pakai satu warna seri (`blue`).
- **Do** letakkan teks di atas foto hanya di bawah selubung navy 72%.

### Don't:
- **Don't** pakai bayangan pada kartu atau daftar.
- **Don't** pakai warna saja untuk menandai status atau seri data.
- **Don't** jadikan navy warna tautan atau tombol; itu peran biru aksi.
- **Don't** perkecil tampilan desktop untuk ponsel; ponsel memakai bottom bar dan bottom sheet.
- **Don't** minta sumber daya pihak ketiga (font, ikon, gambar); semua di-host sendiri.
- **Don't** menambah keluarga font kedua atau ikon berbasis glyph/emoji.

## Tidak dikanonisasi

Placeholder dan keputusan terbuka, bukan aturan sistem: foto hero (foto contoh Media Center 700 px) dan logo (200x50 dari situs lama) adalah placeholder; ikon aplikasi/favicon masih bawaan Quasar; spanduk "Data contoh" (kuning `#fff1bf`) hanya penanda API pengembangan; notifikasi belum aktif. Dua pola default (kartu KPI angka besar, koleksi ikon + judul + angka) berasal dari mockup yang disetujui pengguna, dicatat sebagai pola yang ada, bukan sebagai teladan untuk permukaan baru.
