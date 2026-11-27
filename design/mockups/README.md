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
| `profil.html`, `profil-menu.html` | Halaman Profil (contoh: Dasar Hukum) dan tab Profil di ponsel (halaman instansi, kebijakan, notifikasi, tampilan, tautan) |
| `privasi.html`, `cookie.html` | Kebijakan Privasi dan Kebijakan Cookie (naskah contoh) |
| (semua layar, >= 1024 px) | Widget aksesibilitas: tombol kiri bawah dan panel. Di bawah 1024 px pilihannya ada di `profil-menu.html` bagian Tampilan |
| (semua layar) | Widget kanan bawah: Asisten AI dan WhatsApp (panel chat; layar penuh di ponsel) |
| `pratinjau.html` | Keadaan pratinjau dokumen (memuat, gagal, terlalu besar, situs lain, hasil pindai, banyak berkas). Pratinjau sendiri ada di `detail.html` |
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

## Perubahan 2026-11-26: menu Profil dan halaman kebijakan (DISETUJUI 2026-11-27, sudah dikodekan)

Permintaan pengguna: ganti menu "Tentang" menjadi "Profil" dan pindahkan ke sebelah "Beranda", tambah halaman Kebijakan Privasi dan Kebijakan Cookie, dibuat dulu sebagai mockup. Belum ada kode aplikasi yang diubah.

- Urutan header desktop: Beranda, **Profil**, Dokumen, Pembentukan PUU, Berita, Statistik. Tab bawah ponsel dan rail tablet: Beranda, **Profil**, Dokumen, Berita, Statistik. Tab "Info" lama menjadi Profil (keputusan pengguna); ikonnya bangunan berpilar, bukan ikon orang, karena aplikasi tanpa akun.
- Kebijakan: grup "Kebijakan" di hub Profil (ponsel, karena footer disembunyikan di bawah 600 px), grup kedua di menu samping Profil (desktop), dan bilah tautan hukum di bawah footer.
- **Tanpa spanduk cookie** (keputusan pengguna): situs tidak memasang cookie dan tanpa pelacak, tidak ada yang perlu disetujui.
- Naskah kebijakan adalah **contoh**, ditulis dari perilaku aplikasi sebenarnya: tanpa cookie; tiga entri penyimpanan lokal (`jdih:tampilan`, `jdih:notifikasi`, dan sejak 2026-11-27 `jdih:aksesibilitas`); permintaan tanpa kredensial dan tanpa alamat rujukan; berita dimuat langsung dari Media Center; aplikasi Android hanya izin internet; notifikasi belum aktif. Hal yang hanya diketahui instansi (kontak, masa simpan log, tanggal berlaku) diberi penanda `[diisi instansi]`. Isi akhir perlu ditinjau instansi, ini bukan nasihat hukum.
- Tombol "Hapus data tersimpan" di Kebijakan Cookie adalah usulan agar kebijakan bisa langsung ditindaklanjuti; dapat dicoret.
- Perbaikan sampingan pada mockup: menu samping desktop tidak lagi meregang pada halaman panjang, dan kelas footer `.cols` yang bentrok dengan kelas grafik batang (membuat kolom footer meluber 32 px) diganti `.fcols`.

## Perubahan 2026-11-27: widget aksesibilitas (DISETUJUI 2026-11-27, sudah dikodekan)

Permintaan pengguna: widget aksesibilitas mengambang, dibuat dulu sebagai mockup. Belum ada kode aplikasi yang diubah. **Tidak ada aturan tertulis** yang menjadi dasar: pengguna menyatakan pemeriksa pasti memintanya. Karena itu daftar fitur diambil dari WCAG 2.2 dan permintaan pengguna. **Target:** WCAG dengan batas minimum Level A dan saran target AA (kontras tinggi, jarak teks, dan ukuran teks adalah kriteria AA). Tidak ada teks di mockup atau dokumen yang mengaku patuh pada aturan tertentu.

Sumber rujukan (hanya dibaca): `design/a11y-widget` (identik dengan `moso/packages/a11y-widget`). Ditulis ulang sebagai komponen Vue pada fase kode; paketnya tidak dipakai. Pola yang dipakai ulang: atribut `data-a11y-*` di `<html>`, daftar putih nilai tersimpan, `aria-pressed`/`aria-live`, Esc dan fokus kembali. Yang tidak dipakai: filter pada `body > *` (menggeser elemen `position:fixed` seperti tab bawah), penyuntikan `<style>` dan font lewat JavaScript, dua font tambahan, sembunyikan gambar, warna terbalik, panduan baca, pembaca teks.

