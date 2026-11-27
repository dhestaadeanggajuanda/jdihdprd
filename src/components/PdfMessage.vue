<template>
  <div v-if="status === 'memuat'" class="pv-skel" aria-busy="true">
    <div class="pv-page pv-load" aria-hidden="true">
      <div class="pp">
        <i class="ln" style="width: 60%" /><i class="ln" style="width: 90%" /><i
          class="ln"
          style="width: 84%"
        /><i class="ln" style="width: 92%" /><i class="ln" style="width: 70%" />
      </div>
    </div>
    <p class="pv-status" role="status"> Memuat pratinjau… </p>
  </div>

  <div v-else-if="status === 'galat'" class="pv-msg bad" role="alert">
    <AppIcon name="x-circle" />
    <div>
      <p><b>Pratinjau tidak dapat dimuat.</b></p>
      <p
        >Periksa koneksi, lalu coba lagi. Anda tetap bisa mengunduh
        berkasnya.</p
      >
      <div class="acts">
        <button class="btn btn-tonal" type="button" @click="$emit('ulang')">
          <AppIcon name="refresh" />Coba lagi
        </button>
        <a
          class="btn btn-primary"
          :href="unduhHref"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="download" />{{ labelUnduh }}
        </a>
      </div>
    </div>
  </div>

  <div v-else-if="status === 'besar'" class="pv-msg" role="status">
    <AppIcon name="file" />
    <div>
      <p><b>Berkas ini {{ ukuranTeks }}, terlalu besar untuk pratinjau.</b></p>
      <p>Unduh untuk membacanya di perangkat Anda.</p>
      <div class="acts">
        <a
          class="btn btn-primary"
          :href="unduhHref"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="download" />{{ labelUnduh }}
        </a>
      </div>
    </div>
  </div>

  <div v-else-if="status === 'luar'" class="pv-msg" role="status">
    <AppIcon name="external-link" />
    <div>
      <p
        ><b
          >Berkas ini disimpan di situs lain, jadi tidak dapat dipratinjau di
          sini.</b
        ></p
      >
      <p>Buka berkasnya di situs asal.</p>
      <div class="acts">
        <a
          class="btn btn-primary"
          :href="unduhHref"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka di situs asal<span class="sr"> (dibuka di tab baru)</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { formatBytes } from '@/utils/format.js'

// Keadaan pratinjau selain "siap": memuat, gagal, terlalu besar, dan berkas di situs lain.
const props = defineProps({
  // 'memuat' | 'galat' | 'besar' | 'luar'
  status: { type: String, required: true },
  unduhHref: { type: String, default: '#' },
  // ukuran berkas dalam byte (untuk "terlalu besar" dan label Unduh)
  ukuran: { type: Number, default: 0 }
})
defineEmits(['ulang'])

const ukuranTeks = computed(() => formatBytes(props.ukuran))
const labelUnduh = computed(() =>
  props.ukuran > 0 ? `Unduh PDF · ${formatBytes(props.ukuran)}` : 'Unduh PDF'
)
</script>
