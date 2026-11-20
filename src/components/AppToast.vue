<template>
  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true">
    <p v-if="state.message" :key="state.key" class="toast">
      {{ state.message }}
    </p>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast.js'

const { state } = useToast()
</script>
