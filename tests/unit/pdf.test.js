import { describe, it, expect, vi, afterEach } from 'vitest'
import { PDF_MAX_BYTES, PdfError, ambilPdf } from '@/services/pdf.js'

afterEach(() => vi.unstubAllGlobals())

const URL_PDF = 'https://jdih.contoh.go.id/api/v1/dokumen/1/lampiran/f1'
const OPTS = { allowedOrigins: ['https://jdih.contoh.go.id'] }

function stub(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Response dengan tubuh berupa aliran, supaya pembacaan bertahap dan pembatalan teruji.
function streamResponse(chunks, { status = 200, headers = {} } = {}) {
  let i = 0
  const cancel = vi.fn()
  const body = new ReadableStream({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(chunks[i++])
      else controller.close()
    },
    cancel
  })
  return { res: new Response(body, { status, headers }), cancel }
}

describe('ambilPdf', () => {
  it('mengunduh berkas dengan permintaan aman', async () => {
    const { res } = streamResponse([
      new Uint8Array([1, 2]),
      new Uint8Array([3])
    ])
    const fetchMock = stub(res)
    const bytes = await ambilPdf(URL_PDF, OPTS)
    expect([...bytes]).toEqual([1, 2, 3])
    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('omit')
    expect(init.referrerPolicy).toBe('no-referrer')
    expect(init.redirect).toBe('manual')
    expect(init.headers).toEqual({ Accept: 'application/pdf' })
  })

  it('pengalihan (opaqueredirect atau 3xx) = berkas di situs lain', async () => {
    stub({
      type: 'opaqueredirect',
      status: 0,
      ok: false,
      headers: new Headers()
    })
    await expect(ambilPdf(URL_PDF, OPTS)).rejects.toMatchObject({
      kind: 'external'
    })
    stub({ type: 'basic', status: 302, ok: false, headers: new Headers() })
    await expect(ambilPdf(URL_PDF, OPTS)).rejects.toMatchObject({
      kind: 'external'
    })
  })

  it('status galat menjadi kind http dengan kodenya', async () => {
    stub(new Response('x', { status: 503 }))
    await expect(ambilPdf(URL_PDF, OPTS)).rejects.toMatchObject({
      kind: 'http',
      status: 503
    })
  })

  it('menolak dari header Content-Length tanpa membaca tubuh', async () => {
    const { res, cancel } = streamResponse([new Uint8Array(10)], {
      headers: { 'content-length': String(PDF_MAX_BYTES + 1) }
    })
    stub(res)
    await expect(ambilPdf(URL_PDF, OPTS)).rejects.toMatchObject({
      kind: 'too-large',
      size: PDF_MAX_BYTES + 1
    })
    expect(cancel).toHaveBeenCalled()
  })

  it('menghentikan unduhan saat byte yang diterima melewati batas', async () => {
    const { res, cancel } = streamResponse([
      new Uint8Array(60),
      new Uint8Array(60),
      new Uint8Array(60)
    ])
    stub(res)
    await expect(
      ambilPdf(URL_PDF, { ...OPTS, maxBytes: 100 })
    ).rejects.toMatchObject({
      kind: 'too-large'
    })
    expect(cancel).toHaveBeenCalled()
  })

  it('gagal jaringan dan pembatalan dibedakan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('gagal')))
    await expect(ambilPdf(URL_PDF, OPTS)).rejects.toMatchObject({
      kind: 'network'
    })

    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('x', 'AbortError'))
    )
    await expect(
      ambilPdf(URL_PDF, { ...OPTS, signal: controller.signal })
    ).rejects.toMatchObject({ kind: 'aborted' })
  })

  it('melaporkan kemajuan bila ukuran diketahui', async () => {
    const { res } = streamResponse([new Uint8Array(50), new Uint8Array(50)], {
      headers: { 'content-length': '100' }
    })
    stub(res)
    const onProgress = vi.fn()
    await ambilPdf(URL_PDF, { ...OPTS, onProgress })
    expect(onProgress).toHaveBeenLastCalledWith(1)
  })

  it('alamat di luar daftar izin tidak diambil sama sekali (dianggap berkas di situs lain)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    for (const u of [
      'https://evil.test/berkas.pdf',
      'http://jdih.contoh.go.id/api/v1/dokumen/1/lampiran/f1',
      'javascript:alert(1)',
      ''
    ]) {
      await expect(ambilPdf(u, OPTS), u).rejects.toMatchObject({
        kind: 'external'
      })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('PdfError membawa jenis dan ukuran', () => {
    const e = new PdfError('too-large', { size: 5 })
    expect(e).toMatchObject({ kind: 'too-large', size: 5, name: 'PdfError' })
  })
})
