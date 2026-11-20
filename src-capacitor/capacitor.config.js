const { defineCapacitorConfig } = require('@quasar/app-vite/capacitor')

// Konfigurasi aplikasi Android (Capacitor 8). Keamanan (OWASP MASVS):
//  - HTTPS saja: skema https, tanpa lalu lintas cleartext, tanpa konten campuran.
//  - Hanya origin aplikasi yang dimuat di WebView; tautan luar dibuka di peramban sistem.
//  - Pengawakutuan WebView dan log dimatikan pada build rilis.
// appId bersifat permanen setelah rilis Play Store: KONFIRMASI sebelum rilis.
const isDev = process.env.QUASAR_DEV === 'true'

module.exports = defineCapacitorConfig({
  appId: 'id.go.singkawangkota.dprd.jdih',
  appName: 'JDIH DPRD Singkawang',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: []
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: isDev,
    captureInput: false
  },
  loggingBehavior: isDev ? 'debug' : 'none'
})
