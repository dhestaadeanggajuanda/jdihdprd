<template>
  <div class="sec-h">
    <h2 :id="id">{{ title }}</h2>
    <NavLink v-if="to" :to="to">{{ linkLabel }}</NavLink>
  </div>
</template>

<script setup>
import NavLink from './NavLink.vue'

defineProps({
  id: { type: String, default: undefined },
  title: { type: String, required: true },
  to: { type: [String, Object], default: null },
  linkLabel: { type: String, default: 'Lihat semua' }
})
</script>
