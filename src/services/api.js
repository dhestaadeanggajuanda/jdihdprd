// API JDIH (hanya GET). Kontrak: docs/api/openapi.yaml.
import { API_BASE } from '@/config/endpoints.js'
import { getJson, buildUrl } from './http.js'
import {
  dokumenList,
  dokumenDetailResponse,
  ringkasan,
  statistik,
  referensi,
  halamanList,
  halaman
} from './normalizers.js'
import { isValidId, isValidSlug, toApiParams } from '@/utils/validators.js'
import { opaqueId } from '@/utils/schema.js'
import { noteSample } from './sample.js'

async function get(path, params, opts) {
  const res = await getJson(buildUrl(API_BASE, path, params), opts)
  noteSample(res.headers)
  return res
}

export async function getRingkasan(opts) {
  const { data } = await get('/ringkasan', {}, opts)
  return ringkasan(data)
}

export async function searchDokumen(filters, { perPage, ...opts } = {}) {
  const { data } = await get(
    '/dokumen',
    toApiParams(filters, { perPage }),
    opts
  )
  return dokumenList(data)
}

export async function getDokumen(id, opts) {
  if (!isValidId(id)) throw new RangeError('ID dokumen tidak valid')
  const { data } = await get(`/dokumen/${id}`, {}, opts)
  return dokumenDetailResponse(data).dokumen
}

export async function getReferensi(nama, opts) {
  if (!isValidSlug(nama)) throw new RangeError('nama referensi tidak valid')
  const { data } = await get(`/referensi/${nama}`, {}, opts)
  return referensi(data)
}

export async function getStatistik(opts) {
  const { data } = await get('/statistik', {}, opts)
  return statistik(data)
}

export async function getHalamanList(opts) {
  const { data } = await get('/halaman', {}, opts)
  return halamanList(data)
}

export async function getHalaman(slug, opts) {
  if (!isValidSlug(slug)) throw new RangeError('slug halaman tidak valid')
  const { data } = await get(`/halaman/${slug}`, {}, opts)
  return halaman(data)
}

export async function getPuuKategori(opts) {
  const { data } = await get('/puu', {}, opts)
  return referensi(data)
}

export async function getPuu(
  kategori,
  { page = 1, perPage = 10, ...opts } = {}
) {
  if (!isValidSlug(kategori)) throw new RangeError('kategori tidak valid')
  const { data } = await get(
    `/puu/${kategori}`,
    { page, per_page: perPage },
    opts
  )
  return dokumenList(data)
}

// URL berkas halaman Tentang (gambar struktur organisasi, SOP): dibentuk dari slug.
export function halamanBerkasUrl(slug) {
  if (!isValidSlug(slug)) throw new RangeError('slug halaman tidak valid')
  return `${API_BASE}/halaman/${slug}/berkas`
}

// URL unduhan berkas. Tidak dipanggil lewat fetch: dibuka peramban/aplikasi
// sebagai unduhan. ID dicek agar tidak bisa disusupi jalur lain.
export function lampiranUrl(dokumenId, lampiranId) {
  if (!isValidId(dokumenId)) throw new RangeError('ID dokumen tidak valid')
  const safe = opaqueId(lampiranId, 'lampiran')
  return `${API_BASE}/dokumen/${dokumenId}/lampiran/${safe}`
}
