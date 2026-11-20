import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'

// Status koneksi bersama. navigator.onLine hanya petunjuk: dipakai untuk
// memilih pesan galat, bukan untuk memutuskan apakah permintaan dikirim.
const online = ref(globalThis.navigator?.onLine ?? true)
let listening = false

function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('online', () => (online.value = true))
  window.addEventListener('offline', () => (online.value = false))
}

export function useOnline() {
  listen()
  if (getCurrentInstance()) onBeforeUnmount(() => {})
  return { online }
}
