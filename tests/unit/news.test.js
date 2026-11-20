import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mergePosts, fetchNews, clearNewsCache } from '@/services/news.js'

const HOST = 'https://mediacenter.singkawangkota.go.id'

const wpPost = (id, date, title, extra = {}) => ({
  id,
  date: `${date}T08:00:00`,
  link: `${HOST}/berita/p-${id}/`,
  title: { rendered: title },
  excerpt: { rendered: '<p>Ringkasan &#8211; isi</p>' },
  featured_media: 0,
  ...extra
})

function jsonResponse(body) {
  const res = new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' }
  })
  Object.defineProperty(res, 'url', { value: `${HOST}/wp-json/wp/v2/x` })
  return res
}

beforeEach(() => clearNewsCache())
afterEach(() => vi.unstubAllGlobals())

describe('mergePosts', () => {
  it('menggabung per id tanpa duplikat, terbaru dulu, dan memotong sesuai batas', () => {
    const a = [
      { id: 1, date: '2026-11-01' },
      { id: 2, date: '2026-11-10' }
    ]
    const b = [
      { id: 2, date: '2026-11-10' },
      { id: 3, date: '2026-11-17' },
      { id: 4, date: '2026-11-10' }
    ]
    expect(mergePosts([a, b], 10).map(p => p.id)).toEqual([3, 4, 2, 1])
    expect(mergePosts([a, b], 2).map(p => p.id)).toEqual([3, 4])
  })
})

describe('fetchNews', () => {
  it('mencari tiap kata kunci sebagai frasa utuh dan memuat gambar sekali per halaman', async () => {
    const urls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async url => {
        urls.push(url)
        if (url.includes('/media?')) {
          return jsonResponse([
            {
              id: 55,
              source_url: `${HOST}/wp-content/uploads/a.jpg`,
              media_details: { width: 700, height: 466, sizes: {} }
            }
          ])
        }
        if (url.includes('produk'))
          return jsonResponse([
            wpPost(1, '2026-11-01', 'Produk &#8211; Hukum', {
              featured_media: 55
            })
          ])
        return jsonResponse([
          wpPost(2, '2026-11-17', 'Peraturan Baru'),
          wpPost(1, '2026-11-01', 'Produk &#8211; Hukum', {
            featured_media: 55
          })
        ])
      })
    )
    const { posts, partial } = await fetchNews({
      terms: ['produk hukum', 'peraturan'],
      limit: 6
    })
    expect(posts.map(p => p.id)).toEqual([2, 1])
    expect(posts[1].title).toBe('Produk – Hukum')
    expect(posts[1].image.url).toBe(`${HOST}/wp-content/uploads/a.jpg`)
    expect(partial).toBe(false)
    const search = urls.filter(u => u.includes('/posts?'))
    expect(search).toHaveLength(2)
    // URLSearchParams menulis spasi sebagai "+" (WordPress membacanya sebagai spasi).
    expect(decodeURIComponent(search[0].replace(/\+/g, ' '))).toContain(
      'search="produk hukum"'
    )
    expect(urls.filter(u => u.includes('/media?'))).toHaveLength(1)
  })

  it('membuang posting dengan tautan di luar host Media Center dan judul HTML dijadikan teks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse([
          wpPost(1, '2026-11-01', '<img src=x onerror=alert(1)>Aman'),
          wpPost(2, '2026-11-02', 'Jahat', { link: 'https://evil.com/berita' }),
          wpPost(3, '2026-11-03', 'JS', { link: 'javascript:alert(1)' })
        ])
      )
    )
    const { posts } = await fetchNews({ terms: ['peraturan'], limit: 6 })
    expect(posts.map(p => p.id)).toEqual([1])
    expect(posts[0].title).toBe('Aman')
  })

  it('gambar dari host lain diabaikan tanpa menggagalkan daftar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async url =>
        url.includes('/media?')
          ? jsonResponse([
              { id: 9, source_url: 'https://evil.com/x.jpg', media_details: {} }
            ])
          : jsonResponse([
              wpPost(1, '2026-11-01', 'Satu', { featured_media: 9 })
            ])
      )
    )
    const { posts } = await fetchNews({ terms: ['peraturan'], limit: 6 })
    expect(posts[0].image).toBeNull()
  })

  it('gagal sebagian menampilkan yang berhasil; gagal total melempar galat', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async url => {
        if (url.includes('dewan')) throw new TypeError('Failed to fetch')
        return jsonResponse([wpPost(1, '2026-11-01', 'Satu')])
      })
    )
    const partial = await fetchNews({ terms: ['peraturan', 'dewan'], limit: 6 })
    expect(partial.partial).toBe(true)
    expect(partial.posts).toHaveLength(1)

    clearNewsCache()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    )
    await expect(
      fetchNews({ terms: ['peraturan'], limit: 6 })
    ).rejects.toMatchObject({ kind: 'network' })
  })
})
