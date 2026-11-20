<template>
  <div>
    <div class="sk" aria-hidden="true">
      <div v-for="n in count" :key="n" class="card">
        <div
          class="shimmer"
          :style="{ height: '22px', width: `${40 + ((n * 7) % 12)}%` }"
        />
        <div
          class="shimmer"
          :style="{ height: '18px', width: `${86 + ((n * 5) % 8)}%` }"
        />
        <div
          class="shimmer"
          :style="{ height: '18px', width: `${58 + ((n * 9) % 14)}%` }"
        />
        <div class="shimmer" :style="{ height: '16px', width: '52%' }" />
      </div>
    </div>
    <p class="sr" role="status">{{ label }}</p>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 3 },
  label: { type: String, default: 'Memuat' }
})
</script>