- **Desktop (>= 1024 px, hanya web):** tombol bulat 48 px di kiri bawah (`left/bottom: 16px`) yang membuka panel 400 px non-modal. Isi: Teks (ukuran teks, jarak teks lebih lega, garis bawah dan sorot tautan) dan Tampilan (tema, kontras tinggi, skala abu-abu, hentikan animasi, kursor besar), lalu Atur ulang dan catatan penyimpanan dengan tautan ke Kebijakan Cookie. Panel tidak menyentuh header (tinggi maksimal `100dvh - 164px`) dan bergulir di dalam bila layar pendek, dengan Atur ulang tetap terlihat.
- **Di bawah 1024 px (web):** tanpa tombol melayang. Pilihan yang sama muncul di Profil › Tampilan sebagai baris + sakelar (target >= 56 px). Di >= 1024 px bagian Tampilan di Profil hanya satu baris "Aksesibilitas dan tampilan" yang membuka panel, jadi tidak ada dua kontrol untuk hal yang sama. Tautan footer "Pengaturan tampilan" di >= 1024 px menjadi tombol pembuka panel.
- **Android:** widget dan bagian Aksesibilitas di Profil disembunyikan (TalkBack dan pengaturan sistem sudah ada). Tangkapan 360 dan 768 px memperlihatkan web.
- **Satu sumber data:** tema dan ukuran teks tetap di `jdih:tampilan`, hanya satu komponen kontrol dua tempat. Enam pilihan baru (kontras, jarak teks, tautan, animasi, abu-abu, kursor) disimpan di kunci baru `jdih:aksesibilitas`, jadi Kebijakan Cookie dan Privasi menambah satu entri (kedua mockupnya ikut diperbarui; mudah dicoret). **Atur ulang** mengembalikan semuanya, termasuk tema ke Sistem dan ukuran teks ke Normal.
- **Kursor besar** hanya tampil bila ada penunjuk halus (`any-pointer: fine`); tangkapan ponsel memakai `?touch=1` untuk meniru layar sentuh.
- **Posisi di footer:** footer diberi `padding-bottom` (144 px sejak ada widget kanan bawah, lihat bagian berikutnya) dan `html` diberi `scroll-padding-bottom`, sehingga saat digulir mentok tombol berada di ruang kosong di bawah bilah hukum.
- **Cincin fokus ganda** (pita dalam `--ground`/putih, pita luar `--ink`) dari token yang ada, terbaca di latar terang, gelap, dan navy footer. Tombol memakai batas putih (terang) atau `--ground` (gelap).
- **Mockup ini interaktif** (skrip kecil khusus mockup, bukan kode produksi): buka/tutup, Esc, fokus kembali, tutup saat fokus keluar, sakelar mengubah atribut di `<html>` dan efeknya berlaku di halaman, bertahan antarhalaman lewat `localStorage` mockup. Tambahkan `?a11y=open` untuk membuka panel, `?a11yset=contrast,links,spacing,gray,motion,cursor` untuk menyalakan pilihan, `?touch=1` untuk meniru layar sentuh. Ukuran teks hanya menandai pilihan (mockup memakai satuan piksel).
- **Kontras tinggi lewat token**, bukan filter. **Skala abu-abu** lewat `filter: grayscale(1)` pada `html`: terukur bahwa tab bawah dan tombol tetap relatif ke layar. **Hentikan animasi** mematikan animasi CSS dan menghentikan slider hero.

### Hasil pemeriksaan (dijalankan 2026-11-27)

- **Alur papan ketik** (probe DOM): tidak ada autofokus saat dimuat; buka memindahkan fokus ke judul panel; Esc menutup dan fokus kembali ke pembuka (tombol atau tombol footer); fokus yang keluar menutup panel dan tidak merebut fokus; sakelar dan Atur ulang bekerja dan diumumkan lewat `aria-live`.
- **Target:** semua kontrol di panel dan baris sakelar >= 48 px (tombol segmen semula 46 px dan tautan Kebijakan Cookie 33 px, sudah diperbaiki).
- **Footer:** saat digulir mentok, tombol tidak beririsan dengan teks, tautan, atau gambar footer di 1024x768, 1280x800, 1366x650, dan 1440x900 (Beranda, Dokumen, Privasi).
- **Tengah gulir:** di 1280 px ke atas tombol tidak menimpa konten (gutter `.wrap` 72 px di 1280 px, 152 px di 1440 px). **Di 1024 sampai sekitar 1275 px tombol menutupi sebagian kecil sudut kiri bawah konten saat digulir** (gutter 32 sampai 70 px). Ini bawaan tombol mengambang di lebar itu, bukan nol; dikurangi dengan ukuran 48 px, Esc, dan `scroll-padding-bottom` agar elemen terfokus tidak bersembunyi di belakangnya.
- **Kontras** (`contrast-a11y.mjs`): semua pasangan lolos di terang, gelap, dan masing-masing dengan kontras tinggi (teks >= 4,5:1, kontras tinggi >= 7:1, komponen dan cincin fokus >= 3:1).
- **Luapan horizontal** dengan jarak teks menyala: tidak ada di 360, 768, dan 1280 px pada 10 halaman, dan tidak ada teks terpotong. Pemeriksaan ini menemukan dua luapan di mockup yang sudah ada (domain panjang di baris Tautan terkait dan kolom Urutkan di Dokumen); keduanya diperbaiki di CSS.
- **Detektor Impeccable:** temuan baru dari widget hanya dua peringatan `cramped-padding` pada kontrol segmen (segmen terpilih memang menempel ke garis tepi, pola yang sama dengan segmen "Kata kunci / Nomor & tahun" di hero). Sisanya temuan lama: bilah status, catatan mockup, radius header.

