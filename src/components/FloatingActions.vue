<template>
  <div
    v-if="mode !== 'none'"
    ref="root"
    class="fabs"
    :class="{ 'is-menu': menuOpen, 'is-open': panelOpen, 'is-away': away }"
    :data-mode="mode"
    @keydown.esc="onEsc"
    @focusout="onFocusOut"
  >
    <!-- Hanya WhatsApp (Asisten kosong): satu tombol bulat, langsung membuka WhatsApp. -->
    <a
      v-if="mode === 'wa'"
      class="fab-solo fab-wa"
      :href="waHref"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="fab-ico"><AppIcon name="whatsapp" fill /></span>
      <span class="fab-lbl"
        >Chat WhatsApp<span class="sr">
          (membuka WhatsApp di tab baru)</span
        ></span
      >
    </a>

    <!-- Hanya Asisten (WhatsApp kosong): satu tombol bulat yang membuka panel. -->
    <button
      v-else-if="mode === 'asisten'"
      ref="chatBtn"
      type="button"
      class="fab-solo fab-chat"
      :aria-expanded="panelOpen"
      aria-controls="chat-panel"
      @click="bukaAsisten"
    >
      <span class="fab-ico"
        ><AppIcon name="message-circle" /><span
          class="fab-ai"
          aria-hidden="true"
          >AI</span
        ></span
      >
      <span class="fab-lbl"
        >Tanya Asisten JDIH<span class="sr"> (AI)</span></span
      >
    </button>

    <!-- Dua pilihan: di bawah 1024 px satu pemicu yang membuka menu, dari 1024 px
         dua tombol bertumpuk (CSS). Satu rangkaian elemen, bukan dua salinan. -->
    <template v-else>
      <button
        ref="trigger"
        type="button"
        class="fab-trigger"
        :aria-expanded="menuOpen"
        aria-controls="fab-menu"
        aria-label="Tanya Asisten AI atau hubungi kami"
        @click="toggleMenu"
      >
        <span class="ic-msg"><AppIcon name="message-circle" /></span>
        <span class="ic-x"><AppIcon name="x" /></span>
        <span class="fab-ai" aria-hidden="true">AI</span>
      </button>
      <div
        id="fab-menu"
        class="fab-menu"
        role="group"
        aria-label="Pilihan bantuan"
      >
        <button
          ref="chatBtn"
          type="button"
          class="fab-opt fab-chat"
          :aria-expanded="panelOpen"
          aria-controls="chat-panel"
          @click="bukaAsisten"
        >
          <span class="fab-ico"
            ><AppIcon name="message-circle" /><span
              class="fab-ai"
              aria-hidden="true"
              >AI</span
            ></span
          >
          <span class="fab-lbl"
            >Tanya Asisten JDIH<span class="sr"> (AI)</span></span
          >
        </button>
        <a
          class="fab-opt fab-wa"
          :href="waHref"
          target="_blank"
          rel="noopener noreferrer"
          @click="menuOpen = false"
        >
          <span class="fab-ico"><AppIcon name="whatsapp" fill /></span>
          <span class="fab-lbl"
            >Chat WhatsApp<span class="sr">
              (membuka WhatsApp di tab baru)</span
            ></span
          >
        </a>
      </div>
    </template>

    <AsistenPanel
      v-if="adaAsisten"
      ref="panel"
      :open="panelOpen"
      :wa-href="adaWhatsapp ? waHref : ''"
      @close="tutupPanel()"
      @navigate="onNavigate"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import AsistenPanel from './AsistenPanel.vue'
import { WHATSAPP } from '@/config/env.js'
import { ASISTEN_AKTIF, WHATSAPP_AKTIF } from '@/config/fitur.js'
import { pesanWhatsapp } from '@/composables/useFabContext.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

// Widget kanan bawah: Asisten AI (atas) dan WhatsApp (bawah). Tiap fitur hanya
// dirender bila dikonfigurasi (.env): keduanya kosong = tidak ada widget.
const adaAsisten = ASISTEN_AKTIF
const adaWhatsapp = WHATSAPP_AKTIF
const mode = adaAsisten
  ? adaWhatsapp
    ? 'dua'
    : 'asisten'
  : adaWhatsapp
    ? 'wa'
    : 'none'

const waHref = computed(() => whatsappUrl(WHATSAPP, pesanWhatsapp.value))

const root = ref(null)
const trigger = ref(null)
const chatBtn = ref(null)
const panel = ref(null)
const menuOpen = ref(false)
const panelOpen = ref(false)
const away = ref(false)

let wide = null
let phone = null

// Tujuan fokus saat menu atau panel ditutup: pemicu (di bawah 1024 px) atau
// tombol Asisten (dari 1024 px, saat pemicu disembunyikan).
const home = () =>
  (wide?.matches ? chatBtn.value : trigger.value) ?? chatBtn.value

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

async function bukaAsisten() {
  menuOpen.value = false
  panelOpen.value = true
  await nextTick()
  panel.value?.focusTitle()
}

function tutupPanel({ returnFocus = true } = {}) {
  panelOpen.value = false
  if (returnFocus) nextTick(() => home()?.focus())
}

function onEsc(event) {
  if (panelOpen.value) {
    event.stopPropagation()
    tutupPanel()
  } else if (menuOpen.value) {
    event.stopPropagation()
    menuOpen.value = false
    nextTick(() => trigger.value?.focus())
  }
}

// Fokus yang keluar dari widget menutup menu dan panel tanpa merebut fokus.
function onFocusOut(event) {
  const next = event.relatedTarget
  if (next instanceof Node && !root.value?.contains(next)) {
    menuOpen.value = false
    panelOpen.value = false
  }
}

// Tautan sumber di panel: di ponsel panel menutupi layar, jadi ditutup saat berpindah halaman.
function onNavigate() {
  if (phone?.matches) tutupPanel({ returnFocus: false })
}

function onPointerDown(event) {
  if (menuOpen.value && !root.value?.contains(event.target)) {
    menuOpen.value = false
  }
}

// Ponsel: tombol menyingkir saat halaman digulir ke bawah dan muncul lagi saat
// digulir ke atas. Tidak berlaku saat menu atau panel terbuka.
let lastY = 0
function onScroll() {
  const y = window.scrollY
  if (!phone?.matches || menuOpen.value || panelOpen.value) {
    away.value = false
  } else if (y > lastY + 6 && y > 80) away.value = true
  else if (y < lastY - 6) away.value = false
  lastY = y
}

const onWide = event => {
  if (event.matches) menuOpen.value = false
}

watch([menuOpen, panelOpen], () => {
  if (menuOpen.value || panelOpen.value) away.value = false
})

onMounted(() => {
  wide = globalThis.matchMedia?.('(min-width: 1024px)') ?? null
  phone = globalThis.matchMedia?.('(max-width: 599.98px)') ?? null
  wide?.addEventListener?.('change', onWide)
  document.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('scroll', onScroll, { passive: true })
  // Ruang bawah footer menyesuaikan jumlah tombol (lihat app.scss).
  if (mode !== 'none') document.documentElement.dataset.fabs = mode
})

onBeforeUnmount(() => {
  wide?.removeEventListener?.('change', onWide)
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('scroll', onScroll)
  delete document.documentElement.dataset.fabs
})
</script>
