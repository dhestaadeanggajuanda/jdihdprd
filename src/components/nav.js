// Struktur navigasi. `key` dicocokkan dengan meta.nav (header desktop) dan
// meta.app (navigasi bawah/rail) pada rute.
export const MAIN_NAV = [
  { key: 'beranda', label: 'Beranda', to: '/' },
  { key: 'dokumen', label: 'Dokumen', to: '/dokumen' },
  { key: 'puu', label: 'Pembentukan PUU', to: '/pembentukan-puu' },
  { key: 'berita', label: 'Berita', to: '/berita' },
  { key: 'statistik', label: 'Statistik', to: '/statistik' },
  { key: 'tentang', label: 'Tentang', to: '/tentang' }
]

export const APP_NAV = [
  { key: 'beranda', label: 'Beranda', to: '/', icon: 'home' },
  { key: 'dokumen', label: 'Dokumen', to: '/dokumen', icon: 'file-text' },
  { key: 'berita', label: 'Berita', to: '/berita', icon: 'newspaper' },
  { key: 'statistik', label: 'Statistik', to: '/statistik', icon: 'bar-chart' },
  { key: 'info', label: 'Info', to: '/info', icon: 'info' }
]