### Cacat lama yang ditemukan dan diperbaiki saat pekerjaan ini

- **Hero slider Beranda hilang** dari `beranda.html` hasil rakit ulang 2026-11-26 (sumber perakit lama dipakai, sehingga foto latar, tombol jeda, titik, dan panah tidak ada, dan tangkapan layarnya ikut salah). Sudah dipulihkan identik dengan versi yang disetujui pada 2026-11-20; semua PNG diambil ulang.
- **Tombol segmen "Sangat besar" terpotong** di 360 px (dua baris, terpangkas) sejak mockup Info yang disetujui. Diperbaiki (`white-space: nowrap`). **Kemungkinan besar cacat yang sama ada di `InfoPage.vue`** (memakai kelas `.seg` yang sama): periksa saat fase kode.
- Jangkar `#tampilan` tertutup app bar (`scroll-margin-top`), dan baris pengaturan ikut membungkus bila jarak teks diperlebar.

### Hal terbuka

- Tidak ada aturan tertulis: bila pemeriksa menyebut nomor aturan, fitur dicocokkan satu per satu saat itu (pembaca teks ditambah bila diwajibkan).
- Di bawah 1024 px pemeriksa tidak melihat tombol mengambang; mereka menemukannya di Profil › Tampilan. Alternatif bila perlu: tombol kecil di atas tab bawah (tidak dirancang).
- Widget adalah pelengkap, bukan pengganti: halaman sendiri dirancang menuju target WCAG 2.2 (minimum Level A, saran AA). Itu target, bukan klaim kepatuhan.
- `design/a11y-widget` belum masuk git; tidak disentuh.

## Perubahan 2026-11-27 (2): pratinjau dokumen, WhatsApp, dan Asisten AI (DISETUJUI 2026-11-27, sudah dikodekan)

Permintaan pengguna: saat dokumen peraturan dibuka tampilkan pratinjau dokumennya, dan tambah widget mengambang di pojok kanan bawah: WhatsApp, dengan chatbot AI di atasnya. Belum ada kode aplikasi yang diubah. Keputusan pengguna: **chatbot: mockup dulu, backend diputuskan belakangan**; **pratinjau: pdf.js dibundel, dimuat malas**.

### Pratinjau dokumen (`detail.html`, `pratinjau.html`)

- Seksi "Pratinjau dokumen" di kolom utama halaman detail, tepat di bawah baris aksi: pilih berkas (chip bila lebih dari satu lampiran), penunjuk halaman dengan sebelumnya/berikutnya, perkecil/perbesar/lebar halaman, layar penuh. Halaman bertumpuk dan digulir di dalam kotak setinggi 640 px. Unduh PDF tetap aksi utama.
- **Ponsel dan tablet (< 1024 px):** kartu ringkas (gambar halaman 1, jumlah halaman, ukuran) dengan tombol "Buka pratinjau" yang membuka penampil layar penuh (app bar, halaman menurun, bilah halaman dan perbesaran di bawah). **Berkas baru diunduh saat tombol diketuk.** **Desktop (>= 1024 px):** pratinjau inline, **dimuat otomatis saat seksi terlihat** (mockup menampilkan keadaan sudah dimuat; keadaan memuat ada di `pratinjau.html`). Batas awal ukuran berkas 25 MB (nilai awal; contoh di keadaan "terlalu besar" 38 MB). Tablet mengikuti ponsel (titik pisah sama dengan tombol kanan bawah, hemat data); mudah diubah bila tablet ingin inline.
- **Keadaan** (`pratinjau.html`): memuat, gagal dimuat, berkas terlalu besar (contoh 38 MB, ambang diputuskan di fase kode), berkas di situs lain (pengalihan ke host luar tidak bisa diambil karena CSP), dokumen hasil pindai (catatan: teks tidak dapat dipilih atau dibaca pembaca layar), lebih dari satu berkas.
- **Halaman kertas adalah contoh yang digambar** dengan HTML/CSS, bukan PDF sungguhan. Aplikasi memakai `pdfjs-dist` (versi dipin, `isEvalSupported:false`, tanpa skrip dan XFA), dimuat malas, worker berupa berkas statis satu origin. **API dan CSP tidak berubah**: pdf.js memakai `fetch` ke URL lampiran yang sama (`Content-Disposition` tidak memengaruhi `fetch`), sedangkan iframe bawaan akan terhalang `frame-ancestors 'none'` milik API.
- Aksesibilitas: tiap halaman `role="img"` berlabel "Halaman n dari N"; penampil layar penuh berupa dialog (Esc menutup, fokus kembali ke pemicu, fokus awal ke judul); tombol >= 48 px. Kertas tetap putih di mode gelap.

