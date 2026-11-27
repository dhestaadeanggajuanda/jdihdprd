<template>
  <div class="pv-bar">
    <div class="pv-nav" role="group" aria-label="Halaman">
      <button
        class="icon-btn"
        type="button"
        aria-label="Halaman sebelumnya"
        :disabled="halaman <= 1"
        @click="pindah(-1)"
      >
        <AppIcon name="chevron-up" />
      </button>
      <span class="pv-pg num" role="status">
        <span class="pv-long"
          >Halaman <b>{{ halaman }}</b> dari {{ jumlah }}</span
        >
        <span class="pv-short" aria-hidden="true"
          ><b>{{ halaman }}</b> / {{ jumlah }}</span
        >
      </span>
      <button
        class="icon-btn"
        type="button"
        aria-label="Halaman berikutnya"
        :disabled="halaman >= jumlah"
        @click="pindah(1)"
      >
        <AppIcon name="chevron-down" />
      </button>
    </div>
    <div class="pv-zoom" role="group" aria-label="Perbesaran">
      <button
        class="icon-btn"
        type="button"
        aria-label="Perkecil"
        :disabled="zoom <= ZOOM_MIN"
        @click="ubahZoom(1 / LANGKAH)"
      >
        <AppIcon name="zoom-out" />
      </button>
      <span class="num">{{ Math.round(zoom) }}%</span>
      <button
        class="icon-btn"
        type="button"
        aria-label="Perbesar"
        :disabled="zoom >= ZOOM_MAX"
        @click="ubahZoom(LANGKAH)"
      >
        <AppIcon name="zoom-in" />
      </button>
      <button
        class="btn btn-text btn-fit"
        type="button"
        aria-label="Lebar halaman"
        @click="sesuaikan"
      >
        <span>Lebar<span class="pv-more"> halaman</span></span>
      </button>
    </div>
    <div class="pv-act"><slot name="aksi" /></div>
  </div>
  <div
    ref="stage"
    class="pv-stage"
    role="region"
    :aria-label="labelStage"
    tabindex="0"
    @scroll.passive="onScroll"
  >
    <div
      v-for="n in jumlah"
      :key="n"
      :ref="el => (halamanEls[n] = el)"
      class="pv-page pv-real"
      role="img"
      :aria-label="`Halaman ${n} dari ${jumlah}`"
      :data-page="n"
      :style="gayaHalaman(n)"
    >
      <canvas :ref="el => (kanvasEls[n] = el)" />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

// Penampil halaman PDF: halaman bertumpuk digambar ke <canvas> hanya saat dekat
// layar, dibebaskan saat jauh. Hanya gambar halaman (tanpa lapisan teks).
const props = defineProps({
  // PDFDocumentProxy (objek mentah, bukan reaktif)
  doc: { type: Object, required: true },
  jumlah: { type: Number, required: true },
  // Halaman yang dibuka pertama kali (mis. saat berpindah ke layar penuh)
  mulai: { type: Number, default: 1 },
  labelStage: { type: String, default: 'Halaman dokumen' }
})
const emit = defineEmits(['halaman', 'siap'])

const ZOOM_MIN = 25
const ZOOM_MAX = 300
const LANGKAH = 1.25
const CSS_PX_PER_PT = 96 / 72
// Batas piksel kanvas per halaman (memori): resolusi turun bila terlalu besar.
const MAKS_PIKSEL = 16_000_000

const stage = ref(null)
const halamanEls = []
const kanvasEls = []
const halaman = ref(Math.min(Math.max(1, props.mulai), props.jumlah))
const zoom = ref(100)
// Ukuran halaman dalam poin PDF; halaman yang belum dibaca memakai ukuran halaman 1.
const ukuran = reactive({})
let dasar = { w: 595, h: 842 }
let ikuti = true // mengikuti lebar kolom sampai pengguna mengatur perbesaran sendiri

const terlihat = new Set()
const tugas = new Map() // nomor -> { task, kunci }
const tergambar = new Map() // nomor -> kunci
let kunciZoom = 0
let antrean = Promise.resolve()
let observer = null
let resizeObserver = null
let rafId = 0
let mati = false

function gayaHalaman(n) {
  const u = ukuran[n] ?? dasar
  const skala = (CSS_PX_PER_PT * zoom.value) / 100
  return { width: `${u.w * skala}px`, height: `${u.h * skala}px` }
}

function lebarSesuai() {
  const lebar = (stage.value?.clientWidth ?? 0) - 32
  if (lebar <= 0) return 100
  const persen = (lebar / (dasar.w * CSS_PX_PER_PT)) * 100
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, persen))
}

function sesuaikan() {
  ikuti = true
  aturZoom(lebarSesuai())
}

function ubahZoom(faktor) {
  ikuti = false
  aturZoom(zoom.value * faktor)
}

