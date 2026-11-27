<template>
  <nav class="sidenav" aria-label="Halaman Profil">
    <template v-for="(p, i) in daftar" :key="p.slug">
      <span v-if="p.grup && daftar[i - 1]?.grup !== p.grup" class="grp">{{
        p.grup
      }}</span>
      <NavLink
        :to="`/profil/${p.slug}`"
        :current="!kebijakan && p.slug === aktif"
        :class="{ sub: p.grup }"
        >{{ p.judul }}</NavLink
      >
    </template>
    <span class="grp">Kebijakan</span>
    <NavLink
      class="sub"
      to="/kebijakan-privasi"
      :current="kebijakan === 'privasi'"
      >Privasi</NavLink
    >
    <NavLink
      class="sub"
      to="/kebijakan-cookie"
      :current="kebijakan === 'cookie'"
      >Cookie</NavLink
    >
  </nav>
</template>

<script setup>
import NavLink from './NavLink.vue'

// Menu samping halaman Profil (>= 1024 px). Halaman instansi datang dari API;
// grup Kebijakan ditulis di sini karena bukan data backend.
defineProps({
  daftar: { type: Array, default: () => [] },
  aktif: { type: String, default: '' },
  // 'privasi' | 'cookie' | '' (bukan halaman kebijakan)
  kebijakan: { type: String, default: '' }
})
</script>
