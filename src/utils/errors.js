// Mengubah galat teknis menjadi pesan untuk pengguna: setiap keadaan menyebut
// masalahnya dan jalan keluarnya. Tidak pernah memuat detail internal.

export function describeError(err, { online = true } = {}) {
  const kind = err?.kind ?? (err?.name === 'SchemaError' ? 'schema' : 'unknown')
  const requestId = err?.requestId ?? null

  if (kind === 'network' && !online) {
    return {
      kind: 'offline',
      title: 'Tidak ada koneksi internet',
      message:
        'Dokumen dimuat dari server. Sambungkan ke internet untuk melanjutkan.',
      requestId,
      retry: true
    }
  }
  if (kind === 'http' && err.status === 404) {
    return {
      kind: 'tidak-ada',
      title: 'Tidak ditemukan',
      message:
        'Tautan ini mungkin sudah berubah atau dokumennya sudah dipindahkan.',
      requestId,
      retry: false
    }
  }
  if (kind === 'http' && err.status === 429) {
    return {
      kind: 'terlalu-sering',
      title: 'Terlalu banyak permintaan',
      message: 'Tunggu sebentar, lalu coba lagi.',
      requestId,
      retry: true
    }
  }
  if (kind === 'timeout') {
    return {
      kind: 'timeout',
      title: 'Data tidak dapat dimuat',
      message: 'Server belum merespons. Periksa koneksi Anda, lalu coba lagi.',
      requestId,
      retry: true
    }
  }
  if (kind === 'http' && err.status >= 500) {
    return {
      kind: 'server',
      title: 'Server sedang bermasalah',
      message:
        'Gangguan ada di sisi server, bukan di perangkat Anda. Coba lagi beberapa saat lagi.',
      requestId,
      retry: true
    }
  }
  if (kind === 'parse' || kind === 'schema' || kind === 'too-large') {
    return {
      kind: 'data',
      title: 'Data tidak dapat dibaca',
      message:
        'Respons server tidak sesuai yang diharapkan. Coba lagi, atau hubungi pengelola bila terus terjadi.',
      requestId,
      retry: true
    }
  }
  return {
    kind: 'network',
    title: 'Data tidak dapat dimuat',
    message: 'Periksa koneksi Anda, lalu coba lagi.',
    requestId,
    retry: true
  }
}

// Pembatalan oleh pemanggil bukan galat bagi pengguna.
export const isAbort = err => err?.kind === 'aborted'
