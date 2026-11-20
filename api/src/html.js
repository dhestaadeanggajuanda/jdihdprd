// Pembersihan HTML konten halaman di sisi server (pertahanan berlapis: klien juga
// membersihkan dengan DOMPurify sebelum menampilkan). Pemarsa sungguhan
// (sanitize-html), allowlist ketat; bukan regex.
import sanitizeHtml from 'sanitize-html'

const OPTIONS = {
  allowedTags: [
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
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan']
  },
  allowedSchemes: ['https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  // Isi skrip dan gaya dibuang beserta tag-nya (bukan dijadikan teks).
  nonTextTags: [
    'script',
    'style',
    'textarea',
    'option',
    'noscript',
    'template'
  ],
  // <h1> di dalam isi diturunkan menjadi <h2>: halaman sudah punya <h1> sendiri.
  transformTags: { h1: 'h2', h5: 'h4', h6: 'h4' },
  disallowedTagsMode: 'discard'
}

export const cleanHtml = html => sanitizeHtml(String(html ?? ''), OPTIONS)
