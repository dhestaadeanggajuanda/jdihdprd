// Fitur opsional yang menyala menurut .env. Kosong = elemennya tidak dirender
// sama sekali (bukan disembunyikan), termasuk butir terkait di naskah kebijakan.
import { Platform } from 'quasar'
import { ASISTEN_URL, WHATSAPP } from './env.js'

// Aplikasi Android memakai origin sendiri (https://localhost): permintaan POST ke
// layanan Asisten akan lintas origin dan butuh CORS di nginx. Sampai itu
// diputuskan, Asisten hanya di web; WhatsApp (tautan biasa) ada di keduanya.
export const ASISTEN_AKTIF = ASISTEN_URL !== '' && !Platform.is.capacitor
export const WHATSAPP_AKTIF = WHATSAPP !== ''
