<template>
  <div v-if="!online" class="banner off" role="status">
    <AppIcon name="wifi-off" />
    <p class="grow">Tidak ada koneksi internet.</p>
    <button class="btn btn-text" type="button" @click="check">Coba lagi</button>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { useOnline } from '@/composables/useOnline.js'
import { clearResourceCache } from '@/composables/useResource.js'

const { online } = useOnline()

function check() {
  // Muat ulang halaman aktif: data dimuat dari server saat dibuka.
  clearResourceCache()
  window.location.reload()
}
</script>
