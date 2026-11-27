// Klien Asisten JDIH (tanya jawab produk hukum). Kontrak backend (sama dengan
// agent-jdih): POST JSON { question } -> { answer, sources[], disclaimer }.
// Asisten hanya aktif bila JDIH_ASISTEN_URL berisi jalur layanan; selama kosong
// tidak ada tombol, panel, atau permintaan.
//
// Jawaban diperlakukan sebagai masukan tak tepercaya: teks biasa (tidak pernah
// HTML), panjang dibatasi, dan tautan sumber hanya diterima bila menuju host
// sendiri lalu diubah menjadi rute dalam aplikasi (/dokumen/:id).
import { ASISTEN_URL } from '@/config/env.js'
import { stripControl } from '@/utils/chars.js'
import { postJson } from './http.js'

export const PERTANYAAN = Object.freeze({ min: 3, max: 500 })
export const JAWABAN_MAX = 4000
export const SUMBER_MAX = 5
export const ASISTEN_TIMEOUT_MS = 45_000
const TEKS_SUMBER_MAX = 300

/** Merapikan pertanyaan dan memeriksa panjangnya. */
export function periksaPertanyaan(teks) {
  const nilai = stripControl(String(teks ?? ''), ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (nilai.length < PERTANYAAN.min) {
    return {
      ok: false,
      nilai,
      pesan: `Tulis minimal ${PERTANYAAN.min} karakter.`
    }
  }
  if (nilai.length > PERTANYAAN.max) {
    return {
      ok: false,
      nilai,
      pesan: `Pertanyaan terlalu panjang (maksimal ${PERTANYAAN.max} karakter).`
    }
  }
  return { ok: true, nilai, pesan: '' }
}

const bersih = (v, max) =>
  typeof v === 'string' || typeof v === 'number'
    ? stripControl(String(v), ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : ''

/**
 * Mengubah alamat sumber dari backend menjadi rute dalam aplikasi, atau null.
 * Diterima: alamat penuh https ke host yang sama dengan situs, atau jalur
 * /dokumen/<id> (juga bentuk lama /dokumen/<id>-<slug>). Selain itu null, jadi
 * kartu sumber tampil tanpa tautan.
 */
export function sumberKeRute(url, host = globalThis.location?.host) {
  if (typeof url !== 'string' || url.length > 500) return null
  let path
  if (url.startsWith('/') && !url.startsWith('//')) {
    path = url.split(/[?#]/)[0]
  } else {
    let u
    try {
      u = new URL(url)
    } catch {
      return null
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (u.username || u.password || !host || u.host !== host) return null
    path = u.pathname
  }
  const m = /^\/dokumen\/(\d{1,10})(?:-[a-z0-9-]{0,200})?\/?$/.exec(path)
  return m ? `/dokumen/${Number(m[1])}` : null
}

const STATUS = {
  berlaku: { kelas: 'ok', teks: 'Berlaku', ikon: 'check-circle' },
  dicabut: { kelas: 'bad', teks: 'Dicabut', ikon: 'x-circle' },
  diubah: { kelas: 'warn', teks: 'Diubah', ikon: 'edit' }
}

function normalisasiSumber(raw) {
  if (raw === null || typeof raw !== 'object') return null
  const jenis = bersih(raw.jenis_peraturan, 80)
  const nomor = bersih(raw.nomor_peraturan, 20)
  const tahun = bersih(raw.tahun_terbit, 4)
  const judul = bersih(raw.judul, TEKS_SUMBER_MAX)
  const judulNomor = [
    jenis,
    nomor && `Nomor ${nomor}`,
    tahun && `Tahun ${tahun}`
  ]
    .filter(Boolean)
    .join(' ')
  if (!judulNomor && !judul) return null
  const status = STATUS[bersih(raw.status, 20).toLowerCase()] ?? null
  return {
    judulNomor: judulNomor || judul,
    judul: judulNomor ? judul : '',
    status,
    rute: sumberKeRute(raw.url)
  }
}

/**
 * Memvalidasi respons backend. Bentuk yang salah dianggap galat data, bukan
 * ditampilkan sebagian.
 * Teks `disclaimer` dari backend sengaja tidak ditampilkan: catatan tetap di panel
 * ditulis aplikasi, dan teks bawaan agent-jdih menyebut kontak instansi lain.
 * @returns {{ answer: string, sources: object[] }}
 */
export function normalisasiJawaban(raw) {
  if (
    raw === null ||
    typeof raw !== 'object' ||
    typeof raw.answer !== 'string'
  ) {
    const err = new Error('SchemaError')
    err.name = 'SchemaError'
    throw err
  }
  const answer = stripControl(raw.answer, ' ', { keepWhitespace: true })
    .trim()
    .slice(0, JAWABAN_MAX)
  if (answer === '') {
    const err = new Error('SchemaError')
    err.name = 'SchemaError'
    throw err
  }
  const sources = (Array.isArray(raw.sources) ? raw.sources : [])
    .slice(0, SUMBER_MAX)
    .map(normalisasiSumber)
    .filter(Boolean)
  return { answer, sources }
}

/**
 * Mengirim satu pertanyaan (tanpa riwayat: tiap pertanyaan dijawab sendiri).
 * @param {string} pertanyaan sudah lolos periksaPertanyaan
 * @param {{ signal?: AbortSignal, endpoint?: string }} [options]
 */
export async function tanyaAsisten(
  pertanyaan,
  { signal, endpoint = ASISTEN_URL } = {}
) {
  const { data } = await postJson(
    endpoint,
    { question: pertanyaan },
    { signal, timeoutMs: ASISTEN_TIMEOUT_MS, maxBytes: 100_000 }
  )
  return normalisasiJawaban(data)
}
