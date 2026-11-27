// Pilihan tampilan dan aksesibilitas: satu daftar untuk panel widget (>= 1024 px)
// dan baris sakelar di Profil (di bawah itu), agar teks dan urutannya tidak berbeda.
// Target: WCAG 2.2 minimum Level A, saran AA. Ini pilihan pelengkap bagi
// pengguna, bukan pernyataan kepatuhan terhadap aturan tertentu.

export const TEMA = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' }
]

export const UKURAN_TEKS = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Besar' },
  { value: 'xlarge', label: 'Sangat besar' }
]

// `kelompok`: 'teks' atau 'tampilan' (bagian di panel). `halus`: hanya tampil bila
// ada penunjuk halus (mouse), karena kursor besar tidak berarti di layar sentuh.
export const PILIHAN_A11Y = [
  {
    flag: 'contrast',
    label: 'Kontras tinggi',
    petunjuk: 'Teks dan garis lebih tegas',
    kelompok: 'tampilan'
  },
  {
    flag: 'spacing',
    label: 'Jarak teks lebih lega',
    petunjuk: 'Jarak huruf, kata, dan baris lebih lebar',
    kelompok: 'teks'
  },
  {
    flag: 'links',
    label: 'Garis bawah dan sorot tautan',
    petunjuk: 'Semua tautan bergaris bawah dan berbingkai',
    kelompok: 'teks'
  },
  {
    flag: 'motion',
    label: 'Hentikan animasi',
    petunjuk: 'Termasuk pergantian foto di beranda',
    kelompok: 'tampilan'
  },
  {
    flag: 'gray',
    label: 'Skala abu-abu',
    petunjuk: 'Tampilan tanpa warna',
    kelompok: 'tampilan'
  },
  {
    flag: 'cursor',
    label: 'Kursor besar',
    petunjuk: 'Penunjuk mouse lebih besar',
    kelompok: 'tampilan',
    halus: true
  }
]
