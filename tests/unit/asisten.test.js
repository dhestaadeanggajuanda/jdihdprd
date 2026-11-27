import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  JAWABAN_MAX,
  PERTANYAAN,
  SUMBER_MAX,
  normalisasiJawaban,
  periksaPertanyaan,
  sumberKeRute,
  tanyaAsisten
} from '@/services/asisten.js'

afterEach(() => vi.unstubAllGlobals())

describe('periksaPertanyaan', () => {
  it('merapikan spasi dan menerima panjang 3 sampai 500', () => {
    expect(periksaPertanyaan('  perda   pasar \n')).toMatchObject({
      ok: true,
      nilai: 'perda pasar'
    })
    expect(periksaPertanyaan('abc').ok).toBe(true)
    expect(periksaPertanyaan('a'.repeat(PERTANYAAN.max)).ok).toBe(true)
  })

  it('menolak terlalu pendek atau terlalu panjang dengan pesan', () => {
    for (const v of ['', 'ab', '   a  ', null, undefined]) {
      const r = periksaPertanyaan(v)
      expect(r.ok, String(v)).toBe(false)
      expect(r.pesan).toMatch(/minimal 3/)
    }
    const panjang = periksaPertanyaan('a'.repeat(PERTANYAAN.max + 1))
    expect(panjang.ok).toBe(false)
    expect(panjang.pesan).toMatch(/maksimal 500/)
  })

  it('membuang karakter kendali', () => {
    expect(periksaPertanyaan('ab\u0000cd').nilai).toBe('ab cd')
  })
})

describe('sumberKeRute', () => {
  const HOST = 'jdih.contoh.go.id'

  it('mengubah tautan dokumen host sendiri menjadi rute dalam aplikasi', () => {
    expect(sumberKeRute('https://jdih.contoh.go.id/dokumen/117', HOST)).toBe(
      '/dokumen/117'
    )
    expect(
      sumberKeRute('https://jdih.contoh.go.id/dokumen/117-perda-pasar', HOST)
    ).toBe('/dokumen/117')
    expect(sumberKeRute('/dokumen/9-judul?x=1#y', HOST)).toBe('/dokumen/9')
    expect(sumberKeRute('/dokumen/009', HOST)).toBe('/dokumen/9')
  })

  it('menolak host lain, skema lain, kredensial, dan jalur lain', () => {
    for (const u of [
      'https://evil.test/dokumen/117',
      'https://jdih.contoh.go.id.evil.test/dokumen/117',
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://jdih.contoh.go.id/dokumen/1',
      'https://user:pw@jdih.contoh.go.id/dokumen/1',
      '//evil.test/dokumen/1',
      '/dokumen/abc',
      '/dokumen/117/../../x',
      '/dokumen/12345678901',
      '/berita/1',
      'https://jdih.contoh.go.id/api/v1/dokumen/1',
      '',
      null,
      undefined,
      42,
      `/dokumen/${'1'.repeat(600)}`
    ]) {
      expect(sumberKeRute(u, HOST), String(u)).toBeNull()
    }
  })

  it('tanpa host pembanding, alamat penuh ditolak', () => {
    expect(sumberKeRute('https://jdih.contoh.go.id/dokumen/1', '')).toBeNull()
  })
})

