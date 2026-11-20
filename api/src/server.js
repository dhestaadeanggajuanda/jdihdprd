// Fastify: hanya GET/HEAD, CORS allowlist, batas laju, header keamanan, galat problem+json.
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { randomBytes } from 'node:crypto'
import routes from './routes.js'

const problem = (reply, status, title) =>
  reply
    .code(status)
    .type('application/problem+json; charset=utf-8')
    .send({ type: 'about:blank', title, status })

export async function buildServer({ db, cfg, logger = false }) {
  const app = Fastify({
    logger,
    trustProxy: cfg.trustProxy,
    // ID permintaan untuk korelasi dengan log; dihasilkan server, tidak dipercaya dari klien.
    genReqId: () =>
      `${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}`.toUpperCase(),
    bodyLimit: 1024,
    routerOptions: { ignoreTrailingSlash: true, maxParamLength: 200 }
  })

  app.addHook('onRequest', async (req, reply) => {
    reply.header('X-Request-Id', req.id)
    if (cfg.sample) reply.header('X-Data-Sample', 'true')
  })

  await app.register(helmet, {
    // JSON dan berkas, bukan halaman: tolak semua pemuatan sumber, tanpa bingkai.
    // useDefaults: false, kalau tidak helmet menambah script-src/style-src 'unsafe-inline' dll.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: { maxAge: 63072000, includeSubDomains: true }
  })

  await app.register(cors, {
    origin: cfg.corsOrigins.length > 0 ? cfg.corsOrigins : false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Accept'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600
  })

  await app.register(rateLimit, {
    max: cfg.rateLimitMax,
    timeWindow: '1 minute',
    // Kunci per IP klien; tidak pernah jatuh ke satu keranjang bersama.
    keyGenerator: req => req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      type: 'about:blank',
      title: 'Terlalu banyak permintaan',
      status: 429,
      detail: `Coba lagi dalam ${Math.ceil(ctx.ttl / 1000)} detik.`
    })
  })

  // Hanya GET/HEAD (OPTIONS untuk preflight dilayani plugin CORS). Metode lain: 405.
  app.addHook('onRequest', async (req, reply) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      reply.header('Allow', 'GET, HEAD, OPTIONS')
      return problem(reply, 405, 'Metode tidak diizinkan')
    }
  })

  // Koersi tipe Ajv mengubah "Infinity" dan "1e999" menjadi Infinity, dan angka tak hingga
  // lolos batas minimum/maximum (diverifikasi pada ajv 8.20): page=Infinity berujung 500 di
  // serializer, tahun_dari=Infinity lolos ke query. Parameter bilangan bulat karena itu wajib
  // berupa digit desimal polos; rentangnya tetap dijaga skema.
  const INT_QUERY = ['page', 'per_page', 'tahun_dari', 'tahun_sampai']
  app.addHook('preValidation', async (req, reply) => {
    const q = req.query
    if (q && typeof q === 'object') {
      for (const k of INT_QUERY) {
        if (k in q && !/^\d{1,5}$/.test(String(q[k])))
          return problem(reply, 400, 'Parameter tidak valid')
      }
    }
  })

  // Respons JSON boleh di-cache sebentar; data berubah jarang.
  app.addHook('onSend', async (req, reply, payload) => {
    if (!reply.hasHeader('Cache-Control'))
      reply.header('Cache-Control', 'public, max-age=60')
    return payload
  })

  app.setNotFoundHandler((_req, reply) =>
    problem(reply, 404, 'Tidak ditemukan')
  )

  // Galat: tanpa jejak tumpukan, tanpa detail SQL/jalur; detail hanya di log server.
  app.setErrorHandler((err, req, reply) => {
    if (err.validation) return problem(reply, 400, 'Parameter tidak valid')
    if (err.statusCode === 429)
      return reply
        .code(429)
        .type('application/problem+json; charset=utf-8')
        .send({
          type: 'about:blank',
          title: 'Terlalu banyak permintaan',
          status: 429,
          detail: err.detail
        })
    const status =
      err.statusCode && err.statusCode >= 400 && err.statusCode < 500
        ? err.statusCode
        : 500
    if (status >= 500)
      req.log.error(
        { err: { name: err.name, code: err.code, message: err.message } },
        'galat internal'
      )
    return problem(
      reply,
      status,
      status >= 500 ? 'Terjadi gangguan di server' : 'Permintaan tidak valid'
    )
  })

  await app.register(
    async scope => {
      await scope.register(routes, { db, cfg })
    },
    { prefix: '/api/v1' }
  )

  // Pemeriksaan kesehatan (tanpa data) untuk pemantau.
  app.get('/health', async (_req, reply) => {
    try {
      await db.ping()
      return { status: 'ok' }
    } catch {
      return problem(reply, 503, 'Database tidak tersedia')
    }
  })

  return app
}
