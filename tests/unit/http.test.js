import { describe, it, expect, vi, afterEach } from 'vitest'
import { getJson, buildUrl, HttpError } from '@/services/http.js'

const ORIGIN = 'https://api.contoh.test'
const OPTS = { allowedOrigins: [ORIGIN] }

function response(
  body,
  {
    status = 200,
    type = 'application/json',
    url = `${ORIGIN}/x`,
    headers = {}
  } = {}
) {
  const res = new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {
      status,
      headers: { 'content-type': type, ...headers }
    }
  )
  Object.defineProperty(res, 'url', { value: url })
  return res
}

afterEach(() => vi.unstubAllGlobals())

describe('buildUrl', () => {
  it('meng-encode parameter dan melewati nilai kosong', () => {
    expect(
      buildUrl('/api', '/dokumen', {
        q: 'a&b=c',
        kosong: '',
        n: null,
        u: undefined,
        f: false,
        b: true,
        p: 2
      })
    ).toBe('/api/dokumen?q=a%26b%3Dc&b=1&p=2')
    expect(buildUrl('/api', '/x')).toBe('/api/x')
  })
})

describe('getJson', () => {
  it('mengembalikan JSON dan memakai permintaan aman', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [1] }))
    vi.stubGlobal('fetch', fetchMock)
    const { data } = await getJson(`${ORIGIN}/x`, OPTS)
    expect(data).toEqual({ data: [1] })
    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('omit')
    expect(init.referrerPolicy).toBe('no-referrer')
  })

  it('memblokir origin di luar allowlist sebelum mengirim permintaan', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(getJson('https://evil.test/x', OPTS)).rejects.toMatchObject({
      kind: 'blocked'
    })
    await expect(
      getJson('http://api.contoh.test/x', OPTS)
    ).rejects.toMatchObject({ kind: 'blocked' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('memblokir redirect ke origin lain', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({}, { url: 'https://evil.test/y' }))
    )
    await expect(getJson(`${ORIGIN}/x`, OPTS)).rejects.toMatchObject({
      kind: 'blocked'
    })
  })

  it('status galat menjadi HttpError http dengan ID permintaan', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          response(
            { title: 'x' },
            { status: 503, headers: { 'x-request-id': '7F3A-91C2' } }
          )
        )
    )
    const err = await getJson(`${ORIGIN}/x`, OPTS).catch(e => e)
    expect(err).toBeInstanceOf(HttpError)
    expect(err).toMatchObject({
      kind: 'http',
      status: 503,
      requestId: '7F3A-91C2'
    })
  })

  it('menolak tipe konten bukan JSON dan JSON rusak', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response('<html>', { type: 'text/html' }))
    )
    await expect(getJson(`${ORIGIN}/x`, OPTS)).rejects.toMatchObject({
      kind: 'parse'
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(response('{rusak', { type: 'application/json' }))
    )
    await expect(getJson(`${ORIGIN}/x`, OPTS)).rejects.toMatchObject({
      kind: 'parse'
    })
  })

  it('menerima application/problem+json sebagai galat http', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          response(
            { title: 'x' },
            { status: 404, type: 'application/problem+json' }
          )
        )
    )
    await expect(getJson(`${ORIGIN}/x`, OPTS)).rejects.toMatchObject({
      kind: 'http',
      status: 404
    })
  })

  it('menolak respons melebihi batas ukuran', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(response('x'.repeat(5000).replace(/^/, '"') + '"'))
    )
    await expect(
      getJson(`${ORIGIN}/x`, { ...OPTS, maxBytes: 1000 })
    ).rejects.toMatchObject({ kind: 'too-large' })
  })

  it('kegagalan jaringan, batas waktu, dan pembatalan dibedakan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    )
    await expect(getJson(`${ORIGIN}/x`, OPTS)).rejects.toMatchObject({
      kind: 'network'
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (url, init) =>
          new Promise((_, reject) =>
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('x', 'AbortError'))
            )
          )
      )
    )
    await expect(
      getJson(`${ORIGIN}/x`, { ...OPTS, timeoutMs: 20 })
    ).rejects.toMatchObject({ kind: 'timeout' })

    const ctl = new AbortController()
    const p = getJson(`${ORIGIN}/x`, { ...OPTS, signal: ctl.signal })
    ctl.abort()
    await expect(p).rejects.toMatchObject({ kind: 'aborted' })
  })
})
