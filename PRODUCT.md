# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tiga kelompok pengguna dengan bobot setara (dikonfirmasi: "setara, tanpa prioritas"). Tidak ada satu kelompok pun yang boleh dimenangkan dengan mengorbankan dua lainnya, sehingga kepadatan informasi dipilih sedang.

- **Masyarakat umum dan mahasiswa.** Awam hukum, sebagian besar mengakses dari ponsel Android. Perlu istilah yang dijelaskan seperlunya dan alur yang sederhana.
- **ASN/perangkat daerah dan praktisi hukum.** Mencari cepat, membutuhkan nomor, tahun, dan status yang akurat, serta kutipan resmi.
- **Anggota dan staf DPRD.** Rujukan kerja harian dan rapat, sering membandingkan beberapa dokumen.

Tugas utama (dikonfirmasi, berurutan menurut pilihan pengguna):

1. Mencari dokumen lewat nomor + tahun atau judul.
2. Memastikan status berlaku/dicabut dan riwayat perubahan sebuah peraturan.
3. Menelusuri per jenis dokumen atau membaca berita terkait produk hukum.

Mengunduh PDF resmi tidak dipilih sebagai tugas utama, tetapi tetap menjadi aksi sekunder yang harus satu langkah dari hasil dan detail.

## Product Purpose

Portal resmi Jaringan Dokumentasi dan Informasi Hukum (JDIH) DPRD Kota Singkawang. Menyajikan produk hukum dan dokumentasi hukum kepada publik: peraturan perundang-undangan, monografi hukum, artikel/majalah hukum, putusan, dan dokumen pembentukan peraturan perundang-undangan. Keberhasilan: pengunjung menemukan dokumen yang tepat dengan cepat, tahu apakah dokumen itu masih berlaku, dan dapat memperoleh salinan resminya.

Situs yang ada saat ini (`jdih.dprd.singkawangkota.go.id`) adalah aplikasi Yii2 yang merender HTML di server dan tidak punya API. Produk ini adalah frontend baru untuknya: satu codebase Quasar menjadi situs web dan aplikasi Android.

## Positioning

Sumber asal produk hukum DPRD Kota Singkawang, bukan agregator. Situs ini terhubung ke portal nasional (jdihn.go.id) dan BPHN (bphn.go.id) sebagai tautan terkait. Yang harus dibuktikan produk ini lewat rancangan: status keberlakuan dan relasi antar peraturan (mencabut, dicabut oleh, mengubah, diubah oleh) tampil jelas pada setiap dokumen, dan berkas PDF resminya langsung dari penerbit.

## Operating Context

- Data dikelola lewat aplikasi admin Yii2 yang sudah ada (login di `/site/login`). Frontend baru hanya membaca lewat API publik read-only (service Node.js + Fastify, dibangun terpisah). Tidak ada login publik.
- Berita berasal dari Media Center Kota Singkawang (`mediacenter.singkawangkota.go.id`, WordPress REST), disaring dengan kata kunci dari satu variabel `.env`.
- Bahasa Indonesia. Istilah baku yang sudah dipakai: Nomor Peraturan, Tahun Terbit, Tanggal Penetapan, Tanggal Pengundangan, Tempat Terbit, Bahasa, T.E.U. Badan, Subjek, Sumber, Pemrakarsa, Bidang Hukum, Peraturan Terkait, Keterangan Status. Status: berlaku, dicabut, mencabut, diubah, mengubah, tidak memiliki daya guna.
- Struktur koleksi yang sudah ada: 4 tipe (Peraturan Perundang-undangan, Monografi Hukum, Artikel/Majalah Hukum, Putusan), sekitar 60 jenis peraturan, 9 kategori Dokumen Pembentukan PUU, 8 halaman Tentang Kami, Statistik, Tautan Terkait.
- Dugaan yang belum dikonfirmasi: banyak akses dari ponsel Android dengan kualitas jaringan yang tidak selalu stabil di Kalimantan Barat.

## Capabilities and Constraints

Wajib versi pertama (dikonfirmasi):

- Pencarian lewat nomor + tahun atau judul, dengan filter jenis, status, dan tahun.
- Status keberlakuan dan riwayat perubahan tampil jelas di daftar dan detail.
- Penelusuran per jenis dokumen.
- Berita Media Center dengan saringan kata kunci dari `.env`.
- Kepatuhan WCAG 2.2 AA sebagai syarat produk.
- **Notifikasi peraturan baru pada Android.** Mekanisme belum diputuskan. Syarat yang sudah pasti: tanpa akun pengguna, harus diaktifkan oleh pengguna, tidak boleh membuat API publik menerima tulisan atau database menjadi tidak read-only tanpa keputusan eksplisit. Kandidat 1: langganan topik FCM dengan pengirim di sisi server; menyentuh Firebase (pihak ketiga), izin notifikasi Android 13+, dan layanan backend tambahan. Kandidat 2, tanpa Firebase (ditanyakan pemilik 2026-11-20): pemeriksaan berkala di perangkat terhadap `GET /dokumen?sort=terbaru` yang mengingat ID terakhir dilihat, lalu notifikasi lokal; tanpa server pengirim, tanpa layanan Google, dan cocok dengan API baca-saja, tetapi tidak instan (sekitar 15 menit atau lebih, dan ditunda penghemat baterai). Kompatibilitas plugin latar belakang dengan Capacitor 8 belum diverifikasi, dan keputusan belum diambil.

