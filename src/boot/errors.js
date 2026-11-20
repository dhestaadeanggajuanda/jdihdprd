// Penanganan galat global: pengguna tidak pernah melihat jejak tumpukan, dan
// log tidak memuat data pribadi. Tidak ada analitik atau pelaporan pihak ketiga.
import { defineBoot } from '#q-app'
import { initAppearance } from '@/composables/useAppearance.js'

export default defineBoot(({ app }) => {
  initAppearance()

  app.config.errorHandler = (err, _instance, info) => {
    if (import.meta.env.DEV) console.error('[galat komponen]', info, err)
    else console.error('[galat komponen]', info, err?.name ?? 'Error')
  }

  window.addEventListener('unhandledrejection', event => {
    if (import.meta.env.DEV) console.error('[janji ditolak]', event.reason)
    else console.error('[janji ditolak]', event.reason?.name ?? 'Error')
  })
})
