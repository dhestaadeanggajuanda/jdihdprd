// Klien HTTP tunggal. Semua permintaan jaringan aplikasi lewat sini.
// Kontrol: GET saja, tanpa kredensial dan referrer, batas waktu, pembatalan,
// batas ukuran respons, tipe konten JSON, dan pengecekan origin akhir
// (termasuk setelah redirect).

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
 *  - too-large respons melebihi batas
 *  - blocked   origin akhir di luar allowlist
 */
export class HttpError extends Error {
  constructor(kind, { status = 0, requestId = null, detail = '' } = {}) {
    super(`${kind}${status ? ` ${status}` : ''}${detail ? `: ${detail}` : ''}`)
    this.name = 'HttpError'
    this.kind = kind
    this.status = status
    this.requestId = requestId
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
export async function getJson(
  url,
  {
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    allowedOrigins = ALLOWED_FETCH_ORIGINS
  } = {}
) {
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
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'default',
        redirect: 'follow',
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
