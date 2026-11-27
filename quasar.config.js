// Konfigurasi aplikasi JDIH DPRD Kota Singkawang (Quasar 3 + Vite).
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'
import { readFileSync } from 'node:fs'
import { API_ORIGIN, MEDIACENTER_ORIGIN } from './src/config/hosts.js'
import { mockApiPlugin } from './dev/mock-api/plugin.js'
import { PDFJS_DIR, pdfjsAssetsPlugin } from './dev/pdfjs-assets-plugin.js'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
)

// Server pengembangan dapat memakai API nyata lewat proxy (bukan variabel klien: tanpa awalan JDIH_).
const devApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(
  process.env.DEV_API ?? ''
)
  ? process.env.DEV_API
  : ''

export default defineConfig(ctx => {
  // Content-Security-Policy lewat <meta> (header penuh ada di deploy/security-headers.conf).
  // Hanya dua origin yang boleh dihubungi: API JDIH dan Media Center.
  const connect = ["'self'", API_ORIGIN, MEDIACENTER_ORIGIN]
  if (ctx.dev) connect.push('ws://localhost:*', 'http://localhost:*')
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${API_ORIGIN} ${MEDIACENTER_ORIGIN}`,
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(ctx.dev ? ["worker-src 'self' blob:"] : [])
  ].join('; ')

  return {
    boot: ['errors'],

    css: ['app.scss'],

    // Tanpa font atau ikon dari paket: font Public Sans di-host sendiri dan
    // ikon berupa SVG inline. Tidak ada permintaan pihak ketiga.
    extras: [],

    build: {
      // Web memakai riwayat bersih (server harus mengalihkan ke index.html).
      // Capacitor (Android) memakai hash karena tidak ada server rute.
      vueRouterMode: ctx.mode.capacitor ? 'hash' : 'history',

      // Hanya variabel berawalan JDIH_ yang sampai ke klien.
      env: { clientPrefix: 'JDIH_' },
      defineEnv: { JDIH_APP_VERSION: pkg.version, JDIH_PDFJS_DIR: PDFJS_DIR },

      // Peta sumber tidak dipublikasikan.
      sourcemap: false,

      extendViteConf(viteConf) {
        // API palsu, kecuali pengembang menunjuk API nyata: DEV_API=http://localhost:3000 npm run dev
        if (ctx.dev && !devApi) viteConf.plugins.push(mockApiPlugin())
        // Dekoder JBIG2/JPEG 2000 versi JavaScript untuk pratinjau PDF (satu origin).
        viteConf.plugins.push(pdfjsAssetsPlugin())
      }
    },

    htmlVariables: { csp },

    devServer: {
      open: false,
      port: 9000,
      ...(devApi
        ? { proxy: { '/api': { target: devApi, changeOrigin: true } } }
        : {})
    },

    framework: {
      config: { dark: 'auto' },
      lang: 'id',
      plugins: ['Meta']
    },

    animations: [],

    capacitor: {
      hideSplashscreen: true
    }
  }
})
