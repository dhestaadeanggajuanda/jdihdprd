// Pemuatan satu berkas PDF untuk pratinjau: keadaan, pembatalan, dan pelepasan
// memori. Satu instance per halaman detail; berganti berkas membatalkan yang lama.
import { markRaw, onBeforeUnmount, ref, shallowRef } from 'vue'
import { PDF_MAX_BYTES, PdfError, ambilPdf, bukaPdf } from '@/services/pdf.js'

/**
 * status:
 *  - idle     belum diminta (ponsel: menunggu ketukan)
 *  - memuat   sedang mengunduh dan membuka
 *  - siap     dokumen terbuka
 *  - galat    gagal (jaringan, server, berkas rusak)
 *  - besar    melebihi batas ukuran
 *  - luar     berkas ada di situs lain
 */
export function usePdfPreview() {
  const status = ref('idle')
  const doc = shallowRef(null)
  const jumlah = ref(0)
  const ukuranBesar = ref(0)
  const progres = ref(0)
  let controller = null
  let kunci = 0

  function lepas() {
    const lama = doc.value
    doc.value = null
    jumlah.value = 0
    lama?.destroy?.()
  }

  function batal() {
    controller?.abort()
    controller = null
  }

  /** @param {string} url @param {number|null} [ukuran] ukuran menurut metadata */
  async function muat(url, ukuran = null) {
    batal()
    lepas()
    ukuranBesar.value = 0
    progres.value = 0
    if (ukuran !== null && ukuran > PDF_MAX_BYTES) {
      ukuranBesar.value = ukuran
      status.value = 'besar'
      return
    }
    status.value = 'memuat'
    const mine = new AbortController()
    controller = mine
    const saya = (kunci += 1)
    try {
      const bytes = await ambilPdf(url, {
        signal: mine.signal,
        onProgress: p => {
          if (saya === kunci) progres.value = p
        }
      })
      if (saya !== kunci) return
      const dokumen = await bukaPdf(bytes)
      if (saya !== kunci) {
        dokumen.destroy?.()
        return
      }
      doc.value = markRaw(dokumen)
      jumlah.value = dokumen.numPages
      status.value = 'siap'
    } catch (err) {
      if (saya !== kunci || err?.kind === 'aborted') return
      if (err instanceof PdfError && err.kind === 'too-large') {
        ukuranBesar.value = err.size
        status.value = 'besar'
      } else if (err instanceof PdfError && err.kind === 'external') {
        status.value = 'luar'
      } else {
        status.value = 'galat'
      }
    } finally {
      if (controller === mine) controller = null
    }
  }

  function reset() {
    kunci += 1
    batal()
    lepas()
    status.value = 'idle'
  }

  onBeforeUnmount(() => {
    kunci += 1
    batal()
    lepas()
  })

  return { status, doc, jumlah, ukuranBesar, progres, muat, reset }
}
