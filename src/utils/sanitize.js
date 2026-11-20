// Pembersih HTML untuk isi halaman dari backend (OWASP A03). Allowlist ketat:
// tanpa skrip, gaya, bingkai, gambar, formulir, atribut event, atau atribut data.
// Tautan hanya https, mailto, dan tel; tautan https dibuka di tab baru dengan
// rel="noopener noreferrer".
import createDOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'a',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'small',
  'sup',
  'sub',
  'span',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'caption'
]
const ALLOWED_ATTR = ['href', 'title', 'colspan', 'rowspan', 'scope']
const ALLOWED_URI = /^(?:https:|mailto:|tel:)/i

let purifier = null

function instance() {
  if (purifier) return purifier
  purifier = createDOMPurify(window)
  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      if (/^https:/i.test(node.getAttribute('href'))) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })
  return purifier
}

// Halaman sudah punya <h1> sendiri (judul dari API): <h1> di dalam isi diturunkan
// menjadi <h2> agar struktur judul tetap benar. Dilakukan pada keluaran yang
// SUDAH dibersihkan: serialisasi DOMPurify kanonik (tag huruf kecil, teks yang
// menyerupai tag sudah di-escape), jadi penggantian ini tidak bisa membuat tag
// baru dari teks.
const demoteH1 = clean => clean.replace(/<(\/?)h1(?=[\s>])/gi, '<$1h2')

export function sanitizeHtml(html) {
  if (typeof html !== 'string' || html === '') return ''
  const clean = instance().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ALLOWED_URI,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  })
  return demoteH1(String(clean))
}