describe('normalisasiJawaban', () => {
  const sumber = {
    judul: 'Retribusi Pelayanan Pasar',
    jenis_peraturan: 'Peraturan Daerah',
    nomor_peraturan: '7',
    tahun_terbit: '2019',
    status: 'Berlaku',
    url: '/dokumen/117',
    skor_kemiripan: 0.9
  }

  it('mengambil jawaban dan sumber', () => {
    const r = normalisasiJawaban({ answer: 'Ada.', sources: [sumber] })
    expect(r.answer).toBe('Ada.')
    expect(r.sources).toEqual([
      {
        judulNomor: 'Peraturan Daerah Nomor 7 Tahun 2019',
        judul: 'Retribusi Pelayanan Pasar',
        status: { kelas: 'ok', teks: 'Berlaku', ikon: 'check-circle' },
        rute: '/dokumen/117'
      }
    ])
  })

  it('jawaban selalu teks biasa: tidak ada HTML yang diteruskan sebagai markup', () => {
    const r = normalisasiJawaban({
      answer: '<img src=x onerror=alert(1)> Ada',
      sources: []
    })
    // Disimpan apa adanya sebagai string; komponen merendernya dengan {{ }} (di-escape).
    expect(typeof r.answer).toBe('string')
    expect(r).not.toHaveProperty('html')
  })

  it('status dikenal dipetakan; status lain tanpa lencana', () => {
    const s = status =>
      normalisasiJawaban({ answer: 'x', sources: [{ ...sumber, status }] })
        .sources[0].status
    expect(s('DICABUT')).toMatchObject({ kelas: 'bad', teks: 'Dicabut' })
    expect(s('diubah')).toMatchObject({ kelas: 'warn', teks: 'Diubah' })
    expect(s('entah')).toBeNull()
    expect(s(null)).toBeNull()
  })

  it('tautan sumber tidak tepercaya: tanpa rute, kartu tetap tampil', () => {
    const r = normalisasiJawaban({
      answer: 'x',
      sources: [{ ...sumber, url: 'https://evil.test/dokumen/1' }]
    })
    expect(r.sources[0].rute).toBeNull()
    expect(r.sources[0].judulNomor).toMatch(/Nomor 7/)
  })

  it('membatasi jumlah sumber dan panjang jawaban; membuang sumber kosong', () => {
    const banyak = Array.from({ length: 20 }, () => sumber)
    expect(
      normalisasiJawaban({ answer: 'x', sources: banyak }).sources
    ).toHaveLength(SUMBER_MAX)
    expect(
      normalisasiJawaban({ answer: 'a'.repeat(JAWABAN_MAX * 2), sources: [] })
        .answer
    ).toHaveLength(JAWABAN_MAX)
    expect(
      normalisasiJawaban({ answer: 'x', sources: [{}, null, 'x', 5] }).sources
    ).toEqual([])
  })

  it('bentuk yang salah menjadi SchemaError', () => {
    for (const v of [
      null,
      undefined,
      'teks',
      [],
      {},
      { answer: 5 },
      { answer: '   ' },
      { sources: [] }
    ]) {
      expect(() => normalisasiJawaban(v), JSON.stringify(v)).toThrow(
        expect.objectContaining({ name: 'SchemaError' })
      )
    }
  })

  it('sources bukan larik dianggap tanpa sumber', () => {
    expect(normalisasiJawaban({ answer: 'x', sources: 'a' }).sources).toEqual(
      []
    )
  })
})

describe('tanyaAsisten', () => {
  function stub(body, { status = 200, type = 'application/json' } = {}) {
    const res = new Response(
      typeof body === 'string' ? body : JSON.stringify(body),
      {
        status,
        headers: { 'content-type': type }
      }
    )
    Object.defineProperty(res, 'url', {
      value: `${globalThis.location.origin}/asisten/chat`
    })
    const fetchMock = vi.fn().mockResolvedValue(res)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('mengirim POST JSON { question } tanpa kredensial dan referrer', async () => {
    const fetchMock = stub({ answer: 'Ada.', sources: [] })
    const r = await tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    expect(r.answer).toBe('Ada.')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/asisten/chat')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ question: 'perda pasar' })
    expect(init.credentials).toBe('omit')
    expect(init.referrerPolicy).toBe('no-referrer')
    expect(init.redirect).toBe('error')
    expect(init.cache).toBe('no-store')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('status 429 dan 5xx menjadi HttpError (kind http)', async () => {
    stub({ detail: 'x' }, { status: 429 })
    await expect(
      tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    ).rejects.toMatchObject({ kind: 'http', status: 429 })
    stub({ detail: 'x' }, { status: 502 })
    await expect(
      tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    ).rejects.toMatchObject({ kind: 'http', status: 502 })
  })

  it('respons bukan JSON atau bentuk salah ditolak', async () => {
    stub('<html>', { type: 'text/html' })
    await expect(
      tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    ).rejects.toMatchObject({ kind: 'parse' })
    stub({ tidak: 'ada answer' })
    await expect(
      tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    ).rejects.toMatchObject({ name: 'SchemaError' })
  })

  it('memblokir endpoint di luar origin sendiri sebelum mengirim', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      tanyaAsisten('perda pasar', { endpoint: 'https://evil.test/chat' })
    ).rejects.toMatchObject({ kind: 'blocked' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('gagal jaringan menjadi kind network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('gagal')))
    await expect(
      tanyaAsisten('perda pasar', { endpoint: '/asisten/chat' })
    ).rejects.toMatchObject({ kind: 'network' })
  })
})
