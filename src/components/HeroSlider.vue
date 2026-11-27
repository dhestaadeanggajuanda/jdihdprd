<template>
  <section
    class="hero"
    aria-labelledby="h-hero"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @focusin="focused = true"
    @focusout="focused = false"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- Foto latar dekoratif: dilewati pembaca layar. Kontrolnya tetap bisa dipakai papan ketik. -->
    <div class="hero-slides" aria-hidden="true">
      <div
        v-for="(s, i) in SLIDES"
        :key="s.src"
        :class="['hero-slide', { 'is-active': i === index }]"
      >
        <img
          :src="s.src"
          alt=""
          width="700"
          height="466"
          decoding="async"
          :loading="i === 0 ? undefined : 'lazy'"
          :fetchpriority="i === 0 ? 'high' : undefined"
          :style="{ '--pos': s.pos }"
        />
      </div>
    </div>

    <div class="wrap">
      <div class="hero-head">
        <h1 id="h-hero">Temukan produk hukum DPRD Kota Singkawang</h1>
        <p class="lead">
          Peraturan daerah, monografi, artikel, dan putusan, lengkap dengan
          status berlaku dan berkas resminya.
        </p>
      </div>

      <SearchCard />

      <div class="shortcuts" aria-label="Pintasan pencarian">
        <NavLink
          v-for="c in SHORTCUTS"
          :key="c.label"
          class="chip"
          :to="{ path: '/dokumen', query: c.query }"
        >
          {{ c.label }}
        </NavLink>
      </div>

      <div class="hero-ctl" role="group" aria-label="Foto latar">
        <button
          class="pp"
          type="button"
          :aria-label="
            paused
              ? 'Putar pergantian foto latar'
              : 'Jeda pergantian foto latar'
          "
          :data-paused="paused ? '' : undefined"
          @click="paused = !paused"
        >
          <AppIcon class="ic-pause" name="pause" />
          <AppIcon class="ic-play" name="play" />
        </button>
        <div class="dots">
          <button
            v-for="(s, i) in SLIDES"
            :key="s.src"
            type="button"
            :aria-label="`Foto latar ${i + 1} dari ${SLIDES.length}`"
            :aria-current="i === index ? 'true' : 'false'"
            @click="go(i)"
          />
        </div>
      </div>
    </div>

    <button
      class="hero-arrow prev"
      type="button"
      aria-label="Foto latar sebelumnya"
      @click="go(index - 1)"
    >
      <AppIcon name="chevron-left" />
    </button>
    <button
      class="hero-arrow next"
      type="button"
      aria-label="Foto latar berikutnya"
      @click="go(index + 1)"
    >
      <AppIcon name="chevron-right" />
    </button>
  </section>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect
} from 'vue'
import { getReferensi } from '@/services/api.js'
import { useAppearance } from '@/composables/useAppearance.js'
import { useResource } from '@/composables/useResource.js'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import SearchCard from './SearchCard.vue'
import hero1 from '@/assets/hero/hero-1.jpg'
import hero2 from '@/assets/hero/hero-2.jpg'
import hero3 from '@/assets/hero/hero-3.jpg'

// Foto contoh (dokumentasi sidang dari Media Center). Ganti dengan foto resmi
// beserta hak pakainya sebelum rilis. Lihat design/mockups/README.md.
const SLIDES = [
  { src: hero1, pos: '50% 40%' },
  { src: hero2, pos: '50% 88%' },
  { src: hero3, pos: '50% 82%' }
]

// Pintasan jenis diambil dari daftar jenis di API (kode jenis berasal dari data,
// bukan konstanta): label pintasan dicocokkan dengan nama jenis yang ada. Pintasan
// yang jenisnya belum punya dokumen terbit tidak ditampilkan.
const JENIS_PINTASAN = [
  { label: 'Perda', nama: /^peraturan daerah( kota)?$/i },
  { label: 'Perwali', nama: /^peraturan wali ?kota$/i },
  { label: 'Peraturan DPRD', nama: /^peraturan dprd( kota)?$/i }
]

const { data: jenisData } = useResource(
  signal => getReferensi('jenis-peraturan', { signal }),
  { cacheKey: 'referensi:jenis-peraturan', ttlMs: 10 * 60 * 1000 }
)

const SHORTCUTS = computed(() => [
  { label: 'Hanya yang berlaku', query: { status: 'berlaku' } },
  ...JENIS_PINTASAN.flatMap(p => {
    const jenis = (jenisData.value ?? []).find(j => p.nama.test(j.nama))
    return jenis ? [{ label: p.label, query: { jenis: jenis.kode } }] : []
  })
])

const INTERVAL_MS = 6000

const index = ref(0)
// Gerak dikurangi (pengaturan sistem atau "Hentikan animasi" di aksesibilitas):
// tidak berganti sendiri, pengguna bisa memutarnya manual (WCAG 2.2.2).
const { a11y } = useAppearance()
const paused = ref(
  a11y.motion ||
    (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false)
)
watch(
  () => a11y.motion,
  value => {
    if (value) paused.value = true
  }
)
// Pergantian berhenti sementara saat kursor atau fokus ada di hero.
const hover = ref(false)
const focused = ref(false)
const hidden = ref(false)
let timer = null

const go = n => {
  index.value = (n + SLIDES.length) % SLIDES.length
  restart()
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function restart() {
  stop()
  if (!paused.value && !hover.value && !focused.value && !hidden.value) {
    timer = setInterval(
      () => (index.value = (index.value + 1) % SLIDES.length),
      INTERVAL_MS
    )
  }
}

watchEffect(() => {
  // Bergantung pada keempat keadaan: setiap perubahan memulai ulang pewaktu.
  void [paused.value, hover.value, focused.value, hidden.value]
  restart()
})

const onVisibility = () => (hidden.value = document.hidden)

onMounted(() => document.addEventListener('visibilitychange', onVisibility))

onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', onVisibility)
})

// Geser di ponsel. Geseran yang dimulai di kartu pencarian, pintasan, atau kontrol diabaikan.
let startX = null
function onTouchStart(e) {
  startX = e.target.closest('.shortcuts, .searchcard, .hero-ctl')
    ? null
    : e.touches[0].clientX
}
function onTouchEnd(e) {
  if (startX === null) return
  const dx = e.changedTouches[0].clientX - startX
  startX = null
  if (Math.abs(dx) > 48) go(dx < 0 ? index.value + 1 : index.value - 1)
}
</script>
