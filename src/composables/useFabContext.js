// Konteks halaman untuk tombol WhatsApp: halaman detail dokumen mengisi pesan awal
// (judul dan tautan dokumen), halaman lain memakai pesan bawaan.
import { onBeforeUnmount, ref, watchEffect } from 'vue'

const pesan = ref('')

export const pesanWhatsapp = pesan

/** Dipakai halaman: `source` adalah getter pesan awal ('' = bawaan). */
export function useWhatsappPesan(source) {
  watchEffect(() => {
    pesan.value = source() || ''
  })
  onBeforeUnmount(() => {
    pesan.value = ''
  })
}