Batasan teknis:

- Satu codebase Quasar (Vue 3, JavaScript): SPA web dan aplikasi Android lewat Capacitor 8.
- Hanya bahasa Indonesia. Mode terang dan gelap.
- Tanpa akun. API publik hanya GET. Klien tidak pernah mengakses database.
- Standar keamanan: OWASP Top 10 (2021), OWASP API Top 10, dan MASVS untuk build Android. Nilai `.env` ditanam ke bundel sehingga publik, dan tidak boleh berisi rahasia.

Ditunda ke versi berikutnya (tidak dipilih untuk v1): simpan dokumen offline di perangkat, mode hemat data.

## Brand Commitments

Hanya logo JDIH DPRD Kota Singkawang yang dipertahankan dari situs lama. Logo resmi dan pedoman identitas akan diberikan pemilik. Sementara itu memakai `logojdihdprd.png` dari situs berjalan sebagai placeholder beresolusi rendah dengan teks gelap, sehingga harus diletakkan di atas bidang terang. Palet, tipografi, dan komponen lama (navy, Inter, tampilan Bootstrap) tidak dipertahankan sebagai identitas.

**Arah visual (dikonfirmasi pengguna pada 2026-11-19): standar kategori, dikerjakan serapi mungkin.** Pengguna memilih pintu keluar "standar kategori" dari putaran arah, secara sengaja, meski sebelumnya menyebut "terasa generik" dan "terasa kaku" sebagai hal yang salah. Maknanya: konvensi portal JDIH dan aplikasi Android diambil apa adanya (pencarian sebagai pusat, katalog koleksi, daftar dokumen terbaru dengan lencana jenis dan status, navigasi Material 3) dan kualitas eksekusi yang menjadi pembeda, bukan gaya khas yang diselipkan. Tanpa ironi dan tanpa motif tambahan.

Tolok ukur kualitas yang dipilih pengguna: `peraturan.bpk.go.id`, `jdihsetwan.cianjurkab.go.id`, aplikasi pemerintah di Android (JAKI, Mobile JKN), dan aplikasi Material 3 di Android (Play Store, Google Drive). Hasil pengamatan tolok ukur web di ponsel: keduanya meluber ke kanan pada lebar 390 px dan memakai lima kartu koleksi setinggi layar, jadi batas yang harus dilampaui ada pada tampilan ponsel, bukan desktop.

## Evidence on Hand

- **Dokumen hukum nyata: belum ada.** Database saat ini hanya berisi 4 dokumen contoh ("Tesla"). Jangan memalsukan dokumen, nomor peraturan, jumlah, atau statistik milik DPRD. Data contoh wajib berlabel.
- **Berita nyata: ada.** Media Center menyediakan sekitar 4,6 ribu posting lewat API publik. Hitungan kata kunci: frasa "produk hukum" 6, "peraturan" 322, "dewan" 167, "dprd" 284.
- **Logo:** pemilik menyerahkan `design/favicon.png` (32×32 px, 2026-11-20); dipakai untuk favicon dan ikon aplikasi (ukuran besar hasil pembesaran, jadi buram). Logo di header dan footer masih placeholder beresolusi rendah (`src/assets/logo-jdih.png`, 7,9 KB). Belum ada pedoman identitas tertulis dan belum ada logo resolusi tinggi.
- **Foto hero:** belum ada foto resmi gedung atau ruang paripurna. Hero Beranda berlatar slider foto atas permintaan pengguna (2026-11-20, mengikuti `jdihsetwan.cianjurkab.go.id`); mockup memakai tiga foto sidang DPRD dari Media Center (700 px) sebagai contoh, dan pemilik memutuskan memakainya untuk sementara. Foto resmi beserta hak pakainya masih harus diberikan pemilik.
- **Alamat dan kontak footer:** diatur lewat `JDIH_FOOTER_CONTACT` di `.env`. Isi di database (halaman bawaan template BPHN) bukan data instansi dan tidak dipakai; nilai asli menunggu dari pemilik.
- Daftar fitur dan struktur data situs lama terdokumentasi dari halaman publiknya.

## Product Principles

1. **Status selalu terbaca.** Setiap dokumen menunjukkan berlaku, dicabut, atau diubah dengan teks dan ikon, bukan warna saja, di daftar maupun detail.
2. **Dari pencarian ke dokumen yang tepat secepat mungkin.** Nomor + tahun adalah jalur kelas satu, setara dengan kata kunci.
3. **Tidak mengklaim yang tidak ada di data.** Tidak ada angka, dokumen, atau pernyataan yang tidak berasal dari sumber. Data contoh selalu berlabel.
4. **Setara bagi semua pengguna.** Kepadatan sedang, istilah hukum dijelaskan seperlunya, ringan di jaringan lambat.
5. **Aman dan privat secara bawaan.** Akses baca saja, tanpa akun, tanpa pelacakan perilaku. Layanan pihak ketiga hanya bila fitur mewajibkannya dan atas persetujuan pengguna (misalnya notifikasi).

## Accessibility & Inclusion

Target formal WCAG 2.2 AA (dikonfirmasi sebagai syarat produk): pembaca layar (TalkBack), kontras teks 4,5:1, target sentuh 48dp pada Android, dukungan skala teks sistem, `prefers-reduced-motion`, mode gelap dengan kontras setara, status tidak hanya lewat warna, fokus tidak tertutup elemen sticky.
