<template>
  <nav v-if="totalPages > 1" class="pager" aria-label="Halaman hasil">
    <NavLink
      v-if="page > 1"
      :to="toPage(page - 1)"
      aria-label="Halaman sebelumnya"
    >
      <AppIcon name="chevron-right" flip />
    </NavLink>
    <template v-for="(item, i) in items" :key="`${item}-${i}`">
      <span v-if="item === '…'" class="gap" aria-hidden="true">…</span>
      <NavLink
        v-else
        :to="toPage(item)"
        :current="item === page"
        :aria-label="`Halaman ${item}`"
      >
        {{ item }}
      </NavLink>
    </template>
    <NavLink
      v-if="page < totalPages"
      :to="toPage(page + 1)"
      aria-label="Halaman berikutnya"
    >
      <AppIcon name="chevron-right" />
    </NavLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  // (halaman) => lokasi rute
  toPage: { type: Function, required: true }
})

// 1 … 4 5 6 … 20: awal, akhir, dan tetangga halaman aktif.
const items = computed(() => {
  const { page, totalPages } = props
  const set = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...set]
    .filter(n => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)
  const out = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})
</script>
