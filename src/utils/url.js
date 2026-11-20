// Tautan keluar dan URL gambar: allowlist ketat (OWASP A10 SSRF/redirect, A03).
// Hanya https, tanpa userinfo, tanpa port selain bawaan, tanpa punycode, tanpa
// titik di akhir host, dan host harus sama persis dengan salah satu entri.

import { hasControl } from './chars.js'

export function safeExternalUrl(input, allowedHosts) {
  if (typeof input !== 'string' || input.length === 0 || input.length > 2048) {
    return null
  }
  const trimmed = input.trim()
  if (hasControl(trimmed) || trimmed.includes('\\')) return null
  // Skema harus ditulis eksplisit. Tolak "//host" dan jalur relatif.
  if (!/^https:\/\//i.test(trimmed)) return null

  let url
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (url.port && url.port !== '443') return null

  const host = url.hostname.toLowerCase()
  if (host.endsWith('.')) return null
  if (host.split('.').some(label => label.startsWith('xn--'))) return null
  if (!allowedHosts.map(h => h.toLowerCase()).includes(host)) return null

  return url.href
}

export const safeImageUrl = safeExternalUrl
