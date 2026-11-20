<template>
  <div v-if="sampleData" class="samplenote" role="note">
    Data contoh, bukan produk hukum DPRD resmi
  </div>
</template>

<script setup>
import { sampleData } from '@/services/sample.js'
</script>
