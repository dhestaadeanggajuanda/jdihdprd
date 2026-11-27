// "Hapus data tersimpan" (Kebijakan Cookie): menghapus semua entri penyimpanan lokal
// milik aplikasi dan mengembalikan pilihan ke bawaan. Tidak menyentuh server.
import { nextTick } from 'vue'
import { resetAppearance } from '@/composables/useAppearance.js'
import { resetNotifikasi } from '@/services/notifications.js'
import { removeKey } from '@/utils/storage.js'

// Daftar entri harus sama dengan tabel di Kebijakan Cookie.
export const STORAGE_KEYS = ['tampilan', 'aksesibilitas', 'notifikasi']

export async function hapusDataTersimpan() {
  resetAppearance()
  await resetNotifikasi()
  // Pengamat tampilan menulis nilai bawaan setelah state berubah; tunggu
  // sampai selesai, baru entrinya dihapus.
  await nextTick()
  for (const key of STORAGE_KEYS) removeKey(key)
}
