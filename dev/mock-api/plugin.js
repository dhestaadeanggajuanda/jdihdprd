// Plugin Vite: melayani API palsu pada /api/v1 saat pengembangan (quasar dev).
// Tidak ikut ke build produksi. Mode simulasi untuk menguji keadaan UI:
//   MOCK_MODE=slow   quasar dev    respons lambat (1,8 detik)
//   MOCK_MODE=error  quasar dev    semua respons 503
//   MOCK_MODE=empty  quasar dev    daftar kosong
import { randomBytes } from 'node:crypto'
import { handle } from './handlers.js'

const MODES = ['normal', 'slow', 'error', 'empty']

function middleware() {
  const mode = MODES.includes(process.env.MOCK_MODE)
    ? process.env.MOCK_MODE
    : 'normal'
  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const requestId =
      randomBytes(2).toString('hex').toUpperCase() +
      '-' +
      randomBytes(2).toString('hex').toUpperCase()
    const base = {
      'X-Request-Id': requestId,
      'X-Content-Type-Options': 'nosniff',
      'X-Data-Sample': 'true',
      'Cache-Control': 'no-store'
    }
    const send = () => {
      const r = handle(
        req.method ?? 'GET',
        url.pathname,
        url.searchParams,
        mode
      )
      if (r.binary) {
        res.writeHead(200, {
          ...base,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${r.binary.name}"`,
          'Content-Length': r.binary.bytes.length
        })
        res.end(req.method === 'HEAD' ? undefined : r.binary.bytes)
        return
      }
      const payload = r.problem ?? r.body
      const text = JSON.stringify(payload)
      res.writeHead(r.status, {
        ...base,
        'Content-Type': r.problem
          ? 'application/problem+json; charset=utf-8'
          : 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(text),
        ...(r.status === 405 ? { Allow: 'GET, HEAD' } : {})
      })
      res.end(req.method === 'HEAD' ? undefined : text)
    }
    if (mode === 'slow') setTimeout(send, 1800)
    else send()
  }
}

// Asisten palsu (hanya dev; aktif di klien bila JDIH_ASISTEN_URL=/asisten/chat).
// Kontrak sama dengan agent-jdih: POST { question } -> { answer, sources[], disclaimer }.
// Kata dalam pertanyaan memilih keadaan uji: "limit" -> 429, "galat" -> 502,
// "kosong" -> tidak ditemukan, "lambat" -> lambat; selain itu jawaban dengan sumber.
function asistenMiddleware() {
  return (req, res) => {
    const json = (status, body) => {
      const text = JSON.stringify(body)
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(text),
        'Cache-Control': 'no-store'
      })
      res.end(text)
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' })
      res.end()
      return
    }
    let raw = ''
    req.on('data', chunk => {
      raw += chunk
      if (raw.length > 10_000) req.destroy()
    })
    req.on('end', () => {
      let question = ''
      try {
        question = String(JSON.parse(raw).question ?? '')
      } catch {
        return json(422, { detail: 'JSON tidak valid' })
      }
      if (question.length < 3 || question.length > 500) {
        return json(422, { detail: 'question 3-500 karakter' })
      }
      const q = question.toLowerCase()
      const kirim = () => {
        if (q.includes('limit')) return json(429, { detail: 'Terlalu banyak' })
        if (q.includes('galat'))
          return json(502, { detail: 'Layanan AI bermasalah' })
        if (q.includes('kosong')) {
          return json(200, {
            answer: 'Maaf, saya tidak menemukan produk hukum yang sesuai.',
            sources: [],
            disclaimer: 'Jawaban otomatis.'
          })
        }
        return json(200, {
          answer:
            'Ada. Yang paling sesuai adalah Peraturan Daerah Nomor 7 Tahun 2019 tentang Retribusi Pelayanan Pasar, berstatus berlaku.',
          sources: [
            {
              judul: 'Retribusi Pelayanan Pasar',
              jenis_peraturan: 'Peraturan Daerah',
              nomor_peraturan: '7',
              tahun_terbit: '2019',
              status: 'Berlaku',
              url: '/dokumen/117-retribusi-pelayanan-pasar',
              skor_kemiripan: 0.91
            },
            {
              judul: 'Dokumen di situs lain',
              jenis_peraturan: 'Peraturan Daerah',
              nomor_peraturan: '1',
              tahun_terbit: '2010',
              status: 'Dicabut',
              url: 'https://situs-lain.example/dokumen/9',
              skor_kemiripan: 0.5
            }
          ],
          disclaimer: 'Jawaban otomatis.'
        })
      }
      if (q.includes('lambat')) setTimeout(kirim, 1800)
      else kirim()
    })
  }
}

export function mockApiPlugin() {
  return {
    name: 'jdih-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/v1', middleware())
      server.middlewares.use('/asisten', asistenMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/v1', middleware())
      server.middlewares.use('/asisten', asistenMiddleware())
    }
  }
}