### Widget kanan bawah: Asisten AI (atas) dan WhatsApp (bawah)

- **>= 1024 px:** dua tombol bulat 52 px bertumpuk (celah 12 px), Asisten di atas dan WhatsApp di bawah, `right: 16px; bottom: 16px`. Label ("Tanya Asisten JDIH", "Chat WhatsApp") tampil sebagai tooltip saat hover dan fokus (`?tip=1` memaksanya tampil untuk tangkapan layar). Penanda "AI" di tombol chatbot. **Di bawah 1024 px: satu tombol pemicu yang membuka menu dua pilihan** (bagian 3 di bawah). Di ponsel tombol naik di atas tab bawah (`bottom: 96px` + area aman) dan **menyingkir saat halaman digulir ke bawah**, muncul lagi saat digulir ke atas, saat menu dibuka, atau saat tombol menerima fokus.
- **Warna:** tombol chatbot memakai token yang ada. WhatsApp memakai **hijau merek `#128C7E`**, satu-satunya warna di luar `DESIGN.md` (pemeriksa Impeccable menandainya sebagai saran `design-system-color`; disengaja). Glif putihnya 4,14:1 di atasnya.
- **Footer** diberi `padding-bottom` dan `scroll-padding-bottom` agar saat digulir mentok tombol berada di ruang kosong di bawah bilah hukum: **96 px untuk 600-1023 px (satu tombol)** dan **144 px dari 1024 px (dua tombol bertumpuk)**; menggantikan 88 px untuk widget aksesibilitas, yang kini ikut mendapat ruang lebih. Di bawah 600 px footer disembunyikan.
- **WhatsApp** hanya tautan `https://wa.me/<nomor>?text=...` (`target=_blank`, `rel="noopener noreferrer"`), tanpa skrip WhatsApp. Di detail dokumen pesan awalnya memuat judul dan tautan dokumen. **Nomor dari `.env` (`JDIH_WHATSAPP`); bila kosong, tombol tidak ditampilkan.** Di mockup nomornya penanda (`6200000000000`).
- **Panel Asisten:** desktop dan tablet 400 x 540 px non-modal (desktop: di atas kedua tombol; tablet: menempati tempat tombol, yang disembunyikan selama panel terbuka); ponsel lembar layar penuh. Isi: judul dengan penanda AI, tombol Hapus percakapan dan Tutup, area percakapan `role="log"`, sapaan dengan **lingkup yang jujur** ("mencari produk hukum berdasarkan judul, jenis, nomor, tahun, dan status; belum bisa membaca isi pasal", tiap pertanyaan dijawab sendiri-sendiri), tiga contoh pertanyaan, kolom tanya (3 sampai 500 karakter, penghitung, Enter kirim, Shift+Enter baris baru), catatan tetap "Jawaban otomatis, bukan nasihat hukum resmi. Pertanyaan diproses AI dan dicatat tanpa identitas" dengan tautan Kebijakan Privasi.
- **Jawaban** berupa teks biasa (bukan HTML) lalu kartu **Sumber** (status berlaku/dicabut, jenis nomor tahun, menuju halaman dokumen di situs ini). Keadaan: awal, memuat (kerangka `shimmer`, tombol Batal), jawaban, tidak ditemukan, 429 ("Terlalu banyak pertanyaan"), gangguan layanan (Coba lagi, Cari manual, WhatsApp), offline.
- **Kontrak:** `POST` JSON `{question}` -> `{answer, sources[], disclaimer}`, sama dengan `agent-jdih` (`D:\Projects\agent-jdih`, hanya dibaca). Klien hanya menerima tautan sumber ke host sendiri dan mengubahnya menjadi rute `/dokumen/:id`. **Backend belum diputuskan**; jawaban di mockup adalah contoh.
- **Tidak disimpan di perangkat:** riwayat hilang saat halaman ditutup, jadi **tidak ada entri baru di Kebijakan Cookie** (hanya satu kalimat). Kebijakan Privasi mockup ditambah butir Asisten AI (lokasi pemrosesan dan masa simpan `[diisi instansi]`) dan WhatsApp (pihak ketiga hanya saat ditekan).
- **Catatan membaca PNG:** tangkapan halaman penuh menampilkan kedua tombol di dasar halaman, bukan posisi mengambangnya; tangkapan ponsel yang membuka jangkar (`profil-menu-360-tampilan`) tidak menampilkan tombol karena lompatan jangkar dihitung sebagai gulir ke bawah.
- Mockup interaktif (skrip kecil khusus mockup): buka/tutup, Esc, fokus kembali, tutup saat fokus keluar, kirim pertanyaan contoh, chip contoh. `?chat=awal|jawab|memuat|kosong|429|galat|offline` membuka panel pada keadaan itu; `?fabmenu=open` membuka menu satu tombol (di bawah 1024 px); `?viewer=open` membuka penampil pratinjau.

