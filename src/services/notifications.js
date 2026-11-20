// Notifikasi peraturan baru (Android). MEKANISME BELUM DIPUTUSKAN: kandidatnya
// langganan topik FCM dengan pengirim di sisi server (agar API tetap GET saja
// dan database tetap read-only). Sampai itu diputuskan dan dipasang,
// `provider` bernilai null dan UI menampilkan keadaan "belum aktif", bukan
// tombol yang seolah bekerja.
//
// Antarmuka penyedia (diisi saat mekanisme dipasang):
//   {
//     requestPermission(): Promise<'granted' | 'denied'>
//     subscribe(kodeJenis: string[]): Promise<void>
//     unsubscribeAll(): Promise<void>
//   }
import { reactive } from 'vue'
import { Platform } from 'quasar'
import { readJson, writeJson } from '@/utils/storage.js'

export const JENIS_NOTIFIKASI = [
  { kode: 'perda', label: 'Peraturan Daerah' },
  { kode: 'perwali', label: 'Peraturan Wali Kota' },
  { kode: 'perdprd', label: 'Peraturan DPRD' },
  { kode: 'kepdprd', label: 'Keputusan DPRD' }
]
const BAWAAN = ['perda', 'perwali', 'perdprd']

const saved = readJson('notifikasi', {})
const state = reactive({
  aktif: saved.aktif === true,
  jenis: Array.isArray(saved.jenis)
    ? saved.jenis.filter(k => JENIS_NOTIFIKASI.some(j => j.kode === k))
    : [...BAWAAN]
})

let provider = null

export function setNotificationProvider(p) {
  provider = p
}

/** @returns {{ status: 'tersedia'|'belum-aktif'|'hanya-android', pesan: string }} */
export function notificationSupport() {
  if (!(Platform.is.capacitor && Platform.is.android)) {
    return { status: 'hanya-android', pesan: 'Tersedia di aplikasi Android.' }
  }
  if (!provider) {
    return { status: 'belum-aktif', pesan: 'Belum diaktifkan pada versi ini.' }
  }
  return {
    status: 'tersedia',
    pesan: 'Pemberitahuan saat produk hukum baru terbit. Tanpa akun.'
  }
}

function persist() {
  writeJson('notifikasi', { aktif: state.aktif, jenis: [...state.jenis] })
}

export async function aktifkan(jenis) {
  if (!provider) throw new Error('penyedia notifikasi belum dipasang')
  const izin = await provider.requestPermission()
  if (izin !== 'granted') return 'ditolak'
  await provider.subscribe(jenis)
  state.aktif = true
  state.jenis = [...jenis]
  persist()
  return 'aktif'
}

export async function matikan() {
  if (provider) await provider.unsubscribeAll()
  state.aktif = false
  persist()
}

export async function ubahJenis(jenis) {
  if (provider && state.aktif) await provider.subscribe(jenis)
  state.jenis = [...jenis]
  persist()
}

export function useNotifications() {
  return { state }
}
