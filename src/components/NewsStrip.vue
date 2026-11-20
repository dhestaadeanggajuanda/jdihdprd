<template>
  <NavLink v-if="loading || post" class="newsstrip" to="/berita">
    <div class="newsstrip-in">
      <span class="ico"><AppIcon name="newspaper" /></span>
      <p v-if="post">
        <small>Berita terbaru · {{ formatDate(post.date) }}</small>
        <span class="clamp">{{ post.title }}</span>
      </p>
      <p v-else aria-hidden="true">
        <span class="shimmer strip-sk strip-sk-a" />
        <span class="shimmer strip-sk strip-sk-b" />
      </p>
      <AppIcon name="chevron-right" />
    </div>
  </NavLink>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import { formatDate } from '@/utils/format.js'

// Satu baris berita terbaru yang mengintip. Hilang bila berita gagal dimuat
// (galatnya ditampilkan di bagian "Berita terkait").
defineProps({
  post: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})
</script>
