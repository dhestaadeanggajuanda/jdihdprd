<template>
  <section
    v-if="berkas.length > 0"
    ref="root"
    class="panel pv"
    aria-labelledby="h-pv"
  >
    <div class="pv-head">
      <h2 id="h-pv">Pratinjau dokumen</h2>
      <div
        v-if="berkas.length > 1"
        class="pv-files"
        role="group"
        aria-label="Berkas yang dipratinjau"
      >
        <button
          v-for="(l, i) in berkas"
          :key="l.id"
          type="button"
          :aria-pressed="i === aktif"
          @click="pilih(i)"
          >{{ labelBerkas(l) }}</button
        >
      </div>
    </div>

    <PdfMessage
      v-if="['galat', 'besar', 'luar'].includes(status)"
      :status="status"
      :unduh-href="unduhHref"
      :ukuran="ukuranTampil"
      @ulang="muatBerkas"
    />

    <template v-else>
      <!-- Ponsel dan tablet (< 1024 px): kartu, berkas baru diunduh saat diketuk. -->
      <div v-if="!lebar" class="pv-card">
        <div class="pv-thumb" aria-hidden="true">
          <canvas v-show="adaThumb" ref="thumb" class="pv-thumb-img" />
          <span v-if="!adaThumb" class="pv-thumb-ph"
            ><AppIcon name="file"
          /></span>
        </div>
        <div class="pv-cardtxt">
          <p><b>{{ jumlah > 0 ? `${jumlah} halaman` : 'Dokumen PDF' }}</b></p>
          <p v-if="ukuranTampil > 0" class="muted num"
            >PDF · {{ formatBytes(ukuranTampil) }}</p
          >
        </div>
        <button
          ref="bukaBtn"
          class="btn btn-tonal"
          type="button"
          @click="bukaLayarPenuh"
        >
          <AppIcon name="maximize" />Buka pratinjau
        </button>
      </div>

      <!-- Desktop (>= 1024 px): inline, dimuat otomatis saat seksi terlihat. -->
      <div v-else class="pv-inline">
        <PdfMessage
          v-if="status === 'memuat' || status === 'idle'"
          status="memuat"
        />
        <PdfViewer
          v-else-if="status === 'siap' && doc && !modal"
          :key="`inline-${aktif}`"
          :doc="doc"
          :jumlah="jumlah"
          :mulai="halamanTerakhir"
          label-stage="Halaman dokumen"
          @halaman="n => (halamanTerakhir = n)"
        >
          <template #aksi>
            <button
              ref="layarBtn"
              class="icon-btn"
              type="button"
              aria-label="Layar penuh"
              @click="bukaLayarPenuh"
            >
              <AppIcon name="maximize" />
            </button>
          </template>
        </PdfViewer>
      </div>
    </template>

    <p class="pv-note">
      <AppIcon name="info" size="sm" /><span
        >Pratinjau berupa gambar halaman: teks tidak dapat dipilih atau dibaca
        pembaca layar. Unduh PDF untuk menyimpan salinan atau membacanya dengan
        pembaca layar.</span
      >
    </p>

    <Teleport to="body">
      <div
        v-if="modal"
        class="pv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pv-mt"
        @keydown.esc.stop="tutupLayarPenuh"
      >
        <div class="pv-mhead">
          <button
            class="icon-btn"
            type="button"
            aria-label="Tutup pratinjau"
            @click="tutupLayarPenuh"
          >
            <AppIcon name="x" />
          </button>
          <h2 id="pv-mt" ref="judulModal" tabindex="-1">{{ judul }}</h2>
          <a
            class="icon-btn"
            :href="unduhHref"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Unduh PDF"
          >
            <AppIcon name="download" />
          </a>
        </div>
        <template v-if="status === 'siap' && doc">
          <PdfViewer
            :key="`modal-${aktif}`"
            :doc="doc"
            :jumlah="jumlah"
            :mulai="halamanTerakhir"
            label-stage="Halaman dokumen, layar penuh"
            @halaman="n => (halamanTerakhir = n)"
          >
            <template #aksi>
              <a
                class="btn btn-tonal"
                :href="unduhHref"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AppIcon name="download" />Unduh PDF
              </a>
            </template>
          </PdfViewer>
        </template>
        <div v-else class="pv-modal-body">
          <PdfMessage
            :status="status === 'idle' ? 'memuat' : status"
            :unduh-href="unduhHref"
            :ukuran="ukuranTampil"
            @ulang="muatBerkas"
          />
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import PdfMessage from './PdfMessage.vue'
import PdfViewer from './PdfViewer.vue'
import { usePdfPreview } from '@/composables/usePdfPreview.js'
import { useMedia } from '@/composables/useMedia.js'
import { formatBytes } from '@/utils/format.js'