### Hasil pemeriksaan (dijalankan 2026-11-27)

- **Papan ketik** (probe DOM): tidak ada autofokus saat dimuat; buka chat memindahkan fokus ke judul; Esc menutup dan fokus kembali ke tombol; fokus yang keluar menutup panel; Enter mengirim. Penampil pratinjau: buka (fokus ke judul, widget kanan dan kiri disembunyikan), Esc menutup dan fokus kembali ke pemicu. Semua kontrol >= 48 px (tautan Kebijakan Privasi di panel semula 14 px, kini baris 48 px).
- **(Susunan dua tombol, sebelum revisi 3; angka terbaru untuk semua lebar ada di bagian 3.)** **Footer:** saat digulir mentok, kedua tombol tidak beririsan dengan teks, tautan, atau gambar footer di 768x1024, 1024x768, 1280x800, 1366x650, dan 1440x900 (Beranda, Dokumen, Detail, Privasi), termasuk cincin fokus 6 px.
- **(Susunan dua tombol, sebelum revisi 3.)** **Tengah gulir (ukur, bukan klaim nol):** di 1440 px dan 1280 px tombol tidak menimpa konten (tepi konten di 1280 px = 1208, tepi tombol = 1212; cincin fokus 6 px menyentuh teks "Lihat semua" hingga 2 px). **Di 1024 px (gutter 32) dan di tablet 768 px (konten sampai x=744, tombol mulai x=700) kedua tombol menutupi sisi kanan konten pada posisi gulir tertentu, termasuk tombol unduh di kartu hasil.** **Di ponsel 360 px** kedua tombol menutupi sisi kanan konten (kartu koleksi dan "Lihat semua" di Beranda, tombol unduh kartu hasil, "Bagikan" di Detail 360x640; tombol "Buka pratinjau" di Detail 412x915 tertimpa di tepi kanannya, labelnya di tengah tetap terbaca); celah ke tab bawah 11 px. Mitigasi di mockup: menyingkir saat menggulir ke bawah di ponsel. Alternatif bila dirasa mengganggu: satu tombol yang membuka dua pilihan (tidak dirancang).
- **Kontras** (`contrast-kanan.mjs`): semua pasangan lolos di terang dan gelap (teks >= 4,5:1; glif WhatsApp, glif chatbot, batas tombol, cincin fokus >= 3:1).
- **Luapan horizontal** dengan jarak teks (widget aksesibilitas) menyala: tidak ada di 360, 768, dan 1280 px pada 11 halaman, dan pada chat terbuka (awal, jawaban, galat) dan penampil terbuka; tidak ada teks terpotong kecuali judul penampil yang memang diberi elipsis. Ditemukan dan diperbaiki: kartu pratinjau dan tombol keadaan meluber di 360 px.
- **Detektor Impeccable:** temuan baru hanya (a) warna hijau WhatsApp (disengaja), (b) `cramped-padding` pada halaman kertas contoh (diperbaiki: padding dipindah ke halaman), (c) titik berdenyut pada indikator memuat (diganti kerangka `shimmer` yang sudah ada); dua peringatan `seg` lama tetap.

### Hal terbuka (pratinjau dan widget kanan)

