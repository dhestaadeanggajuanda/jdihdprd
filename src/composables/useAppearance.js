// Tampilan yang bisa diatur pengguna, disimpan di perangkat (localStorage, tanpa cookie):
// - `jdih:tampilan`: tema (sistem, terang, gelap) dan ukuran teks.
// - `jdih:aksesibilitas`: kontras tinggi, jarak teks, garis bawah tautan, hentikan
//   animasi, skala abu-abu, kursor besar. Hanya di web: aplikasi Android memakai
//   pengaturan aksesibilitas sistem, jadi atributnya tidak dipasang di sana.
// Semuanya diterapkan sebagai atribut di <html> sebelum aplikasi tampil agar tidak
// berkedip. Efeknya ada di app.scss (`html[data-a11y-*]`).
import { reactive, watch } from 'vue'
import { Dark, Platform } from 'quasar'
import { readJson, writeJson } from '@/utils/storage.js'

export const THEMES = ['system', 'light', 'dark']
export const TEXT_SIZES = ['normal', 'large', 'xlarge']
export const A11Y_FLAGS = [
  'contrast',
  'spacing',
  'links',
  'motion',
  'gray',
  'cursor'
]

const saved = readJson('tampilan', {})
const state = reactive({
  theme: THEMES.includes(saved.theme) ? saved.theme : 'system',
  text: TEXT_SIZES.includes(saved.text) ? saved.text : 'normal'
})

// Daftar putih: hanya enam kunci yang dikenal dan hanya nilai `true` yang dipakai.
function readA11y() {
  const raw = readJson('aksesibilitas', {})
  const obj = raw !== null && typeof raw === 'object' ? raw : {}
  return Object.fromEntries(A11Y_FLAGS.map(k => [k, obj[k] === true]))
}
const a11y = reactive(readA11y())

let media = null

function resolvedTheme() {
  if (state.theme !== 'system') return state.theme
  return media?.matches ? 'dark' : 'light'
}

// Nilai atribut per pilihan. `null` = atribut dilepas.
const A11Y_ATTR = {
  contrast: ['a11yContrast', 'high'],
  spacing: ['a11ySpacing', ''],
  links: ['a11yLinks', ''],
  motion: ['a11yMotion', 'off'],
  gray: ['a11yGray', ''],
  cursor: ['a11yCursor', '']
}

function apply() {
  const root = document.documentElement
  const theme = resolvedTheme()
  root.dataset.theme = theme
  root.dataset.text = state.text
  Dark.set(theme === 'dark')
  const native = Platform.is.capacitor
  for (const flag of A11Y_FLAGS) {
    const [name, value] = A11Y_ATTR[flag]
    if (a11y[flag] && !native) root.dataset[name] = value
    else delete root.dataset[name]
  }
}

export function initAppearance() {
  media = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  media?.addEventListener?.('change', () => {
    if (state.theme === 'system') apply()
  })
  apply()
  watch(
    () => ({ ...state }),
    value => {
      writeJson('tampilan', value)
      apply()
    }
  )
  watch(
    () => ({ ...a11y }),
    value => {
      writeJson('aksesibilitas', value)
      apply()
    }
  )
}

/** Mengembalikan semua pilihan tampilan dan aksesibilitas ke bawaan. */
export function resetAppearance() {
  state.theme = 'system'
  state.text = 'normal'
  for (const flag of A11Y_FLAGS) a11y[flag] = false
}

/** Apakah ada pilihan yang berbeda dari bawaan (untuk keadaan tombol Atur ulang). */
export function isAppearanceChanged() {
  return (
    state.theme !== 'system' ||
    state.text !== 'normal' ||
    A11Y_FLAGS.some(flag => a11y[flag])
  )
}

export function useAppearance() {
  return {
    state,
    a11y,
    setTheme(v) {
      if (THEMES.includes(v)) state.theme = v
    },
    setText(v) {
      if (TEXT_SIZES.includes(v)) state.text = v
    },
    setA11y(flag, value) {
      if (A11Y_FLAGS.includes(flag)) a11y[flag] = value === true
    },
    toggleA11y(flag) {
      if (A11Y_FLAGS.includes(flag)) a11y[flag] = !a11y[flag]
    },
    reset: resetAppearance,
    // Tombol cepat di header: beralih antara terang dan gelap.
    toggleTheme() {
      state.theme = resolvedTheme() === 'dark' ? 'light' : 'dark'
    }
  }
}
