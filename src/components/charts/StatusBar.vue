<template>
  <div>
    <div class="segbar" role="img" :aria-label="summary">
      <span
        v-for="s in segments"
        :key="s.key"
        :class="s.cls"
        :style="{ flex: s.value }"
      >
        <template v-if="s.showLabel">{{ s.percent }}%</template>
      </span>
    </div>
    <div class="legend">
      <span v-for="s in segments" :key="s.key">
        <AppIcon :class="s.legend" :name="s.icon" size="sm" />{{ s.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

// Satu keseluruhan terbagi tiga status. Warna selalu berpasangan dengan ikon
// dan teks pada legenda, dan angka pada padanan tabel.
const props = defineProps({
  berlaku: { type: Number, required: true },
  berlakuDiubah: { type: Number, required: true },
  dicabut: { type: Number, required: true }
})

const total = computed(() =>
  Math.max(1, props.berlaku + props.berlakuDiubah + props.dicabut)
)
const pct = n => Math.round((n / total.value) * 100)

const segments = computed(() => {
  const all = [
    {
      key: 'ok',
      value: props.berlaku,
      label: 'Berlaku',
      icon: 'check-circle',
      cls: 's-ok',
      legend: 'k-ok'
    },
    {
      key: 'warn',
      value: props.berlakuDiubah,
      label: 'Berlaku, pernah diubah',
      icon: 'edit',
      cls: 's-warn',
      legend: 'k-warn'
    },
    {
      key: 'bad',
      value: props.dicabut,
      label: 'Dicabut',
      icon: 'x-circle',
      cls: 's-bad',
      legend: 'k-bad'
    }
  ]
  return all
    .filter(s => s.value > 0)
    .map(s => ({ ...s, percent: pct(s.value), showLabel: pct(s.value) >= 20 }))
})

const summary = computed(
  () =>
    `${props.berlaku} berlaku (${pct(props.berlaku)}%), ${props.berlakuDiubah} berlaku dan pernah diubah (${pct(props.berlakuDiubah)}%), ${props.dicabut} dicabut (${pct(props.dicabut)}%)`
)
</script>
