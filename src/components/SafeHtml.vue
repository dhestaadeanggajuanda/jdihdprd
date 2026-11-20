<template>
  <!-- Satu-satunya tempat v-html: isi SELALU dibersihkan dulu (utils/sanitize.js). -->
  <div class="safe-html" v-html="clean" />
</template>

<script setup>
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/sanitize.js'

const props = defineProps({
  html: { type: String, default: '' }
})

const clean = computed(() => sanitizeHtml(props.html))
</script>
