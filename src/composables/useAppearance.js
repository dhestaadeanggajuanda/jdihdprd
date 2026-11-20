// Tema (sistem, terang, gelap) dan ukuran teks. Disimpan di perangkat dan
// diterapkan ke <html> sebelum aplikasi tampil agar tidak berkedip.
import { reactive, watch } from 'vue'
import { Dark } from 'quasar'
import { readJson, writeJson } from '@/utils/storage.js'

export const THEMES = ['system', 'light', 'dark']
export const TEXT_SIZES = ['normal', 'large', 'xlarge']

const saved = readJson('tampilan', {})
const state = reactive({
  theme: THEMES.includes(saved.theme) ? saved.theme : 'system',
  text: TEXT_SIZES.includes(saved.text) ? saved.text : 'normal'
})

let media = null

function resolvedTheme() {
  if (state.theme !== 'system') return state.theme
  return media?.matches ? 'dark' : 'light'
}

function apply() {
  const root = document.documentElement
  const theme = resolvedTheme()
  root.dataset.theme = theme
  root.dataset.text = state.text
  Dark.set(theme === 'dark')
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
}

export function useAppearance() {
  return {
    state,
    setTheme(v) {
      if (THEMES.includes(v)) state.theme = v
    },
    setText(v) {
      if (TEXT_SIZES.includes(v)) state.text = v
    },
    // Tombol cepat di header: beralih antara terang dan gelap.
    toggleTheme() {
      state.theme = resolvedTheme() === 'dark' ? 'light' : 'dark'
    }
  }
}