async function aturZoom(nilai) {
  const baru = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nilai))
  if (Math.abs(baru - zoom.value) < 0.01) return
  const sekarang = halaman.value
  zoom.value = baru
  kunciZoom += 1
  await nextTick()
  keHalaman(sekarang)
  for (const n of terlihat) gambarLagi(n)
}

function keHalaman(n) {
  const el = halamanEls[n]
  const box = stage.value
  if (!el || !box) return
  box.scrollTop +=
    el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16
}

function pindah(arah) {
  const n = Math.min(props.jumlah, Math.max(1, halaman.value + arah))
  halaman.value = n
  keHalaman(n)
  emit('halaman', n)
}

// Halaman aktif: yang memuat titik sepertiga atas area gulir.
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    const box = stage.value
    if (!box) return
    const top = box.getBoundingClientRect().top
    const titik = top + box.clientHeight / 3
    let aktif = halaman.value
    for (let n = 1; n <= props.jumlah; n++) {
      const r = halamanEls[n]?.getBoundingClientRect()
      if (!r) continue
      if (r.top <= titik && r.bottom > titik) {
        aktif = n
        break
      }
    }
    if (aktif !== halaman.value) {
      halaman.value = aktif
      emit('halaman', aktif)
    }
  })
}

function bebaskan(n) {
  tugas.get(n)?.task?.cancel?.()
  tugas.delete(n)
  tergambar.delete(n)
  const c = kanvasEls[n]
  if (c) {
    c.width = 0
    c.height = 0
  }
}

async function gambar(n) {
  if (mati || !terlihat.has(n)) return
  const kunci = kunciZoom
  if (tergambar.get(n) === kunci) return
  const canvas = kanvasEls[n]
  if (!canvas) return
  try {
    const page = await props.doc.getPage(n)
    if (mati || !terlihat.has(n) || kunci !== kunciZoom) return
    const poin = page.getViewport({ scale: 1 })
    ukuran[n] = { w: poin.width, h: poin.height }
    const skala = (CSS_PX_PER_PT * zoom.value) / 100
    const viewport = page.getViewport({ scale: skala })
    const cssW = viewport.width
    const cssH = viewport.height
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
    const keluaran = Math.min(dpr, Math.sqrt(MAKS_PIKSEL / (cssW * cssH)))
    canvas.width = Math.max(1, Math.floor(cssW * keluaran))
    canvas.height = Math.max(1, Math.floor(cssH * keluaran))
    const task = page.render({
      canvas,
      viewport,
      transform: keluaran === 1 ? undefined : [keluaran, 0, 0, keluaran, 0, 0]
    })
    tugas.set(n, { task, kunci })
    await task.promise
    if (kunci === kunciZoom) tergambar.set(n, kunci)
    page.cleanup()
  } catch (err) {
    // Render dibatalkan (digulir jauh atau perbesaran berubah) bukan galat.
    if (err?.name !== 'RenderingCancelledException') {
      // Halaman ini kosong; halaman lain tetap digambar.
    }
  } finally {
    if (tugas.get(n)?.kunci === kunci) tugas.delete(n)
  }
}

function gambarLagi(n) {
  tugas.get(n)?.task?.cancel?.()
  tugas.delete(n)
  tergambar.delete(n)
  antrean = antrean.then(() => gambar(n))
}

function pasangObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const n = Number(e.target.dataset.page)
        if (e.isIntersecting) {
          terlihat.add(n)
          antrean = antrean.then(() => gambar(n))
        } else {
          terlihat.delete(n)
          bebaskan(n)
        }
      }
    },
    { root: stage.value, rootMargin: '700px 0px' }
  )
  for (let n = 1; n <= props.jumlah; n++) {
    if (halamanEls[n]) observer.observe(halamanEls[n])
  }
}

onMounted(async () => {
  const page1 = await props.doc.getPage(1)
  const poin = page1.getViewport({ scale: 1 })
  dasar = { w: poin.width, h: poin.height }
  ukuran[1] = { ...dasar }
  page1.cleanup()
  if (mati) return
  zoom.value = lebarSesuai()
  await nextTick()
  pasangObserver()
  keHalaman(halaman.value)
  emit('siap')
  resizeObserver = new ResizeObserver(() => {
    if (ikuti) {
      const baru = lebarSesuai()
      if (Math.abs(baru - zoom.value) > 0.5) aturZoom(baru)
    }
  })
  if (stage.value) resizeObserver.observe(stage.value)
})

watch(
  () => props.jumlah,
  async () => {
    await nextTick()
    pasangObserver()
  }
)

onBeforeUnmount(() => {
  mati = true
  observer?.disconnect()
  resizeObserver?.disconnect()
  cancelAnimationFrame(rafId)
  for (const n of tugas.keys()) bebaskan(n)
})

defineExpose({
  fokus: () => stage.value?.focus(),
  keHalaman,
  halaman
})
</script>
