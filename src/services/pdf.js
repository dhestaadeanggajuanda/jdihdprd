// Pratinjau PDF. pdf.js dibundel (versi dipin di package.json) dan dimuat malas:
// tidak ada kode PDF di bundel awal. Berkas diambil dengan fetch ke URL lampiran
// yang sama dengan tombol Unduh (Content-Disposition tidak memengaruhi fetch),
// jadi API dan CSP tidak berubah. Kontrol:
//  - batas ukuran (cek metadata, header Content-Length, dan jumlah byte yang diterima);
//  - pengalihan ke host lain tidak diikuti (diperlakukan sebagai "berkas di situs lain");
//  - tanpa kredensial dan referrer; tanpa WebAssembly (CSP tanpa 'wasm-unsafe-eval');
//  - tanpa JavaScript dalam PDF (pdf.js inti tidak menjalankannya) dan tanpa XFA;
//  - worker berupa berkas statis satu origin.

import { HttpError, getBytes } from './http.js'

// Nilai awal; dapat disesuaikan setelah melihat berkas nyata.
export const PDF_MAX_BYTES = 25 * 1024 * 1024

/**
 * kind:
 *  - too-large  melebihi PDF_MAX_BYTES
 *  - external   dialihkan ke host lain
 *  - http       status bukan 2xx
 *  - network    gagal tersambung atau CORS
 *  - invalid    bukan PDF yang dapat dibaca
 *  - aborted    dibatalkan pemanggil
 */
export class PdfError extends Error {
  constructor(kind, { status = 0, size = 0, cause } = {}) {
    super(kind, { cause })
    this.name = 'PdfError'
    this.kind = kind
    this.status = status
    this.size = size
  }
}

/**
 * Mengunduh berkas ke memori dengan batas ukuran (lewat services/http.js, satu-satunya tempat
 * fetch). Galat HTTP dipetakan ke PdfError agar pemanggil hanya mengenal satu jenis galat.
 * @param {string} url
 * @param {{ signal?: AbortSignal, maxBytes?: number, onProgress?: (p: number) => void, allowedOrigins?: string[] }} [options]
 */
export async function ambilPdf(
  url,
  { signal, maxBytes = PDF_MAX_BYTES, onProgress, allowedOrigins } = {}
) {
  try {
    return await getBytes(url, {
      signal,
      maxBytes,
      onProgress,
      allowedOrigins,
      accept: 'application/pdf'
    })
  } catch (err) {
    if (err instanceof HttpError) {
      // Alamat di luar daftar izin sama saja dengan berkas milik situs lain.
      if (err.kind === 'blocked') throw new PdfError('external')
      throw new PdfError(err.kind, { status: err.status, size: err.size })
    }
    throw new PdfError('network', { cause: err })
  }
}

let pdfjsPromise = null

/** Memuat pdf.js sekali, saat pertama dibutuhkan. */
export function muatPdfjs() {
  pdfjsPromise ??= (async () => {
    // Build "legacy": mencakup peramban dan WebView Android yang lebih lama.
    const lib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    lib.GlobalWorkerOptions.workerSrc = `${pdfjsDir()}pdf.worker.min.js`
    return lib
  })().catch(err => {
    pdfjsPromise = null
    throw err
  })
  return pdfjsPromise
}

// Folder berkas pdf.js (worker dan dekoder versi JavaScript): aset statis satu origin
// dengan aplikasi, dikeluarkan oleh dev/pdfjs-assets-plugin.js.
function pdfjsDir() {
  const base = import.meta.env.BASE_URL ?? '/'
  const dir = import.meta.env.JDIH_PDFJS_DIR
  return new URL(`${base}${dir}`, globalThis.location.href).href
}

/**
 * Membuka dokumen dari byte yang sudah diunduh.
 * @returns {Promise<import('pdfjs-dist').PDFDocumentProxy>}
 */
export async function bukaPdf(bytes) {
  const lib = await muatPdfjs()
  const task = lib.getDocument({
    data: bytes,
    enableXfa: false,
    useWasm: false,
    wasmUrl: pdfjsDir(),
    // Tanpa unduhan font tambahan: huruf yang tidak tertanam memakai font sistem.
    useSystemFonts: true,
    // Gambar sangat besar tidak digambar (cegah kehabisan memori).
    maxImageSize: 64 * 1024 * 1024,
    verbosity: 0
  })
  try {
    return await task.promise
  } catch (err) {
    task.destroy?.()
    // Berkas rusak, bukan PDF, atau berkata sandi: semuanya "tidak dapat dibaca".
    throw new PdfError('invalid', { cause: err })
  }
}
