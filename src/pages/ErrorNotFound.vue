<template>
  <div class="wrap narrow">
    <StateView
      icon="file"
      heading="h1"
      title="Halaman tidak ditemukan"
      message="Tautan ini mungkin sudah berubah atau dokumennya sudah dipindahkan."
    >
      <NavLink class="btn btn-primary" to="/">Ke beranda</NavLink>
      <NavLink class="btn btn-text" to="/dokumen">Cari dokumen</NavLink>
    </StateView>
  </div>
</template>

<script setup>
import NavLink from '@/components/NavLink.vue'
import StateView from '@/components/StateView.vue'
</script>
