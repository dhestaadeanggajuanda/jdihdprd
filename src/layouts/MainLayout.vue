<template>
  <a class="skip" href="#main" @click.prevent="focusMain">
    Lewati ke konten utama
  </a>
  <AppHeader />
  <SampleNotice />
  <OfflineBanner />
  <main id="main" ref="mainEl" tabindex="-1">
    <router-view />
  </main>
  <AppFooter />
  <AppNav />
  <AppToast />
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import AppHeader from '@/components/AppHeader.vue'
import AppNav from '@/components/AppNav.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppToast from '@/components/AppToast.vue'
import OfflineBanner from '@/components/OfflineBanner.vue'
import SampleNotice from '@/components/SampleNotice.vue'

const SITE = 'JDIH DPRD Kota Singkawang'
const route = useRoute()
const router = useRouter()
const mainEl = ref(null)

// Judul dokumen mengikuti rute. Halaman dinamis (mis. detail) menimpanya.
useMeta(() => ({
  title: route.meta.title ?? route.meta.barTitle ?? SITE,
  titleTemplate: title => (title === SITE ? SITE : `${title} · ${SITE}`)
}))

function focusElement(target) {
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

// Tautan "lewati": fokus ke judul halaman (atau ke <main> bila belum ada).
function focusMain() {
  const target = mainEl.value?.querySelector('h1') ?? mainEl.value
  if (target) focusElement(target)
}

// Setelah pindah rute, fokus berpindah ke <h1> halaman baru agar pembaca layar
// dan papan ketik ikut berpindah (WCAG 2.4.3). Halaman dimuat malas dan sebagian
// judulnya baru muncul setelah data tiba, jadi kita menunggu <h1> muncul.
let observer = null
let giveUp = null
// <h1> milik halaman yang sedang ditinggalkan, dicatat sebelum rute berganti
// (setelah itu halaman baru bisa saja sudah dirender).
let previous = null
router.beforeEach(() => {
  previous = mainEl.value?.querySelector('h1') ?? null
})

function focusHeadingWhenReady() {
  observer?.disconnect()
  clearTimeout(giveUp)
  const host = mainEl.value
  if (!host) return
  const done = () => {
    const h1 = host.querySelector('h1')
    if (!h1 || h1 === previous) return false
    focusElement(h1)
    return true
  }
  if (done()) return
  observer = new MutationObserver(() => {
    if (done()) {
      observer.disconnect()
      clearTimeout(giveUp)
    }
  })
  observer.observe(host, { childList: true, subtree: true })
  // Halaman yang dipakai ulang (mis. detail dokumen lain) memakai <h1> yang sama:
  // setelah jeda singkat, fokus ke <h1> yang ada.
  giveUp = setTimeout(() => {
    observer?.disconnect()
    focusMain()
  }, 2500)
}

// Layout baru terpasang setelah navigasi awal selesai, jadi hook ini hanya
// melihat navigasi yang dilakukan pengguna.
router.afterEach((to, from) => {
  // Perubahan kueri pada halaman yang sama (filter, halaman) tidak memindahkan fokus.
  if (to.path === from.path) return
  nextTick(focusHeadingWhenReady)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(giveUp)
})
</script>
