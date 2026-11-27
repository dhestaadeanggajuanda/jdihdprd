// Daftar halaman Profil (dari API), dibagi oleh halaman Profil, halaman kebijakan,
// dan hub Profil. Cache memori yang sama, jadi berpindah antarhalaman tidak
// memuat ulang.
import { computed } from 'vue'
import { getHalamanList } from '@/services/api.js'
import { useResource } from './useResource.js'

export function useProfilDaftar() {
  const resource = useResource(signal => getHalamanList({ signal }), {
    cacheKey: 'halaman:daftar',
    ttlMs: 10 * 60 * 1000
  })
  return {
    ...resource,
    daftar: computed(() => resource.data.value ?? [])
  }
}
