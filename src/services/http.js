// Klien HTTP tunggal. Semua permintaan jaringan aplikasi lewat sini.
// Kontrol: GET untuk data (satu-satunya POST adalah pertanyaan ke Asisten, lewat
// postJson), tanpa kredensial dan referrer, batas waktu, pembatalan, batas ukuran
// respons, tipe konten JSON, dan pengecekan origin akhir (termasuk setelah redirect).

import { ALLOWED_FETCH_ORIGINS } from '@/config/endpoints.js'

export const DEFAULT_TIMEOUT_MS = 12_000
export const DEFAULT_MAX_BYTES = 2_000_000

/**
 * kind:
 *  - network   gagal tersambung
 *  - timeout   melewati batas waktu
 *  - aborted   dibatalkan oleh pemanggil (bukan galat bagi pengguna)
 *  - http      status 4xx/5xx
 *  - parse     bukan JSON atau tipe konten salah
 *  - too-large respons melebihi batas (getBytes: `size` = ukuran yang terlihat)
 *  - external  getBytes: berkas dialihkan ke host lain
 *  - blocked   origin akhir di luar allowlist
 */
export class HttpError extends Error {
  constructor(
    kind,
    { status = 0, requestId = null, detail = '', size = 0 } = {}
  ) {
    super(`${kind}${status ? ` ${status}` : ''}${detail ? `: ${detail}` : ''}`)
    this.name = 'HttpError'
    this.kind = kind
    this.status = status
    this.requestId = requestId
    this.size = size
  }
}

export function buildUrl(base, path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === false
    ) {
      continue
    }
    query.set(key, value === true ? '1' : String(value))
  }
  const qs = query.toString()
  return `${base}${path}${qs ? `?${qs}` : ''}`
}

function originOf(url) {
  try {
    return new URL(url, globalThis.location?.href).origin
  } catch {
    return null
  }
}

function linkSignals(external, controller) {
  if (!external) return () => {}
  if (external.aborted) controller.abort(external.reason)
  const onAbort = () => controller.abort(external.reason)
  external.addEventListener('abort', onAbort, { once: true })
  return () => external.removeEventListener('abort', onAbort)
}

async function readLimited(response, maxBytes) {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError('too-large')
  }
  if (!response.body?.getReader) {
    const text = await response.text()
    if (text.length > maxBytes) throw new HttpError('too-large')
    return text
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      reader.cancel().catch(() => {})
      throw new HttpError('too-large')
    }
    out += decoder.decode(value, { stream: true })
  }
  return out + decoder.decode()
}

/**
 * GET yang mengembalikan JSON.
 * @returns {Promise<{ data: any, headers: Headers }>}
 */
export function getJson(url, options = {}) {
  return requestJson('GET', url, options)
}

/**
 * POST JSON yang mengembalikan JSON. Dipakai hanya untuk Asisten. Tanpa
 * pengalihan (redirect pada POST dianggap salah konfigurasi) dan tanpa cache.
 * @returns {Promise<{ data: any, headers: Headers }>}
 */
export function postJson(url, body, options = {}) {
  return requestJson('POST', url, {
    allowedOrigins: [globalThis.location?.origin].filter(Boolean),
    ...options,
    body
  })
}

async function requestJson(
  method,
  url,
  {
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    allowedOrigins = ALLOWED_FETCH_ORIGINS,
    body: payload
  } = {}
) {
  const isPost = method === 'POST'
  const requestOrigin = originOf(url)
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    throw new HttpError('blocked', { detail: 'origin tidak diizinkan' })
  }

  const controller = new AbortController()
  const unlink = linkSignals(signal, controller)
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    let response
    try {
      response = await fetch(url, {
        method,
        headers: isPost
          ? { Accept: 'application/json', 'Content-Type': 'application/json' }
          : { Accept: 'application/json' },
        ...(isPost ? { body: JSON.stringify(payload) } : {}),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: isPost ? 'no-store' : 'default',
        redirect: isPost ? 'error' : 'follow',
        signal: controller.signal
      })
    } catch (err) {
      if (timedOut) throw new HttpError('timeout')
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new HttpError('aborted')
      }
      throw new HttpError('network')
    }

    const finalOrigin = originOf(response.url || url)
    if (!finalOrigin || !allowedOrigins.includes(finalOrigin)) {
      throw new HttpError('blocked', { detail: 'redirect ke origin lain' })
    }

    const requestId = response.headers.get('x-request-id')
    if (!response.ok) {
      throw new HttpError('http', { status: response.status, requestId })
    }

    const type = response.headers.get('content-type') ?? ''
    if (!/\bjson\b/i.test(type)) {
      throw new HttpError('parse', {
        status: response.status,
        requestId,
        detail: 'bukan JSON'
      })
    }

    let body
    try {
      body = await readLimited(response, maxBytes)
    } catch (err) {
      if (err instanceof HttpError) throw err
      if (timedOut) throw new HttpError('timeout')
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new HttpError('aborted')
      }
      throw new HttpError('network')
    }

    try {
      return { data: JSON.parse(body), headers: response.headers }
    } catch {
      throw new HttpError('parse', {
        status: response.status,
        requestId,
        detail: 'JSON rusak'
      })
    }
  } finally {
    clearTimeout(timer)
    unlink()
  }
}

/**
 * GET yang mengembalikan byte berkas (mis. PDF untuk pratinjau), dengan batas ukuran.
 * Berbeda dari getJson: pengalihan TIDAK diikuti (kind `external`), karena berkas di host lain
 * dilarang CSP dan bukan milik layanan ini. Origin tujuan harus ada di daftar izin.
 * kind galat: blocked, external, http, network, aborted, too-large (dengan `size`).
 * @returns {Promise<Uint8Array>}
 */
export async function getBytes(
  url,
  {
    signal,
    maxBytes = DEFAULT_MAX_BYTES,
    accept = '*/*',
    onProgress,
    allowedOrigins = ALLOWED_FETCH_ORIGINS
  } = {}
) {
  const requestOrigin = originOf(url)
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    throw new HttpError('blocked', { detail: 'origin tidak diizinkan' })
  }

  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: accept },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'manual',
      cache: 'default',
      signal
    })
  } catch (err) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw new HttpError('aborted')
    }
    throw new HttpError('network')
  }
  if (
    response.type === 'opaqueredirect' ||
    response.status === 0 ||
    (response.status >= 300 && response.status < 400)
  ) {
    throw new HttpError('external')
  }
  if (!response.ok) {
    throw new HttpError('http', {
      status: response.status,
      requestId: response.headers.get('x-request-id')
    })
  }

  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    response.body?.cancel?.().catch(() => {})
    throw new HttpError('too-large', { size: declared })
  }

  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > maxBytes) {
      throw new HttpError('too-large', { size: buffer.byteLength })
    }
    return new Uint8Array(buffer)
  }

  const reader = response.body.getReader()
  const chunks = []
  let received = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) {
        reader.cancel().catch(() => {})
        throw new HttpError('too-large', { size: received })
      }
      chunks.push(value)
      if (onProgress && declared > 0)
        onProgress(Math.min(1, received / declared))
    }
  } catch (err) {
    if (err instanceof HttpError) throw err
    if (signal?.aborted || err?.name === 'AbortError') {
      throw new HttpError('aborted')
    }
    throw new HttpError('network')
  }
  const out = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}
