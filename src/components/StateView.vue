<template>
  <div class="empty">
    <span :class="['ring', tone]"><AppIcon :name="icon" /></span>
    <component :is="heading">{{ title }}</component>
    <p v-if="message">{{ message }}</p>
    <slot />
    <small v-if="requestId" class="muted num request-id">
      ID permintaan {{ requestId }}
    </small>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

// Setiap keadaan menyebut masalahnya dan jalan keluarnya.
defineProps({
  icon: { type: String, default: 'search' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  tone: { type: String, default: '' },
  requestId: { type: String, default: null },
  // Tingkat judul: h1 bila keadaan ini adalah seluruh halaman (mis. 404).
  heading: { type: String, default: 'h3' }
})
</script>
