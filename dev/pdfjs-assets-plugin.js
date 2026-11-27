// Menyajikan tiga berkas pdf.js sebagai aset statis satu origin, di bawah /assets/
// (location nginx yang sudah membawa header keamanan SPA, tipe MIME .js, dan cache):
//   - pdf.worker.min.js: worker (isinya sama dengan pdf.worker.min.mjs; berekstensi
//     .js karena sebagian nginx belum memetakan .mjs ke tipe JavaScript, dan peramban
//     menolak skrip modul dengan tipe MIME salah);
//   - jbig2_nowasm_fallback.js dan openjpeg_nowasm_fallback.js: dekoder JBIG2 dan
//     JPEG 2000 versi JavaScript, dimuat lewat import() oleh worker. Aplikasi tidak
//     memakai WebAssembly agar CSP tidak perlu 'wasm-unsafe-eval' (useWasm: false).
// Semuanya diambil dari paket pdfjs-dist yang dipin di package.json dan ditaruh di
// folder berversi, jadi versi pustaka dan berkas pendukungnya tidak bisa berbeda.
//   - build: dikeluarkan ke assets/pdfjs/<versi>/;
//   - dev: dilayani middleware di jalur yang sama.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const root = dirname(require.resolve('pdfjs-dist/package.json'))

export const PDFJS_VERSION = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8')
).version

// Jalur relatif terhadap akar situs (dengan garis miring penutup).
export const PDFJS_DIR = `assets/pdfjs/${PDFJS_VERSION}/`

// nama di situs -> berkas di paket
const FILES = {
  'pdf.worker.min.js': join(root, 'legacy/build/pdf.worker.min.mjs'),
  'jbig2_nowasm_fallback.js': join(root, 'wasm/jbig2_nowasm_fallback.js'),
  'openjpeg_nowasm_fallback.js': join(root, 'wasm/openjpeg_nowasm_fallback.js')
}

export function pdfjsAssetsPlugin() {
  return {
    name: 'jdih-pdfjs-assets',
    configureServer(server) {
      server.middlewares.use(`/${PDFJS_DIR}`, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0]).replace(
          /^\//,
          ''
        )
        if (!Object.hasOwn(FILES, name)) return next()
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(readFileSync(FILES[name]))
      })
    },
    generateBundle() {
      for (const [name, file] of Object.entries(FILES)) {
        this.emitFile({
          type: 'asset',
          fileName: `${PDFJS_DIR}${name}`,
          source: readFileSync(file)
        })
      }
    }
  }
}
