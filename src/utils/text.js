// Teks dari HTML tanpa pernah menyisipkan HTML ke DOM aktif.
// DOMParser membuat dokumen terpisah: skrip tidak berjalan dan gambar tidak
// diunduh. Hasilnya selalu string polos (textContent).

export function htmlToText(html) {
  if (typeof html !== 'string' || html === '') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  // Isi skrip dan gaya bukan teks bagi pembaca.
  doc
    .querySelectorAll('script,style,noscript,template')
    .forEach(n => n.remove())
  return (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

// Memotong di batas kata, menambah elipsis bila terpotong.
export function truncate(value, max = 200) {
  const s = String(value ?? '').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const space = cut.lastIndexOf(' ')
  const base = (space > max * 0.6 ? cut.slice(0, space) : cut).replace(
    /[\s,.;:–-]+$/,
    ''
  )
  return `${base}…`
}
