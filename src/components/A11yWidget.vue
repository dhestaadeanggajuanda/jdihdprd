<template>
  <div
    v-if="enabled"
    ref="root"
    class="a11y"
    @keydown.esc.stop="tutup"
    @focusout="onFocusOut"
  >
    <button
      ref="trigger"
      type="button"
      class="a11y-trigger"
      :aria-expanded="open"
      aria-controls="a11y-panel"
      aria-label="Buka pengaturan aksesibilitas"
      @click="toggle"
    >
      <AppIcon name="accessibility" />
    </button>

    <div
      id="a11y-panel"
      class="a11y-panel"
      role="dialog"
      aria-labelledby="a11y-title"
      :hidden="!open"
    >
      <div class="a11y-head">
        <h2 id="a11y-title" ref="title" tabindex="-1">Aksesibilitas</h2>
        <button
          type="button"
          class="icon-btn"
          aria-label="Tutup pengaturan aksesibilitas"
          @click="tutup"
        >
          <AppIcon name="x" />
        </button>
      </div>

      <div class="a11y-body">
        <section aria-labelledby="a-teks">
          <h3 id="a-teks">Teks</h3>
          <div class="a11y-seg">
            <span id="a-size">Ukuran teks</span>
            <div class="seg" role="group" aria-labelledby="a-size">
              <button
                v-for="t in UKURAN_TEKS"
                :key="t.value"
                type="button"
                :aria-pressed="tampilan.text === t.value"
                @click="pilihUkuran(t)"
                >{{ t.label }}</button
              >
            </div>
          </div>
          <div class="a11y-tiles">
            <button
              v-for="o in TILES_TEKS"
              :key="o.flag"
              type="button"
              class="a11y-tile"
              :class="{ 'fine-only': o.halus }"
              :aria-pressed="a11y[o.flag]"
              @click="ubah(o)"
            >
              <span>{{ o.label }}</span>
              <AppIcon name="check" size="xs" />
            </button>
          </div>
        </section>

        <section aria-labelledby="a-tampil">
          <h3 id="a-tampil">Tampilan</h3>
          <div class="a11y-seg">
            <span id="a-tema">Tema</span>
            <div class="seg" role="group" aria-labelledby="a-tema">
              <button
                v-for="t in TEMA"
                :key="t.value"
                type="button"
                :aria-pressed="tampilan.theme === t.value"
                @click="pilihTema(t)"
                >{{ t.label }}</button
              >
            </div>
          </div>
          <div class="a11y-tiles">
            <button
              v-for="o in TILES_TAMPILAN"
              :key="o.flag"
              type="button"
              class="a11y-tile"
              :class="{ 'fine-only': o.halus }"
              :aria-pressed="a11y[o.flag]"
              @click="ubah(o)"
            >
              <span>{{ o.label }}</span>
              <AppIcon name="check" size="xs" />
            </button>
          </div>
        </section>
      </div>

      <div class="a11y-foot">
        <button type="button" class="btn btn-outline btn-block" @click="atur">
          <AppIcon name="reset" />Atur ulang semua
        </button>
        <div class="a11y-note">
          <span>Disimpan di perangkat ini, tanpa cookie.</span>
          <NavLink to="/kebijakan-cookie">Kebijakan Cookie</NavLink>
        </div>
      </div>
    </div>

    <p class="sr" role="status" aria-live="polite">{{ pengumuman }}</p>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Platform } from 'quasar'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import { PILIHAN_A11Y, TEMA, UKURAN_TEKS } from '@/config/aksesibilitas.js'
import { useA11yPanel } from '@/composables/useA11yPanel.js'
import { useAppearance } from '@/composables/useAppearance.js'

// Widget aksesibilitas: tombol kiri bawah dan panel non-modal, hanya di web dan
// hanya >= 1024 px (CSS). Di Android memakai pengaturan aksesibilitas sistem,
// jadi tidak dirender. Pilihan yang sama ada di Profil > Tampilan.
const enabled = !Platform.is.capacitor

const byFlag = Object.fromEntries(PILIHAN_A11Y.map(o => [o.flag, o]))
const TILES_TEKS = ['spacing', 'links'].map(f => byFlag[f])
const TILES_TAMPILAN = ['contrast', 'gray', 'motion', 'cursor'].map(
  f => byFlag[f]
)

const { open, show, hide, registerTrigger } = useA11yPanel()
const {
  state: tampilan,
  a11y,
  setTheme,
  setText,
  toggleA11y,
  reset
} = useAppearance()

const root = ref(null)
const trigger = ref(null)
const title = ref(null)
const pengumuman = ref('')
let pengumumanTimer = null

// Teks diumumkan lewat wilayah aria-live; dikosongkan dulu agar teks yang sama
// tetap diumumkan ulang.
function umumkan(teks) {
  pengumuman.value = ''
  clearTimeout(pengumumanTimer)
  pengumumanTimer = setTimeout(() => (pengumuman.value = teks), 50)
}

function toggle() {
  if (open.value) hide()
  else show(trigger.value)
}

function tutup() {
  hide()
}

// Fokus pindah ke judul panel saat dibuka, supaya pembaca layar membacakan
// dialognya dan Tab berikutnya masuk ke isinya.
watch(open, async value => {
  if (!value) return
  await nextTick()
  title.value?.focus()
})

// Fokus yang keluar dari widget menutup panel tanpa merebut fokus kembali.
// Klik pada area yang tidak bisa difokus (relatedTarget kosong) tidak menutup.
function onFocusOut(event) {
  const next = event.relatedTarget
  if (open.value && next instanceof Node && !root.value?.contains(next)) {
    hide({ returnFocus: false })
  }
}

function ubah(o) {
  toggleA11y(o.flag)
  umumkan(`${o.label}: ${a11y[o.flag] ? 'aktif' : 'nonaktif'}`)
}

function pilihUkuran(t) {
  setText(t.value)
  umumkan(`Ukuran teks: ${t.label}`)
}

function pilihTema(t) {
  setTheme(t.value)
  umumkan(`Tema: ${t.label}`)
}

function atur() {
  reset()
  umumkan('Semua pengaturan dikembalikan.')
}

// Di bawah 1024 px widget disembunyikan CSS; panel yang masih terbuka ikut tertutup.
let media = null
const onMedia = event => {
  if (!event.matches && open.value) hide({ returnFocus: false })
}
onMounted(() => {
  registerTrigger(trigger.value)
  media = globalThis.matchMedia?.('(min-width: 1024px)') ?? null
  media?.addEventListener?.('change', onMedia)
})
onBeforeUnmount(() => {
  media?.removeEventListener?.('change', onMedia)
  clearTimeout(pengumumanTimer)
})
</script>