- **Backend chatbot belum diputuskan.** `agent-jdih` bawaannya mengindeks JDIH Pemkot (`jdih.singkawangkota.go.id/api`, bentuk respons berbeda dari API DPRD ini) dan hanya mencari berdasarkan metadata; PDF di JDIH umumnya hasil pindai tanpa teks digital. Menjawab dokumen DPRD butuh penyesuaian di proyek itu (di luar repo ini). Tombol chatbot tidak boleh dirilis dengan jawaban contoh; di kode tombolnya tersembunyi bila `JDIH_ASISTEN_URL` kosong.
- **Privasi:** `agent-jdih` mencatat `ip_hash`, pertanyaan, dan jawaban di SQLite tanpa batas simpan yang terlihat di kode; masa simpan dan lokasi pemrosesan perlu dari instansi.
- **Nomor WhatsApp** dari instansi.
- **Pratinjau memakai kuota data**; PDF hasil pindai bisa besar. Ambang ukuran dan pemuatan otomatis atau lewat ketukan perlu keputusan.
- Dua mockup lain (Profil/Kebijakan, widget aksesibilitas) disetujui bersama pekerjaan ini pada 2026-11-27; ketiganya sudah dikodekan.

## Perubahan 2026-11-27 (3): menu tombol kanan bawah, Asisten kosong, aturan pratinjau, teks aksesibilitas (DISETUJUI 2026-11-27, sudah dikodekan)

Revisi atas bagian (2) menurut keputusan pengguna. Belum ada kode aplikasi yang diubah (`src/`, `api/`, `tests/`, `deploy/`); tidak ada commit.

### Keputusan yang diterapkan

1. **Asisten AI:** backend dikosongkan dulu; tombol Asisten **tersembunyi selama `JDIH_ASISTEN_URL` kosong** (tidak ada tombol dengan jawaban contoh di produksi). Panel chat tetap dirancang dengan kontrak yang sama dengan `agent-jdih`: `POST {question}` -> `{answer, sources[], disclaimer}`. Tampilan lengkap di mockup (dua tombol, menu, panel, jawaban contoh) adalah keadaan **setelah backend siap**.
2. **Di bawah 1024 px (ponsel dan tablet):** satu tombol yang membuka menu dua pilihan. **1024 px ke atas:** dua tombol bertumpuk (Asisten di atas, WhatsApp di bawah).
3. **Pratinjau:** desktop (>= 1024 px) otomatis saat seksi terlihat; ponsel dan tablet kartu + ketukan. Ambang ukuran berkas tetap 25 MB sebagai nilai awal.
4. **Aksesibilitas:** tidak ada aturan tertulis. Target WCAG 2.2 dengan batas minimum Level A dan saran AA. **Tidak ada klaim kepatuhan** terhadap aturan tertentu di mockup maupun dokumen (diperiksa dengan pencarian teks pada semua HTML).

### Menu satu tombol (di bawah 1024 px)

- **Satu rangkaian elemen, dua tampilan** (tidak ada elemen ganda): `button.fab-trigger` (`aria-expanded`, `aria-controls="fab-menu"`), `div#fab-menu` berisi `.fab-opt.fab-chat` (membuka panel) dan `.fab-opt.fab-wa` (`wa.me`, tab baru), lalu panel chat. Di 1024 px ke atas pemicu disembunyikan dan dua pilihan menjadi tombol bulat bertumpuk dengan label sebagai tooltip.
- **Pemicu:** bulat 52 px biru dengan ikon pesan dan penanda "AI" (berganti ikon X saat menu terbuka). Menu = kartu di atas pemicu, rata kanan, lebar `min(280px, 100vw - 32px)`, dua baris **56 px** (ikon bulat 40 px + label "Tanya Asisten JDIH" dan "Chat WhatsApp"). Pola pengungkapan (disclosure), bukan `role="menu"`, sehingga tidak butuh navigasi panah.
- **Papan ketik:** Enter/Spasi membuka dan menutup; Esc menutup dan fokus kembali ke pemicu; klik di luar dan fokus yang keluar dari widget menutup menu; memilih WhatsApp menutup menu; memilih Asisten menutup menu, membuka panel (fokus ke judul), pemicu disembunyikan selama panel terbuka, dan Esc mengembalikan fokus ke pemicu. Tidak ada autofokus saat dimuat maupun saat menu dibuka.
- **Posisi:** ponsel `bottom: 96px` + area aman (di atas tab bawah), menu terbuka ke atas; tablet `bottom: 16px`, menu tidak mendekati rail kiri 80 px. Panel di tablet menempati tempat tombol (`bottom: 16px`).
- **Ruang bawah footer:** `padding-bottom` dan `scroll-padding-bottom` 96 px untuk 600-1023 px (satu tombol) dan 144 px dari 1024 px (dua tombol).
- `?fabmenu=open` membuka menu untuk tangkapan layar.

