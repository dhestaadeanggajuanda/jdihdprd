<template>
  <div>
    <div class="colchart" role="img" :aria-label="summary">
      <div class="plot">
        <div
          v-for="g in grid"
          :key="g.value"
          class="gl"
          :style="{ bottom: `${g.at}%` }"
        >
          <b>{{ g.value }}</b>
        </div>
        <div class="bars">
          <div v-for="c in cols" :key="c.tahun" class="c">
            <i :style="{ height: `${c.height}%` }" />
            <em
              v-if="c.label"
              :style="{ bottom: `calc(${c.height}% + 4px)` }"
              >{{ c.jumlah }}</em
            >
          </div>
        </div>
      </div>
      <div class="xaxis">
        <span v-for="c in cols" :key="c.tahun">{{
          String(c.tahun).slice(-2)
        }}</span>
      </div>
    </div>
    <p class="sub chart-foot">{{ footnote }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Kolom per tahun. Skala dibulatkan ke kelipatan "rapi" dengan tiga garis bantu.
// Hanya tahun tertinggi dan tahun berjalan yang diberi angka; sisanya ada di tabel.
const props = defineProps({
  items: { type: Array, required: true }
})

const max = computed(() => Math.max(1, ...props.items.map(i => i.jumlah)))
const step = computed(() => {
  const rough = max.value / 3
  const pow = 10 ** Math.floor(Math.log10(rough))
  const unit = [1, 2, 5, 10].map(n => n * pow).find(n => n >= rough)
  return unit ?? pow * 10
})
const scale = computed(() => step.value * 3)

const grid = computed(() =>
  [0, 1, 2, 3].map(i => ({
    value: i * step.value,
    at: (i * step.value * 100) / scale.value
  }))
)

const topYear = computed(() =>
  props.items.reduce((a, b) => (b.jumlah > a.jumlah ? b : a), props.items[0])
)
const berjalan = computed(() => props.items.find(i => i.berjalan) ?? null)

const cols = computed(() =>
  props.items.map(i => ({
    ...i,
    height: (i.jumlah / scale.value) * 100,
    label: i.tahun === topYear.value?.tahun || i.berjalan
  }))
)

const abad = computed(() => String(props.items[0]?.tahun ?? 2000).slice(0, 2))

// Penjelasan sumbu bawah (dua angka terakhir tahun) dan tahun yang masih berjalan.
const footnote = computed(() => {
  const sumbu = `Tahun (${abad.value}xx).`
  return berjalan.value
    ? `${sumbu} ${berjalan.value.tahun} masih berjalan.`
    : sumbu
})

const summary = computed(() => {
  const first = props.items[0]
  const last = props.items[props.items.length - 1]
  if (!first || !last) return ''
  const sementara = berjalan.value
    ? `, tahun ${berjalan.value.tahun} sementara ${berjalan.value.jumlah} dokumen`
    : ''
  return `Dokumen per tahun penetapan ${first.tahun} sampai ${last.tahun}. Tertinggi tahun ${topYear.value.tahun} dengan ${topYear.value.jumlah} dokumen${sementara}.`
})
</script>
