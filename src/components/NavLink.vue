<template>
  <router-link v-slot="{ href, navigate }" :to="to" custom>
    <a
      v-bind="$attrs"
      :href="href"
      :aria-current="current ? 'page' : undefined"
      @click="navigate"
    >
      <slot />
    </a>
  </router-link>
</template>

<script>
// Tautan rute dengan penanda halaman aktif yang dikendalikan pemanggil
// (mis. "Dokumen" tetap aktif pada halaman detail dokumen).
export default { inheritAttrs: false }
</script>

<script setup>
defineProps({
  to: { type: [String, Object], required: true },
  current: { type: Boolean, default: false }
})
</script>
