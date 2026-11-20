<template>
  <nav class="appnav" aria-label="Navigasi utama">
    <NavLink
      v-for="item in APP_NAV"
      :key="item.key"
      :to="item.to"
      :current="current === item.key"
    >
      <span class="pill"><AppIcon :name="item.icon" /></span>
      {{ item.label }}
    </NavLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import { APP_NAV } from './nav.js'

const route = useRoute()
const current = computed(() => route.meta.app ?? route.meta.nav ?? '')
</script>
