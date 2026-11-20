---
version: 1
slug: "design-mockups-beranda-html"
primary_target: "design/mockups/beranda.html"
related_targets: ["design/mockups/index.html","design/mockups/hasil.html","design/mockups/detail.html","design/mockups/berita.html","design/mockups/statistik.html","design/mockups/tentang.html","design/mockups/info.html","design/mockups/keadaan.html"]
---

# Surface brief: JDIH DPRD Kota Singkawang (Beranda dan layar turunannya)

## Scope dan mode
Seluruh aplikasi, web dan Android (Capacitor): Beranda, Hasil pencarian dengan filter, Detail dokumen, Berita, Statistik, Tentang, dan keadaan (kosong, error, offline, memuat, 404, pengaturan). Mode: Operate untuk Beranda dan Hasil pencarian, Read untuk Detail, Berita, Statistik, dan Tentang. Lebar rancangan utama 360 px (Android), lalu 768 dan 1280. Revisi 2026-11-20 atas permintaan pengguna: hero Beranda berlatar foto slider seperti jdihsetwan.cianjurkab.go.id.

## Audience, tugas, bukti, batasan
- Tiga kelompok setara: masyarakat umum dan mahasiswa, ASN dan praktisi hukum, anggota dan staf DPRD. Tugas utama: cari lewat nomor + tahun atau judul, pastikan status berlaku dan riwayat ubah, telusuri per jenis atau baca berita.
- Bukti: data dokumen hanya contoh berlabel (database produksi belum berisi dokumen nyata). Berita nyata dari Media Center. Logo masih placeholder.
- Batasan: WCAG 2.2 AA, tanpa permintaan jaringan pihak ketiga, hanya bahasa Indonesia, mode terang dan gelap, status tidak pernah hanya lewat warna.

## Arah terpilih
Standar kategori ("canon"), dikonfirmasi disengaja oleh pengguna: konvensi portal JDIH dan Material 3 diambil apa adanya, pembedanya hanya kualitas eksekusi. Tolok ukur: peraturan.bpk.go.id, jdihsetwan.cianjurkab.go.id, JAKI dan Mobile JKN, Play Store dan Google Drive. Momen yang harus berhasil: hasil pencarian menampilkan jenis, Nomor/Tahun, dan status berlaku atau dicabut tanpa membuka dokumen. Tidak ada signature move yang diselipkan.

## Status
Mockup disetujui pengguna pada 2026-11-20 setelah revisi hero (slider foto). Kode aplikasi dibangun dari mockup di design/mockups/.

## Keputusan terbuka
- Notifikasi peraturan baru (wajib v1, Android): mekanisme belum diputuskan. Mockup memuat pengaturan dan penjelasan izin, bukan keputusan teknis.
- Foto hero: belum ada foto resmi (gedung, ruang paripurna) beserta hak pakainya. Mockup memakai tiga foto contoh dari Media Center (700 px, bukan aset akhir); produksi butuh foto resmi minimal 1920x1080 dan diekspor ke WebP/AVIF sekitar 150 KB.
- Logo resmi dan pedoman identitas belum diterima.

## Direction contract
THESIS: Portal produk hukum yang berperilaku persis seperti yang diharapkan pengunjung JDIH dan pengguna Android, dikerjakan setingkat tolok ukur: pencarian di pusat, status selalu terbaca, satu tangan cukup. Ia menolak motif tambahan dan tampilan ponsel yang sekadar diperkecil dari desktop; foto latar hero mengikuti konvensi portal JDIH atas permintaan pengguna dan tidak boleh mengalahkan keterbacaan pencarian.
OWN-WORLD: Foto dokumentasi sidang DPRD sebagai latar hero (bergantian tiap 6 detik, dapat dijeda) di bawah selubung navy 72% dari warna teks logo, teks putih, kartu pencarian putih; navy yang sama untuk elemen aktif, landasan netral dingin yang condong ke navy, biru tegas untuk aksi dan tautan, tiga warna status semantik (hijau berlaku, ambar diubah, merah dicabut) yang selalu berpasangan dengan ikon dan teks, seri warna data untuk grafik. Komponen Material 3: top app bar, navigation bar lima tujuan, kolom pencarian, filter chip, bottom sheet, kartu berbingkai tipis berradius 12. Satu keluarga sans (Public Sans, di-host sendiri; Roboto diganti karena detektor Impeccable menandainya sebagai font bawaan model) dengan angka tabular pada kolom, ritme jarak 4 pt, tanpa bayangan pada kartu.
STORY: Pengunjung langsung mengerti bahwa ini sumber resmi produk hukum DPRD Kota Singkawang, mencari dengan nomor + tahun atau kata kunci, melihat status dan riwayat perubahan pada hasil, membuka dokumen, menyalin kutipan, dan mengunduh PDF resmi. Berita terkait produk hukum tersedia tanpa meninggalkan aplikasi.
FIRST VIEWPORT: Ponsel 360x800. App bar putih dengan logo dan ikon notifikasi. Hero berlatar foto slider (selubung navy) berisi judul dua baris dan satu kartu pencarian (tab Kata kunci dan Nomor & tahun, kolom isian, jenis, tombol Cari), lalu satu baris pintasan filter yang berbagi baris dengan tombol jeda slider sehingga tinggi hero tidak bertambah. Di bawahnya katalog koleksi 2x2 dengan jumlah, lalu satu baris berita Media Center mengintip, dan navigation bar Material 3 di dasar. Desktop 1280: header dengan navigasi, hero foto selebar layar setinggi sekitar 525 px, semua isinya di tengah seperti jdihsetwan.cianjurkab.go.id (judul, kalimat pembuka, kartu pencarian satu baris dengan kata kunci, jenis, Cari, lalu pintasan), panah di tepi, titik slider dan tombol jeda di dasar; di bawahnya empat kartu koleksi satu baris, daftar produk hukum terbaru dan berita berdampingan.
FORM: canon, pintu keluar yang diambil pengguna dari putaran arah (bukan urutan dari daftar saya), seed:e03868192eb2f8df.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