// Pratinjau dokumen di halaman detail. Desktop (>= 1024 px): inline, dimuat
// otomatis saat seksi terlihat. Ponsel dan tablet: kartu, berkas baru diunduh
// saat "Buka pratinjau" diketuk, lalu tampil di penampil layar penuh.
const props = defineProps({
  // lampiran dokumen: [{ id, nama, ukuran, peran }]
  lampiran: { type: Array, required: true },
  judul: { type: String, default: 'Pratinjau dokumen' },
  // (lampiran) => alamat unduh
  alamat: { type: Function, required: true }
})

const lebar = useMedia('(min-width: 1024px)')

// Utama dulu, lalu abstrak, lalu lampiran lain.
const URUTAN = { utama: 0, abstrak: 1, lampiran: 2 }
const berkas = computed(() =>
  [...props.lampiran].sort(
    (a, b) => (URUTAN[a.peran] ?? 3) - (URUTAN[b.peran] ?? 3)
  )
)
const aktif = ref(0)
const sekarang = computed(() => berkas.value[aktif.value] ?? null)
const unduhHref = computed(() =>
  sekarang.value ? props.alamat(sekarang.value) : '#'
)
const ukuranTampil = computed(() => {
  if (ukuranBesar.value > 0) return ukuranBesar.value
  return sekarang.value?.ukuran ?? 0
})

const { status, doc, jumlah, ukuranBesar, muat, reset } = usePdfPreview()

const root = ref(null)
const thumb = ref(null)
const bukaBtn = ref(null)
const layarBtn = ref(null)
const judulModal = ref(null)
const modal = ref(false)
const terlihat = ref(false)
const adaThumb = ref(false)
const halamanTerakhir = ref(1)
let pembuka = null
let observer = null

const labelBerkas = l =>
  l.peran === 'utama'
    ? 'Dokumen'
    : l.peran === 'abstrak'
      ? 'Abstrak'
      : l.nama.length > 28
        ? `${l.nama.slice(0, 27)}…`
        : l.nama

function muatBerkas() {
  if (!sekarang.value) return
  return muat(unduhHref.value, sekarang.value.ukuran ?? null)
}

function pilih(i) {
  if (i === aktif.value) return
  aktif.value = i
  halamanTerakhir.value = 1
  adaThumb.value = false
  reset()
  // Desktop yang sedang terlihat atau penampil yang terbuka memuat berkas baru langsung.
  if ((lebar.value && terlihat.value) || modal.value) muatBerkas()
}

// Desktop: muat otomatis begitu seksi terlihat (sekali per berkas).
watch([terlihat, lebar, status], () => {
  if (lebar.value && terlihat.value && status.value === 'idle') muatBerkas()
})

// Mengganti daftar lampiran (halaman detail lain) mengulang dari awal.
watch(
  () => props.lampiran,
  () => {
    aktif.value = 0
    halamanTerakhir.value = 1
    adaThumb.value = false
    reset()
    if (modal.value) tutupLayarPenuh({ fokus: false })
  }
)

async function bukaLayarPenuh(event) {
  pembuka = event?.currentTarget ?? document.activeElement
  // Ponsel: berkas diunduh saat diketuk. Bila ukurannya sudah diketahui terlalu besar,
  // pesannya tampil di seksi ini dan penampil tidak dibuka.
  if (status.value === 'idle') muatBerkas()
  if (status.value === 'besar') return
  modal.value = true
  document.documentElement.classList.add('pv-lock')
  document.getElementById('q-app')?.setAttribute('inert', '')
  await nextTick()
  judulModal.value?.focus()
}

function tutupLayarPenuh({ fokus = true } = {}) {
  modal.value = false
  document.documentElement.classList.remove('pv-lock')
  document.getElementById('q-app')?.removeAttribute('inert')
  const target = pembuka
  pembuka = null
  if (fokus === false) return
  nextTick(() => {
    const tujuan = target?.isConnected
      ? target
      : (bukaBtn.value ?? layarBtn.value)
    tujuan?.focus()
  })
}

// Gambar kecil halaman 1 untuk kartu (ponsel) setelah dokumen terbuka.
watch([doc, thumb], async () => {
  const dokumen = doc.value
  const canvas = thumb.value
  if (!dokumen || !canvas) return
  try {
    const page = await dokumen.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const skala = 104 / base.width
    const viewport = page.getViewport({ scale: skala })
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await page.render({ canvas, viewport }).promise
    page.cleanup()
    adaThumb.value = true
  } catch {
    adaThumb.value = false
  }
})

onMounted(() => {
  if (!root.value || !globalThis.IntersectionObserver) {
    terlihat.value = true
    return
  }
  observer = new IntersectionObserver(
    entries => {
      terlihat.value = entries.some(e => e.isIntersecting)
    },
    { rootMargin: '200px 0px' }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (modal.value) {
    document.documentElement.classList.remove('pv-lock')
    document.getElementById('q-app')?.removeAttribute('inert')
  }
})
</script>
