<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="sheet" role="group" aria-labelledby="notif-judul">
      <div class="grab" aria-hidden="true" />
      <div class="body notif-body">
        <span class="ring ring-blue"><AppIcon name="bell" /></span>
        <h2 id="notif-judul" class="notif-title"
          >Beri tahu saya saat ada peraturan baru</h2
        >
        <p class="notif-text">
          Pemberitahuan dikirim ketika produk hukum baru terbit. Tanpa akun, dan
          dapat dimatikan kapan saja di Info.
        </p>
        <div
          class="chips notif-chips"
          role="group"
          aria-label="Jenis yang ingin diikuti"
        >
          <button
            v-for="j in JENIS_NOTIFIKASI"
            :key="j.kode"
            type="button"
            :class="['chip', { on: pilih.includes(j.kode) }]"
            :aria-pressed="pilih.includes(j.kode)"
            @click="toggle(j.kode)"
          >
            <AppIcon v-if="pilih.includes(j.kode)" name="check" size="xs" />{{
              j.label
            }}
          </button>
        </div>
        <p class="muted notif-hint"
          >Android akan meminta izin notifikasi setelah Anda memilih
          Aktifkan.</p
        >
        <p v-if="pesan" class="field-error" role="alert">{{ pesan }}</p>
      </div>
      <footer>
        <button
          class="btn btn-text"
          type="button"
          @click="$emit('update:modelValue', false)"
          >Nanti saja</button
        >
        <button
          class="btn btn-primary"
          type="button"
          :disabled="pilih.length === 0 || sibuk"
          @click="aktifkanSekarang"
          >Aktifkan</button
        >
      </footer>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import {
  JENIS_NOTIFIKASI,
  aktifkan,
  useNotifications
} from '@/services/notifications.js'

const props = defineProps({ modelValue: { type: Boolean, required: true } })
const emit = defineEmits(['update:modelValue'])

const { state } = useNotifications()
const pilih = ref([...state.jenis])
const sibuk = ref(false)
const pesan = ref('')

watch(
  () => props.modelValue,
  open => {
    if (open) {
      pilih.value = [...state.jenis]
      pesan.value = ''
    }
  }
)

function toggle(kode) {
  pilih.value = pilih.value.includes(kode)
    ? pilih.value.filter(k => k !== kode)
    : [...pilih.value, kode]
}

async function aktifkanSekarang() {
  sibuk.value = true
  pesan.value = ''
  try {
    const hasil = await aktifkan(pilih.value)
    if (hasil === 'ditolak')
      pesan.value =
        'Izin notifikasi ditolak. Anda bisa mengubahnya di pengaturan Android.'
    else emit('update:modelValue', false)
  } catch {
    pesan.value = 'Notifikasi belum dapat diaktifkan. Coba lagi nanti.'
  } finally {
    sibuk.value = false
  }
}
</script>
