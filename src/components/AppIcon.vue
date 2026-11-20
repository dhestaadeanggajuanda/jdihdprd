<template>
  <svg
    :class="['i', size ? `i-${size}` : '', flip ? 'flip' : '']"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <component
      :is="tag"
      v-for="([tag, attrs], index) in shapes"
      :key="index"
      v-bind="attrs"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { ICONS } from './icons.js'

const props = defineProps({
  name: { type: String, required: true },
  // '' (24px), 'sm' (18px), 'xs' (16px)
  size: { type: String, default: '' },
  flip: { type: Boolean, default: false }
})

const shapes = computed(() => ICONS[props.name] ?? [])
</script>
