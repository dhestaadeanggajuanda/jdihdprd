// Karakter kendali (C0, DEL) ditangani lewat kode karakter, bukan regex.

const isControl = code => code < 0x20 || code === 0x7f

export function hasControl(s) {
  for (let i = 0; i < s.length; i++) if (isControl(s.charCodeAt(i))) return true
  return false
}

// Mengganti karakter kendali. Tab dan baris baru dipertahankan bila keep=true.
export function stripControl(
  s,
  replacement = '',
  { keepWhitespace = false } = {}
) {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    const ws = code === 0x09 || code === 0x0a || code === 0x0d
    out += isControl(code) && !(keepWhitespace && ws) ? replacement : s[i]
  }
  return out
}
