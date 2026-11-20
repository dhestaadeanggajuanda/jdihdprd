<template>
  <details class="tv" :open="open">
    <summary>Lihat sebagai tabel</summary>
    <table>
      <thead>
        <tr>
          <th v-for="c in columns" :key="c" scope="col">{{ c }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td v-for="(cell, j) in row" :key="j" class="num">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </details>
</template>

<script setup>
// Padanan tabel untuk setiap grafik: angka tepat dan terbaca pembaca layar.
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  open: { type: Boolean, default: false }
})
</script>
