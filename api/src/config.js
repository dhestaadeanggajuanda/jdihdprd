// Konfigurasi dari variabel lingkungan. Tidak ada rahasia di kode atau repo.
//
//   DB_URL                mysql://pengguna:sandi@host:3306/db_jdihdprd  (WAJIB; gunakan akun SELECT-only)
//   HOST, PORT            alamat dengar (bawaan 127.0.0.1:3000; di belakang nginx)
//   CORS_ORIGINS          daftar origin yang boleh memanggil API dari peramban, dipisah koma
//                         (mis. https://jdih.dprd.singkawangkota.go.id,https://localhost untuk Android)
//   TRUST_PROXY           alamat proxy tepercaya di depan API: "loopback" (nginx di mesin yang sama)
//                         atau daftar IP/CIDR dipisah koma; kosong = tanpa proxy. "true" dan angka
//                         ditolak (IP klien bisa dipalsukan untuk lolos dari batas laju)
//   RATE_LIMIT_MAX        permintaan per menit per IP (bawaan 120)
//   FILES_DIR             folder berkas dokumen (common/dokumen) di server
//   FILES_MODE            "accel" (nginx X-Accel-Redirect, disarankan) atau "stream" (Node membaca berkas)
//   FILES_ACCEL_PREFIX    lokasi internal nginx untuk mode accel (bawaan /internal-dokumen/)
//   FILE_REDIRECT_HOSTS   host eksternal yang boleh dialihkan untuk lampiran berupa URL penuh
//                         (bawaan bphn.jdihn.go.id,jdihn.go.id)
//   PAGE_FILES_DIR        folder gambar halaman Tentang (struktur organisasi, SOP)
//   API_SAMPLE            1 = tandai respons sebagai data contoh (hanya untuk lingkungan uji)

import { isIP } from 'node:net'

// TRUST_PROXY menentukan dari mana IP klien (kunci pembatas laju) dibaca. Hanya header
// X-Forwarded-For dari proxy yang ALAMATNYA disebut di sini yang dipercaya; dari soket lain
// header itu diabaikan, dan IP klien diambil dari kanan (entri terakhir yang bukan proxy
// tepercaya), sehingga entri palsu di kiri tidak berpengaruh.
// Sengaja ditolak: `true` ("percaya semua") dan angka hop (di Fastify bentuk angka tidak
// berperilaku sebagai "jumlah proxy": IP klien jatuh ke alamat nginx, semua orang berbagi satu
// keranjang batas laju), serta alamat/CIDR /0 ("semua alamat").
// Diterima: `loopback` (nginx di mesin yang sama), IP, atau CIDR, dipisah koma. Kosong/0 = tanpa proxy.
export function parseTrustProxy(v) {
  const s = String(v ?? '').trim()
  if (s === '' || s === '0') return false
  const ok = x => {
    if (x.toLowerCase() === 'loopback') return true
    const [addr, bits, ...rest] = x.split('/')
    const ver = isIP(addr)
    if (ver === 0 || rest.length > 0) return false
    if (bits === undefined) return true
    return (
      /^\d{1,3}$/.test(bits) &&
      Number(bits) >= 1 &&
      Number(bits) <= (ver === 4 ? 32 : 128)
    )
  }
  const items = s.split(',').map(x => x.trim())
  if (items.every(ok))
    return items.map(x => (x.toLowerCase() === 'loopback' ? 'loopback' : x))
  throw new Error(
    'TRUST_PROXY tidak valid: isi "loopback" (nginx di mesin yang sama) atau daftar IP/CIDR proxy, mis. 127.0.0.1,10.0.0.0/8. "true" dan angka tidak diterima.'
  )
}

const int = (v, d, min, max) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? n : d
}
const list = v =>
  String(v ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

export function loadConfig(env = process.env) {
  const dbUrl = env.DB_URL ?? ''
  let parsed
  try {
    parsed = new URL(dbUrl)
  } catch {
    throw new Error(
      'DB_URL wajib diisi dengan format mysql://pengguna:sandi@host:3306/nama_db'
    )
  }
  if (parsed.protocol !== 'mysql:')
    throw new Error('DB_URL harus berskema mysql://')

  const corsOrigins = list(env.CORS_ORIGINS)
  for (const o of corsOrigins) {
    if (
      !/^https:\/\/[a-z0-9.-]+(:\d{1,5})?$/i.test(o) &&
      !/^http:\/\/localhost(:\d{1,5})?$/.test(o)
    ) {
      throw new Error(`CORS_ORIGINS memuat origin tidak valid: ${o}`)
    }
  }

  const filesMode = env.FILES_MODE === 'accel' ? 'accel' : 'stream'
  return Object.freeze({
    dbUrl,
    host: env.HOST ?? '127.0.0.1',
    port: int(env.PORT, 3000, 1, 65535),
    corsOrigins,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    rateLimitMax: int(env.RATE_LIMIT_MAX, 120, 1, 100000),
    filesDir: env.FILES_DIR ?? '',
    filesMode,
    filesAccelPrefix: env.FILES_ACCEL_PREFIX ?? '/internal-dokumen/',
    fileRedirectHosts: list(
      env.FILE_REDIRECT_HOSTS ?? 'bphn.jdihn.go.id,jdihn.go.id'
    ).map(h => h.toLowerCase()),
    pageFilesDir: env.PAGE_FILES_DIR ?? '',
    sample: env.API_SAMPLE === '1'
  })
}