### Keadaan "Asisten kosong" (`beranda-tanpa-asisten.html`)

Dibuat perakit dari sumber `beranda` yang sama dengan penimpa meta `asisten:false`, jadi DOM-nya **benar-benar** tanpa tombol Asisten, pemicu, menu, panel, dan templat (bukan disembunyikan skrip). Isinya satu tautan WhatsApp bulat 52 px di semua lebar: **desktop hanya WhatsApp; di bawah 1024 px tombol itu langsung membuka WhatsApp, tanpa menu**. Bila nomor WhatsApp juga kosong, widget tidak ada sama sekali (tidak ada layar tersendiri). Di kode nanti: tombol Asisten, panel, dan **butir Asisten di Kebijakan Privasi** ikut tidak dirender selama `JDIH_ASISTEN_URL` kosong (butir itu di mockup ada karena mockup memperlihatkan keadaan lengkap).

### Pratinjau: satu aturan

`.pv-card` tampil di bawah 1024 px dan `.pv-inline` dari 1024 px. Penampil layar penuh tetap punya varian ponsel dan tablet (titik pisah 600 px khusus bilahnya). **Tablet mengikuti ponsel adalah asumsi saya** (Anda hanya menyebut desktop dan ponsel); mudah diubah.

### Hasil pemeriksaan (dijalankan 2026-11-27, setelah revisi)

- **Papan ketik, menu satu tombol** (probe DOM, 360x640, 360x800, 412x915, 599, 600, 768x1024, 1023 px; Beranda dan Detail): semua langkah lolos (buka, Esc dari baris, klik di luar, fokus keluar, WhatsApp, Asisten membuka panel lalu Esc, pemicu buka-tutup). Dua baris menu 56 px, pemicu 52 px, tidak ada kontrol di bawah 48 px. Tautan WhatsApp `target="_blank"` dengan `rel="noopener noreferrer"`. Chat 1280 px dan penampil pratinjau tetap lolos; widget aksesibilitas kiri tidak berubah (probe papan ketik dan target lolos).
- **Menu vs tab bawah dan rail kiri:** menu selalu di dalam layar; irisan dengan tab bawah (ponsel) 0, celah menu ke tab bawah 71 px (tombol ke tab bawah 11 px); irisan dengan rail kiri (600, 768, 1023 px) 0, celah tepi kiri menu ke tepi rail 224, 392, dan 647 px. Panel Asisten tidak menyentuh rail di tablet. Di ponsel panel berupa lembar layar penuh sehingga menutupi tab bawah (dialog, seperti sebelumnya).
- **Tanpa Asisten** (360, 768, 1280 px): tepat satu tombol 52x52, tanpa pemicu, menu, panel, templat, `aria-expanded`, atau `aria-controls`; satu elemen yang bisa difokus.
- **Footer, digulir mentok** (1280x800, 1024x768, 1440x900, 1366x650, 768x1024, 1023x768, 600x800; Beranda, Privasi, Dokumen, Detail, dan Beranda tanpa Asisten; margin 6 px): **0 irisan** dengan teks, tautan, atau gambar footer.
- **Tengah gulir (ukur, bukan klaim nol):** jumlah elemen konten yang pernah beririsan dengan tombol (kotak diperbesar 6 px, langkah gulir 160 px). 1440 px: 0 di Beranda, Dokumen, dan Detail. 1280 px: 0 di Dokumen dan Detail; Beranda 6, semuanya hanya cincin fokus (tepi konten 1208, tepi tombol 1212). 1024 px: Beranda 14, Dokumen 1, Detail 0. Tablet 768 px: Beranda 8, Dokumen 10, Detail 18. Ponsel 360x800: Beranda 20, Dokumen 12, Detail 23. **Jadi satu tombol di bawah 1024 px tetap menutupi sisi kanan konten pada posisi gulir tertentu** (tinggi tombol turun dari 116 px menjadi 52 px dibanding dua tombol bertumpuk, dan di ponsel ia menyingkir saat menggulir ke bawah). Pada posisi gulir awal di ponsel, irisannya: Beranda 360x800 kartu "Putusan"; Dokumen 360x800 tombol unduh kartu; Detail 412x915 tombol "Buka pratinjau" di tepi kanannya.
- **Kontras** (`contrast-kanan.mjs`, `contrast-a11y.mjs`): semua pasangan lolos di terang dan gelap, termasuk pasangan baru menu: label baris 17,12:1 (terang) dan 14,43:1 (gelap); batas kartu menu 3,23:1 terhadap ground (terang) dan 3,61:1 (gelap), 3,52:1 dan 3,30:1 terhadap permukaan; glif WhatsApp putih di hijau 4,14:1; cincin fokus luar >= 12,9:1.
- **Luapan horizontal** (`overflow.mjs`, 360, 768, 1024, 1280 px, 12 halaman termasuk Beranda tanpa Asisten, plus Beranda dan Dokumen mode gelap): tidak ada. Dengan jarak teks menyala (`verify-a11y.mjs spacing`, 48 kombinasi) dan pada menu terbuka, chat (awal, jawaban, galat), Beranda tanpa Asisten, dan penampil terbuka (`spacing2`, 24 kombinasi): 0 luapan dan tidak ada teks terpotong.
- **Tautan internal valid** (13 halaman), tanpa sumber eksternal, id tidak ganda dan semua rujukan ARIA menunjuk id yang ada.
- **Perbandingan dengan `git show HEAD:`:** isi `<main>` semua halaman lama tidak berubah kecuali yang disengaja (Beranda: hanya spasi kelas pada ikon dan skrip slider yang sudah diberi hook animasi; Dokumen: id filter kedua `l-st2`; Detail: seksi pratinjau); simbol ikon: tidak ada yang dipakai tanpa definisi dan tidak ada simbol HEAD yang hilang.
- **Detektor Impeccable** (semua layar, 126 temuan mentah, 16 unik): temuan baru dibanding putaran sebelumnya hanya dua, yaitu varian peringatan `cramped-padding` pada kontrol segmen `seg` (pola yang sama dengan yang sudah ada) dan hijau WhatsApp di luar `DESIGN.md` (disengaja). Sisanya temuan lama: bilah status, catatan mockup, radius header.
- **Teks aksesibilitas:** pencarian teks pada semua HTML tidak menemukan klaim kepatuhan terhadap aturan tertentu; satu-satunya kemunculan kata itu adalah kalimat penyangkalan di `index.html`.

