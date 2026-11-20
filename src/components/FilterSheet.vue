<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="sheet" role="group" aria-labelledby="sheet-judul">
      <div class="grab" aria-hidden="true" />
      <header>
        <h2 id="sheet-judul">Saring</h2>
        <button
          class="icon-btn"
          type="button"
          aria-label="Tutup saringan"
          @click="$emit('update:modelValue', false)"
        >
          <AppIcon name="x" />
        </button>
      </header>
      <div class="body">
        <FilterForm :draft="draft" :jenis-options="jenisOptions" uid="sheet" />
      </div>
      <footer>
        <button class="btn btn-outline" type="button" @click="$emit('reset')"
          >Atur ulang</button
        >
        <button class="btn btn-primary" type="button" @click="$emit('apply')">
          {{
            total === null
              ? 'Tampilkan hasil'
              : `Tampilkan ${formatNumber(total)} hasil`
          }}
        </button>
      </footer>
    </div>
  </q-dialog>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import FilterForm from './FilterForm.vue'
import { formatNumber } from '@/utils/format.js'

// Lembar bawah (Material 3) untuk ponsel. QDialog menangani jebakan fokus,
// tombol Esc, latar redup, dan tombol Kembali pada Android.
defineProps({
  modelValue: { type: Boolean, required: true },
  draft: { type: Object, required: true },
  jenisOptions: { type: Array, default: () => [] },
  // Perkiraan jumlah hasil untuk draf saat ini (null = belum diketahui).
  total: { type: Number, default: null }
})
defineEmits(['update:modelValue', 'apply', 'reset'])
</script>
