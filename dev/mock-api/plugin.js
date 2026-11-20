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

export function mockApiPlugin() {
  return {
    name: 'jdih-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/v1', middleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/v1', middleware())
    }
  }
}
