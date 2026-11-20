// Konfigurasi dari variabel lingkungan. Tidak ada rahasia di kode atau repo.
//
//   DB_URL                mysql://pengguna:sandi@host:3306/db_jdihdprd  (WAJIB; gunakan akun SELECT-only)
//   HOST, PORT            alamat dengar (bawaan 127.0.0.1:3000; di belakang nginx)
//   CORS_ORIGINS          daftar origin yang boleh memanggil API dari peramban, dipisah koma
//                         (mis. https://jdih.dprd.singkawangkota.go.id,https://localhost untuk Android)
//   TRUST_PROXY           1 bila di belakang nginx (memakai X-Forwarded-For untuk IP pembatas laju)
//   RATE_LIMIT_MAX        permintaan per menit per IP (bawaan 120)
//   FILES_DIR             folder berkas dokumen (common/dokumen) di server
//   FILES_MODE            "accel" (nginx X-Accel-Redirect, disarankan) atau "stream" (Node membaca berkas)
//   FILES_ACCEL_PREFIX    lokasi internal nginx untuk mode accel (bawaan /internal-dokumen/)
//   FILE_REDIRECT_HOSTS   host eksternal yang boleh dialihkan untuk lampiran berupa URL penuh
//                         (bawaan bphn.jdihn.go.id,jdihn.go.id)
//   PAGE_FILES_DIR        folder gambar halaman Tentang (struktur organisasi, SOP)
//   API_SAMPLE            1 = tandai respons sebagai data contoh (hanya untuk lingkungan uji)

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
    trustProxy: env.TRUST_PROXY === '1',
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
