// Judul app bar yang bisa ditimpa halaman (mis. nama halaman Tentang atau
// dokumen), selain judul statis pada meta rute.
import { ref, watchEffect, onBeforeUnmount } from 'vue'

const override = ref('')

export const barTitleOverride = override

/** Memakai judul dinamis selama halaman aktif. `source` adalah getter string. */
export function useBarTitle(source) {
  watchEffect(() => {
    override.value = source() || ''
  })
  onBeforeUnmount(() => {
    override.value = ''
  })
}