### Temuan dan perbaikan saat membuka semua PNG (90 berkas, satu per satu)

- **Bilah pratinjau di 1024-1199 px membungkus** (tombol layar penuh terpisah sendirian di baris ketiga): label tombol lebar halaman diringkas menjadi "Lebar" di kolom utama yang sempit (`aria-label="Lebar halaman"` tetap utuh); dari 1200 px kembali "Lebar halaman". Satu baris di 1024 px (`detail-1024-fold.png`).
- **Teks usang di `keadaan.html`:** izin notifikasi Android menyebut "dapat dimatikan kapan saja di Info", padahal menu Info sudah diganti Profil (revisi 2026-11-26 tidak ikut menyentuh halaman ini). Diperbaiki menjadi "di Profil".
- **Catatan membaca PNG:** tangkapan halaman penuh menampilkan tombol kanan dan kiri di dasar halaman, bukan posisi mengambangnya (tombol `position: fixed` mengikuti tinggi jendela tangkapan), sehingga di sana tombol terlihat menimpa elemen terakhir (mis. penomoran halaman Dokumen di 360 px). Tangkapan `-fold` dan tangkapan layar interaktif memperlihatkan posisi sebenarnya. Tangkapan `hasil-360-filter` tidak menampilkan tombol karena lompatan jangkar dihitung sebagai gulir ke bawah.

### Hal terbuka

- **Tablet = ponsel untuk pratinjau** (asumsi, lihat di atas).
- **Backend Asisten, nomor WhatsApp, masa simpan dan lokasi pemrosesan** untuk naskah kebijakan: menunggu keputusan atau data dari instansi.
- Alat ukur dan perakit mockup ada di scratchpad sesi ini (di luar repo) dan bisa hilang bila folder itu dibersihkan.

## Persetujuan

- 2026-11-20: pengguna menulis "mockup disetujui" setelah revisi hero (slider foto seperti jdihsetwan.cianjurkab.go.id). Tidak ada catatan revisi lain.
- Terbawa ke fase kode sebagai keputusan terbuka (bukan syarat persetujuan): foto resmi hero, logo resmi dan pedoman identitas, alamat/kontak footer, mekanisme notifikasi, dan kata kunci berita.
- 2026-11-27: pengguna menulis "disetujui" untuk tiga mockup susulan (Profil/Kebijakan, widget aksesibilitas, pratinjau + tombol WhatsApp/Asisten, revisi ke-3). Ketiganya sudah dikodekan; penyimpangan kecil dari mockup tercatat di laporan akhir pekerjaan itu dan di `SECURITY.md`/`docs/deploy/frontend-baota.md`.
