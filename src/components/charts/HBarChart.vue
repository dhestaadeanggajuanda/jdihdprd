<template>
  <ul class="hb">
    <li v-for="row in rows" :key="row.nama">
      <span class="nm">{{ row.nama }}</span>
      <div class="brow">
        <span class="fill" :style="{ width: `${row.width}%` }" />
        <span class="val">{{ formatNumber(row.jumlah) }}</span>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format.js'

// Batang horizontal berurutan, satu warna seri. Batang terpanjang 82% agar
// ada ruang untuk angkanya. Setiap grafik punya padanan tabel di induknya.
const props = defineProps({
  items: { type: Array, required: true }
})

const rows = computed(() => {
  const max = Math.max(1, ...props.items.map(i => i.jumlah))
  return props.items.map(i => ({
    ...i,
    width: Math.max(1.5, (i.jumlah / max) * 82)
  }))
})
</script>
