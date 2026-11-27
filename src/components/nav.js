// Struktur navigasi. `key` dicocokkan dengan meta.nav (header desktop) dan
// meta.app (navigasi bawah/rail) pada rute.
export const MAIN_NAV = [
  { key: 'beranda', label: 'Beranda', to: '/' },
  { key: 'profil', label: 'Profil', to: '/profil' },
  { key: 'dokumen', label: 'Dokumen', to: '/dokumen' },
  { key: 'puu', label: 'Pembentukan PUU', to: '/pembentukan-puu' },
  { key: 'berita', label: 'Berita', to: '/berita' },
  { key: 'statistik', label: 'Statistik', to: '/statistik' }
]

// Tab "Profil" membuka hub (/info): halaman instansi, kebijakan, notifikasi,
// tampilan, dan tautan terkait. Header desktop membuka /profil (halaman dengan
// menu samping). Keduanya memakai kunci `profil` agar sama-sama tampak aktif.
export const APP_NAV = [
  { key: 'beranda', label: 'Beranda', to: '/', icon: 'home' },
  { key: 'profil', label: 'Profil', to: '/info', icon: 'landmark' },
  { key: 'dokumen', label: 'Dokumen', to: '/dokumen', icon: 'file-text' },
  { key: 'berita', label: 'Berita', to: '/berita', icon: 'newspaper' },
  { key: 'statistik', label: 'Statistik', to: '/statistik', icon: 'bar-chart' }
]
