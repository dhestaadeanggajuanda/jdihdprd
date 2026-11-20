// Memuat data async dengan keadaan memuat/galat yang konsisten.
// - Permintaan lama dibatalkan saat sumber berubah atau komponen dilepas.
// - Data lama tetap tampil selama memuat ulang (halaman berikutnya, filter).
// - Cache memori opsional per kunci (data bersama seperti ringkasan).
import {
  ref,
  shallowRef,
  watch,
  onBeforeUnmount,
  getCurrentInstance
} from 'vue'
import { describeError, isAbort } from '@/utils/errors.js'
import { useOnline } from './useOnline.js'

const cache = new Map()

export function clearResourceCache() {
  cache.clear()
}

/**
 * @param {(signal: AbortSignal) => Promise<any>} loader
 * @param {{ sources?: Array<() => any>, immediate?: boolean, cacheKey?: string|(() => string), ttlMs?: number }} [options]
 */
export function useResource(
  loader,
  {
    sources = [],
    immediate = true,
    cacheKey = null,
    ttlMs = 60_000,
    enabled = null
  } = {}
) {
  const data = shallowRef(null)
  const error = shallowRef(null)
  const loading = ref(false)
  const { online } = useOnline()
  let controller = null

  async function load({ force = false } = {}) {
    // Halaman yang sedang ditinggalkan tidak boleh memuat data rute berikutnya.
    if (enabled && !enabled()) return
    const key = typeof cacheKey === 'function' ? cacheKey() : cacheKey
    if (key && !force) {
      const hit = cache.get(key)
      if (hit && Date.now() - hit.at < ttlMs) {
        data.value = hit.value
        error.value = null
        return
      }
    }
    controller?.abort()
    const mine = new AbortController()
    controller = mine
    loading.value = true
    error.value = null
    try {
      const value = await loader(mine.signal)
      if (mine.signal.aborted) return
      data.value = value
      if (key) cache.set(key, { at: Date.now(), value })
    } catch (err) {
      if (isAbort(err) || mine.signal.aborted) return
      error.value = describeError(err, { online: online.value })
    } finally {
      if (controller === mine) loading.value = false
    }
  }

  if (sources.length > 0) watch(sources, () => load(), { immediate })
  else if (immediate) load()

  if (getCurrentInstance()) onBeforeUnmount(() => controller?.abort())

  return { data, error, loading, reload: () => load({ force: true }) }
}
