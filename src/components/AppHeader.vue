<template>
  <header :class="['topbar', `is-${bar}`]">
    <div class="topbar-in">
      <a
        class="icon-btn back"
        :href="backHref"
        aria-label="Kembali"
        @click.prevent="goBack"
      >
        <AppIcon name="arrow-left" />
      </a>

      <NavLink
        class="brand"
        to="/"
        aria-label="JDIH DPRD Kota Singkawang, ke beranda"
      >
        <img
          :src="logo"
          width="200"
          height="50"
          alt="JDIH DPRD Kota Singkawang"
        />
      </NavLink>

      <span class="bar-title">{{ barTitle }}</span>

      <nav class="mainnav" aria-label="Navigasi utama">
        <NavLink
          v-for="item in MAIN_NAV"
          :key="item.key"
          :to="item.to"
          :current="current === item.key"
        >
          {{ item.label }}
        </NavLink>
      </nav>

      <div class="bar-actions">
        <NavLink class="hdr-search" to="/dokumen">
          <AppIcon name="search" size="sm" />
          <span>Cari dokumen</span>
        </NavLink>
        <NavLink
          v-if="showBell"
          class="icon-btn android-only"
          :to="{ path: '/info', hash: '#notifikasi' }"
          aria-label="Notifikasi"
        >
          <AppIcon name="bell" />
        </NavLink>
        <button
          class="icon-btn theme-toggle"
          type="button"
          aria-label="Ganti tema terang atau gelap"
          @click="toggleTheme"
        >
          <span class="ic-moon"><AppIcon name="moon" /></span>
          <span class="ic-sun"><AppIcon name="sun" /></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Platform } from 'quasar'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import logo from '@/assets/logo-jdih.png'
import { MAIN_NAV } from './nav.js'
import { useAppearance } from '@/composables/useAppearance.js'
import { barTitleOverride } from '@/composables/useBarTitle.js'

const route = useRoute()
const router = useRouter()
const { toggleTheme } = useAppearance()

const bar = computed(() => route.meta.bar ?? 'main')
const barTitle = computed(
  () =>
    barTitleOverride.value || (route.meta.barTitle ?? route.meta.title ?? '')
)
const current = computed(() => route.meta.nav ?? '')
const backHref = computed(() => router.resolve(route.meta.back ?? '/').href)

// Notifikasi peraturan baru hanya tersedia di aplikasi Android.
const showBell = Platform.is.capacitor && Platform.is.android

function goBack() {
  // Kembali ke halaman sebelumnya bila ada riwayat di dalam aplikasi,
  // jika tidak ke induk logis halaman ini.
  if (window.history.state?.back) router.back()
  else router.push(route.meta.back ?? '/')
}
</script>
