import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    // Pulihkan posisi saat kembali, lompat ke jangkar bila ada, selain itu ke atas.
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' }
      // Perubahan kueri pada halaman yang sama (filter, halaman) ke atas daftar.
      return { left: 0, top: 0 }
    },
    routes,

    // Mode riwayat diatur di quasar.config.js -> build -> vueRouterMode.
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  return Router
})
