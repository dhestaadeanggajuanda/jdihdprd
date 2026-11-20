// Konstanta host. Berkas ini sengaja murni (tanpa import.meta) supaya bisa
// dipakai oleh quasar.config.js (Node) maupun kode klien.
// Hanya dua origin yang boleh dihubungi aplikasi: API JDIH dan Media Center.

export const API_ORIGIN = 'https://jdih.dprd.singkawangkota.go.id'
export const API_PATH = '/api/v1'

export const MEDIACENTER_ORIGIN = 'https://mediacenter.singkawangkota.go.id'
export const MEDIACENTER_API_PATH = '/wp-json/wp/v2'

// Tautan keluar yang ditampilkan di Beranda dan Info (host harus ada di sini).
export const RELATED_LINKS = [
  { nama: 'JDIH Nasional', host: 'jdihn.go.id', url: 'https://jdihn.go.id/' },
  { nama: 'BPHN', host: 'bphn.go.id', url: 'https://bphn.go.id/' },
  {
    nama: 'Pemerintah Kota Singkawang',
    host: 'singkawangkota.go.id',
    url: 'https://singkawangkota.go.id/'
  },
  {
    nama: 'Media Center',
    host: 'mediacenter.singkawangkota.go.id',
    url: 'https://mediacenter.singkawangkota.go.id/'
  }
]
