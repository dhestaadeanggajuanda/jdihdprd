// Percakapan dengan Asisten JDIH. Hanya di memori: tidak ditulis ke penyimpanan
// perangkat (tidak ada entri baru di Kebijakan Cookie), jadi hilang saat halaman
// ditutup. Tiap pertanyaan dikirim sendiri-sendiri; backend tidak punya riwayat.
import { reactive } from 'vue'
import { periksaPertanyaan, tanyaAsisten } from '@/services/asisten.js'
import { isAbort } from '@/utils/errors.js'

export const MAKS_PESAN = 40

// galat: 'batas' (429) | 'layanan' (5xx, batas waktu, respons salah) | 'offline'
const state = reactive({
  pesan: [],
  memuat: false,
  galat: null,
  pertanyaanGalat: ''
})
let nomor = 0
let controller = null

function tambah(item) {
  state.pesan.push({ id: (nomor += 1), ...item })
  if (state.pesan.length > MAKS_PESAN) state.pesan.splice(0, 2)
}

function jenisGalat(err) {
  if (err?.kind === 'http' && err.status === 429) return 'batas'
  if (err?.kind === 'network' && globalThis.navigator?.onLine === false) {
    return 'offline'
  }
  return 'layanan'
}

export function useAsisten() {
  /** @returns {Promise<{ ok: boolean, pesan?: string }>} */
  async function kirim(teks) {
    if (state.memuat) return { ok: false }
    const hasil = periksaPertanyaan(teks)
    if (!hasil.ok) return { ok: false, pesan: hasil.pesan }
    state.galat = null
    state.pertanyaanGalat = ''
    tambah({ peran: 'user', teks: hasil.nilai })
    state.memuat = true
    const mine = new AbortController()
    controller = mine
    try {
      const jawaban = await tanyaAsisten(hasil.nilai, { signal: mine.signal })
      if (mine.signal.aborted) return { ok: false }
      tambah({ peran: 'bot', teks: jawaban.answer, sumber: jawaban.sources })
      return { ok: true }
    } catch (err) {
      if (isAbort(err) || mine.signal.aborted) return { ok: false }
      state.galat = jenisGalat(err)
      state.pertanyaanGalat = hasil.nilai
      return { ok: false }
    } finally {
      if (controller === mine) {
        controller = null
        state.memuat = false
      }
    }
  }

  return {
    state,
    kirim,
    // Pertanyaan yang gagal dikirim ulang tanpa menggandakan gelembung pengguna.
    async ulang() {
      const teks = state.pertanyaanGalat
      if (!teks) return { ok: false }
      const terakhir = state.pesan.at(-1)
      if (terakhir?.peran === 'user' && terakhir.teks === teks) {
        state.pesan.pop()
      }
      return kirim(teks)
    },
    batal() {
      controller?.abort()
      controller = null
      state.memuat = false
    },
    hapus() {
      controller?.abort()
      controller = null
      state.pesan.splice(0)
      state.memuat = false
      state.galat = null
      state.pertanyaanGalat = ''
    }
  }
}
