// Keadaan buka/tutup panel aksesibilitas, dibagi antara widget (tombol kiri bawah),
// tombol "Pengaturan tampilan" di footer, dan baris di Profil. Pemicu mencatat
// dirinya agar fokus kembali ke sana saat panel ditutup (WCAG 2.4.3).
import { ref } from 'vue'

const open = ref(false)
let opener = null
let fallback = null

// `offsetParent` bernilai null untuk elemen `position: fixed`, jadi keterlihatan
// diukur lewat kotak tata letaknya.
const visible = el => el?.isConnected === true && el.getClientRects().length > 0

export function useA11yPanel() {
  return {
    open,
    // Tombol widget mendaftarkan dirinya sebagai tujuan fokus bila pemicu lain
    // (mis. baris di Profil) sudah tidak ada.
    registerTrigger(el) {
      fallback = el instanceof HTMLElement ? el : null
    },
    show(trigger = null) {
      opener = trigger instanceof HTMLElement ? trigger : null
      open.value = true
    },
    // `returnFocus=false`: ditutup karena fokus keluar sendiri, jangan merebutnya.
    hide({ returnFocus = true } = {}) {
      open.value = false
      const target = visible(opener) ? opener : fallback
      opener = null
      if (returnFocus && visible(target)) target.focus()
    }
  }
}
