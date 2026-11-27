<template>
  <div
    id="chat-panel"
    class="chat"
    role="dialog"
    aria-labelledby="chat-title"
    :hidden="!open"
  >
    <div class="chat-head">
      <span class="chat-ico" aria-hidden="true"
        ><AppIcon name="sparkles"
      /></span>
      <h2 id="chat-title" ref="title" tabindex="-1">Asisten JDIH</h2>
      <span class="ai-tag">AI</span>
      <button
        type="button"
        class="icon-btn"
        aria-label="Hapus percakapan"
        @click="hapusPercakapan"
      >
        <AppIcon name="trash" />
      </button>
      <button
        type="button"
        class="icon-btn"
        aria-label="Tutup asisten"
        @click="$emit('close')"
      >
        <AppIcon name="x" />
      </button>
    </div>

    <div
      ref="log"
      class="chat-log"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Percakapan dengan Asisten JDIH"
    >
      <template v-if="state.pesan.length === 0">
        <div class="msg bot">
          <span class="av" aria-hidden="true"
            ><AppIcon name="sparkles" size="sm"
          /></span>
          <div class="bub">
            <p
              >Halo, saya Asisten JDIH DPRD Kota Singkawang. Saya mencari produk
              hukum berdasarkan <b>judul, jenis, nomor, tahun, dan status</b>.
              Saya belum bisa membaca isi pasal.</p
            >
            <p class="hint"
              >Setiap pertanyaan dijawab sendiri-sendiri; saya tidak mengingat
              pertanyaan sebelumnya.</p
            >
          </div>
        </div>
        <div class="chips-q" role="group" aria-label="Contoh pertanyaan">
          <button
            v-for="c in CONTOH"
            :key="c.tanya"
            class="chip"
            type="button"
            @click="kirimTeks(c.tanya)"
            >{{ c.label }}</button
          >
        </div>
      </template>

      <template v-for="m in state.pesan" :key="m.id">
        <div v-if="m.peran === 'user'" class="msg me">
          <div class="bub">
            <p>{{ m.teks }}</p>
          </div>
        </div>
        <div v-else class="msg bot">
          <span class="av" aria-hidden="true"
            ><AppIcon name="sparkles" size="sm"
          /></span>
          <div class="bub">
            <p>{{ m.teks }}</p>
            <div v-if="m.sumber.length > 0" class="srcs">
              <p class="lbl">Sumber</p>
              <ul>
                <li v-for="(s, i) in m.sumber" :key="i">
                  <component
                    :is="s.rute ? NavLink : 'div'"
                    :class="['src', { 'src-plain': !s.rute }]"
                    v-bind="s.rute ? { to: s.rute } : {}"
                    @click="s.rute && $emit('navigate')"
                  >
                    <span v-if="s.status" class="src-top">
                      <span :class="['status', s.status.kelas]">
                        <AppIcon :name="s.status.ikon" size="xs" />{{
                          s.status.teks
                        }}
                      </span>
                    </span>
                    <b>{{ s.judulNomor }}</b>
                    <small v-if="s.judul">{{ s.judul }}</small>
                    <AppIcon v-if="s.rute" name="chevron-right" size="sm" />
                  </component>
                </li>
              </ul>
            </div>
            <NavLink
              v-else
              class="btn btn-tonal btn-sm"
              to="/dokumen"
              @click="$emit('navigate')"
            >
              <AppIcon name="search" size="sm" />Cari di Dokumen
            </NavLink>
          </div>
        </div>
      </template>

      <div v-if="state.memuat" class="msg bot" aria-busy="true">
        <span class="av" aria-hidden="true"
          ><AppIcon name="sparkles" size="sm"
        /></span>
        <div class="bub">
          <p role="status">Asisten sedang mencari…</p>
          <span class="shimmer ld" aria-hidden="true" />
          <span class="shimmer ld ld-s" aria-hidden="true" />
          <button class="btn btn-text btn-sm" type="button" @click="batal">
            Batal
          </button>
        </div>
      </div>

      <div v-if="state.galat === 'batas'" class="chat-banner warn" role="alert">
        <AppIcon name="alert" />
        <p><b>Terlalu banyak pertanyaan.</b> Coba lagi sebentar lagi.</p>
      </div>
      <div
        v-else-if="state.galat === 'offline'"
        class="chat-banner warn"
        role="alert"
      >
        <AppIcon name="wifi-off" />
        <p><b>Tidak ada koneksi.</b> Asisten membutuhkan internet.</p>
      </div>
      <div v-else-if="state.galat" class="chat-banner bad" role="alert">
        <AppIcon name="x-circle" />
        <div>
          <p><b>Layanan asisten sedang bermasalah.</b></p>
          <p>Pertanyaan Anda belum terjawab. Coba lagi, atau cari manual.</p>
          <div class="acts">
            <button class="btn btn-tonal btn-sm" type="button" @click="ulang">
              <AppIcon name="refresh" size="sm" />Coba lagi
            </button>
            <NavLink
              class="btn btn-outline btn-sm"
              to="/dokumen"
              @click="$emit('navigate')"
              >Cari manual</NavLink
            >
            <a
              v-if="waHref"
              class="btn btn-outline btn-sm"
              :href="waHref"
              target="_blank"
              rel="noopener noreferrer"
              >WhatsApp<span class="sr">
                (membuka WhatsApp di tab baru)</span
              ></a
            >
          </div>
        </div>
      </div>
    </div>

    <div class="chat-foot">
      <form class="chat-form" novalidate @submit.prevent="kirimForm">
        <label class="sr" for="chat-q">Pertanyaan tentang produk hukum</label>
        <textarea
          id="chat-q"
          ref="input"
          v-model="teks"
          rows="1"
          :maxlength="PERTANYAAN.max"
          placeholder="Tanyakan produk hukum…"
          :aria-describedby="pesanForm ? 'chat-err' : undefined"
          :aria-invalid="pesanForm ? 'true' : undefined"
          @keydown.enter.exact.prevent="kirimForm"
          @input="sesuaikanTinggi"
        />
        <button
          type="submit"
          class="chat-send"
          aria-label="Kirim pertanyaan"
          :disabled="state.memuat"
        >
          <AppIcon name="send" />
        </button>
      </form>
      <p v-if="pesanForm" id="chat-err" class="field-error" role="alert">
        {{ pesanForm }}
      </p>
      <p class="chat-note"
        >Jawaban otomatis, bukan nasihat hukum resmi. Pertanyaan diproses AI dan
        dicatat tanpa identitas.</p
      >
      <div class="chat-meta">
        <NavLink to="/kebijakan-privasi" @click="$emit('navigate')"
          >Kebijakan Privasi</NavLink
        >
        <p class="chat-count num" aria-hidden="true">
          <span>{{ teks.length }}</span>/{{ PERTANYAAN.max }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import { PERTANYAAN } from '@/services/asisten.js'
import { useAsisten } from '@/composables/useAsisten.js'

// Panel percakapan Asisten (dialog non-modal). Dibuka dan ditutup oleh
// FloatingActions; di bawah 600 px berupa lembar layar penuh (CSS).
const props = defineProps({
  open: { type: Boolean, default: false },
  waHref: { type: String, default: '' }
})
defineEmits(['close', 'navigate'])

const CONTOH = [
  {
    label: 'Perda tentang retribusi pasar',
    tanya: 'Adakah perda tentang retribusi pasar?'
  },
  {
    label: 'Apakah Perda 7/2019 masih berlaku?',
    tanya: 'Apakah Perda 7 Tahun 2019 masih berlaku?'
  },
  {
    label: 'Peraturan DPRD tentang tata tertib',
    tanya: 'Peraturan DPRD tentang tata tertib'
  }
]

const { state, kirim, ulang: ulangKirim, batal, hapus } = useAsisten()

const teks = ref('')
const pesanForm = ref('')
const title = ref(null)
const log = ref(null)
const input = ref(null)

defineExpose({ focusTitle: () => title.value?.focus() })

function sesuaikanTinggi() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

async function kirimTeks(nilai) {
  pesanForm.value = ''
  const hasil = await kirim(nilai)
  if (hasil.pesan) pesanForm.value = hasil.pesan
}

async function kirimForm() {
  if (state.memuat) return
  const nilai = teks.value
  pesanForm.value = ''
  // Kolom dikosongkan hanya bila pertanyaan diterima; salah panjang tetap bisa dibetulkan.
  const hasil = await kirim(nilai)
  if (hasil.pesan) {
    pesanForm.value = hasil.pesan
    return
  }
  if (nilai === teks.value) {
    teks.value = ''
    await nextTick()
    sesuaikanTinggi()
  }
}

async function ulang() {
  pesanForm.value = ''
  await ulangKirim()
}

function hapusPercakapan() {
  hapus()
  teks.value = ''
  pesanForm.value = ''
  nextTick(sesuaikanTinggi)
  title.value?.focus()
}

// Gulir ke pesan terbaru saat ada tambahan.
watch(
  () => [state.pesan.length, state.memuat, state.galat],
  async () => {
    await nextTick()
    if (log.value) log.value.scrollTop = log.value.scrollHeight
  }
)
</script>
