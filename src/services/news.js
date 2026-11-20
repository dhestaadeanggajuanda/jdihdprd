// Berita dari Media Center (WordPress REST publik) yang disaring oleh
// JDIH_NEWS_FILTER. Setiap kata kunci dicari sebagai frasa utuh, hasil
// digabung per id, terbaru lebih dulu. Judul dan ringkasan menjadi teks polos.

import { MEDIACENTER_BASE, NEWS_HOSTS } from '@/config/endpoints.js'
import { NEWS_FILTER } from '@/config/env.js'
import { getJson, buildUrl, HttpError } from './http.js'
import { htmlToText, truncate } from '@/utils/text.js'
import { safeExternalUrl } from '@/utils/url.js'
import { isoDate } from '@/utils/schema.js'

const CACHE_MS = 5 * 60 * 1000
const cache = new Map()

const POST_FIELDS = 'id,date,link,title,excerpt,featured_media'

function normalizePost(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  if (!Number.isInteger(id) || id <= 0) return null
  const link = safeExternalUrl(raw.link, NEWS_HOSTS)
  const date = isoDate(raw.date)
  const title = htmlToText(raw.title?.rendered)
  if (!link || !date || !title) return null
  return {
    id,
    date,
    link,
    title: truncate(title, 220),
    excerpt: truncate(htmlToText(raw.excerpt?.rendered), 200),
    mediaId:
      Number.isInteger(raw.featured_media) && raw.featured_media > 0
        ? raw.featured_media
        : null,
    image: null
  }
}

function pickImage(media) {
  const sizes = media?.media_details?.sizes ?? {}
  const candidate =
    sizes.medium_large?.source_url ??
    sizes.medium?.source_url ??
    media?.source_url
  const url = safeExternalUrl(candidate, NEWS_HOSTS)
  if (!url) return null
  return {
    url,
    width:
      Number(
        sizes.medium_large?.width ??
          sizes.medium?.width ??
          media?.media_details?.width
      ) || null,
    height:
      Number(
        sizes.medium_large?.height ??
          sizes.medium?.height ??
          media?.media_details?.height
      ) || null
  }
}

/**
 * Menggabungkan hasil per kata kunci: tanpa duplikat (per id), terbaru dulu.
 * Fungsi murni agar mudah diuji.
 */
export function mergePosts(groups, limit) {
  const byId = new Map()
  for (const posts of groups) {
    for (const post of posts) if (!byId.has(post.id)) byId.set(post.id, post)
  }
  return [...byId.values()]
    .sort((a, b) =>
      a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1
    )
    .slice(0, limit)
}

async function searchTerm(term, limit, signal) {
  const url = buildUrl(MEDIACENTER_BASE, '/posts', {
    search: `"${term}"`,
    per_page: Math.min(limit, 50),
    orderby: 'date',
    order: 'desc',
    _fields: POST_FIELDS
  })
  const { data } = await getJson(url, { signal })
  if (!Array.isArray(data))
    throw new HttpError('parse', { detail: 'daftar berita' })
  return data.map(normalizePost).filter(Boolean)
}

async function attachImages(posts, signal) {
  const ids = [...new Set(posts.map(p => p.mediaId).filter(Boolean))]
  if (ids.length === 0) return posts
  try {
    const url = buildUrl(MEDIACENTER_BASE, '/media', {
      include: ids.join(','),
      per_page: ids.length,
      _fields: 'id,source_url,media_details'
    })
    const { data } = await getJson(url, { signal })
    const byId = new Map(
      (Array.isArray(data) ? data : []).map(m => [m?.id, pickImage(m)])
    )
    return posts.map(p => ({ ...p, image: byId.get(p.mediaId) ?? null }))
  } catch (err) {
    // Gambar bersifat tambahan: kegagalan tidak boleh menggagalkan daftar.
    if (err instanceof HttpError && err.kind === 'aborted') throw err
    return posts
  }
}

/**
 * @returns {Promise<{ posts: Array, hasMore: boolean, partial: boolean }>}
 * Gagal sebagian menampilkan yang berhasil; gagal total melempar HttpError.
 */
export async function fetchNews({
  terms = NEWS_FILTER,
  limit = 6,
  signal
} = {}) {
  const key = `${terms.join('|')}#${limit}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value

  const settled = await Promise.allSettled(
    terms.map(t => searchTerm(t, limit, signal))
  )
  if (signal?.aborted) throw new HttpError('aborted')

  const groups = settled.filter(r => r.status === 'fulfilled').map(r => r.value)
  if (groups.length === 0) {
    const firstError = settled.find(r => r.status === 'rejected')?.reason
    throw firstError instanceof HttpError
      ? firstError
      : new HttpError('network')
  }

  const all = mergePosts(groups, Number.MAX_SAFE_INTEGER)
  const posts = await attachImages(all.slice(0, limit), signal)
  const value = {
    posts,
    hasMore:
      all.length > limit || groups.some(g => g.length >= Math.min(limit, 50)),
    partial: groups.length < terms.length
  }
  cache.set(key, { at: Date.now(), value })
  return value
}

export function clearNewsCache() {
  cache.clear()
}
