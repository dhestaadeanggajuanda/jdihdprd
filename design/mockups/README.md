# Mockup JDIH DPRD Kota Singkawang

HTML dan CSS statis untuk ditinjau sebelum kode aplikasi ditulis. Ini bukan kode produksi dan tidak ikut build Quasar atau APK.

**Status: disetujui pengguna pada 2026-11-20**, setelah satu revisi (hero Beranda berlatar slider foto). Kode aplikasi dibangun dari mockup ini; perubahan visual berikutnya diputuskan bersama pengguna dan dicatat di bawah.

## Cara membuka

- Buka `index.html` di peramban (klik dua kali, atau "Open with Live Server" di VS Code). Galeri menautkan semua layar dan PNG.
- Setiap layar responsif: ubah lebar jendela ke 360, 768, dan 1280 px. Tambahkan `?theme=dark` untuk mode gelap, dan `#filter` pada `hasil.html` untuk sheet filter.
- `png/` berisi tangkapan layar: `<layar>-<lebar>[-fold|-gelap|-filter|-foto2|-foto3].png`. `-fold` adalah layar pertama, tanpa akhiran adalah halaman penuh, `-foto2` dan `-foto3` adalah hero Beranda dengan foto latar kedua dan ketiga.
- Slider hero di `beranda.html` berjalan sendiri tiap 6 detik. Tambahkan `?slide=2` untuk membuka foto tertentu, dan `?hold=1` untuk menahan pergantian otomatis (dipakai saat mengambil tangkapan layar).

## Isi

| Berkas | Layar |
|---|---|
| `beranda.html` | Beranda |
| `hasil.html` | Hasil pencarian dan filter |
| `detail.html` | Detail dokumen |
| `berita.html` | Berita Media Center |
| `statistik.html` | Statistik |
| `tentang.html`, `info.html` | Halaman Tentang dan tab Info (pengaturan, notifikasi) |
| `keadaan.html` | Kosong, error, offline, memuat, 404, izin notifikasi |
| `mockup.css` | Token dan komponen (bahan DESIGN.md) |
| `fonts/`, `img/` | Public Sans (di-host sendiri), logo placeholder, gambar berita, tiga foto latar hero (`hero-1..3.jpg`) |

## Catatan konten

- Dokumen, nomor, dan angka adalah **contoh**. Tidak ada klaim sebagai dokumen DPRD nyata.
- Judul, tanggal, dan gambar berita nyata dari Media Center Kota Singkawang (API publik).
- Logo adalah placeholder dari situs berjalan (200x50 px) sampai logo resmi diterima.
- **Foto latar hero adalah foto contoh, bukan aset akhir.** Ketiganya dokumentasi sidang DPRD dari Media Center Kota Singkawang (700 px, jadi tampak lunak jika diperbesar; selubung navy 72% menyamarkannya). Produksi membutuhkan foto resmi dengan hak pakai, minimal 1920x1080, diekspor ke WebP/AVIF sekitar 150 KB per foto. Asal foto:

  | Berkas | Sumber (mediacenter.singkawangkota.go.id) | Tanggal |
  |---|---|---|
  | `hero-1.jpg` | "30 Anggota DPRD Singkawang Masa Jabatan 2024-2029 Resmi Dilantik", `wp-content/uploads/2024/09/pelantikan-dprd.jpg` | 17 Sep 2024 |
  | `hero-2.jpg` | "DPRD Singkawang Ketok Palu Perubahan APBD 2025", `wp-content/uploads/2025/09/DF246130-2656-48EC-84D9-E192AE7FC161.jpeg` | 24 Sep 2025 |
  | `hero-3.jpg` | "Wali Kota Sampaikan Nota Pengantar Tiga Raperda ke DPRD", `wp-content/uploads/2025/11/2BF74221-3129-4EF9-B563-ABED4C7E25B5.jpeg` | 3 Nov 2025 |

- Slider hero dibuat dekoratif: foto tidak punya teks alternatif dan dilewati pembaca layar. Kontrolnya (jeda, titik, panah) tetap bisa dijangkau papan ketik, dan pergantian otomatis berhenti saat fokus atau kursor ada di hero, saat tab tersembunyi, atau bila pengguna meminta gerak dikurangi.
- Tidak ada permintaan jaringan pihak ketiga. Tautan keluar hanya anchor ke situs resmi dengan `rel="noopener noreferrer"`.

## Persetujuan

- 2026-11-20: pengguna menulis "mockup disetujui" setelah revisi hero (slider foto seperti jdihsetwan.cianjurkab.go.id). Tidak ada catatan revisi lain.
- Terbawa ke fase kode sebagai keputusan terbuka (bukan syarat persetujuan): foto resmi hero, logo resmi dan pedoman identitas, alamat/kontak footer, mekanisme notifikasi, dan kata kunci berita.
