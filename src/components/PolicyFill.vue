<template>
  <span v-if="value">{{ value }}</span>
  <span v-else class="fill"
    >[diisi instansi<template v-if="hint">: {{ hint }}</template>]</span
  >
</template>

<script setup>
// Isian naskah kebijakan yang berasal dari instansi (lihat KEBIJAKAN di
// config/env.js). Kosong = penanda yang terlihat, bukan nilai karangan.
defineProps({
  value: { type: String, default: '' },
  hint: { type: String, default: '' }
})
</script>
