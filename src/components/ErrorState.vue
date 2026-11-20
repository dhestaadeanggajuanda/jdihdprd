<template>
  <StateView
    :icon="icon"
    tone="err"
    :title="error.title"
    :message="error.message"
    :request-id="error.requestId"
    role="alert"
  >
    <button
      v-if="error.retry"
      class="btn btn-primary"
      type="button"
      @click="$emit('retry')"
    >
      <AppIcon name="refresh" />Coba lagi
    </button>
    <slot />
  </StateView>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import StateView from './StateView.vue'

// `error` berasal dari describeError() (utils/errors.js).
const props = defineProps({
  error: { type: Object, required: true }
})
defineEmits(['retry'])

const icon = computed(() =>
  props.error.kind === 'offline'
    ? 'wifi-off'
    : props.error.kind === 'tidak-ada'
      ? 'file'
      : 'alert'
)
</script>
