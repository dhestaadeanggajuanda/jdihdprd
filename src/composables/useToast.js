// Pesan singkat (snackbar). Dibaca pembaca layar lewat wilayah aria-live di AppToast.
import { reactive } from 'vue'

const state = reactive({ message: '', key: 0 })
let timer = null

export function useToast() {
  return {
    state,
    show(message, ms = 3500) {
      clearTimeout(timer)
      state.message = message
      state.key += 1
      timer = setTimeout(() => (state.message = ''), ms)
    }
  }
}
