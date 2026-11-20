<template>
  <span v-for="b in badges" :key="b.key" :class="['status', b.tone]">
    <AppIcon :name="b.icon" size="xs" />{{ b.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { statusBadges } from '@/utils/dokumen.js'

// Status selalu ikon + teks, tidak pernah hanya warna.
const props = defineProps({
  dokumen: { type: Object, required: true }
})

const badges = computed(() => statusBadges(props.dokumen))
</script>
