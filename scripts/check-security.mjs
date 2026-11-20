// Gerbang keamanan statis (OWASP A03/A05/A08): menolak pola berisiko pada
// kode klien. Jalankan: npm run lint:security. Keluar dengan kode 1 bila ada
// pelanggaran. Pengecualian ditulis eksplisit di ALLOW agar mudah ditinjau.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1'
)
const SCAN = ['src', 'index.html']
const EXT = /\.(js|mjs|vue|html)$/

// Pola yang dilarang di seluruh kode klien.
const FORBIDDEN = [
  {
    re: /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b/,
    why: 'menyisipkan HTML mentah ke DOM'
  },
  { re: /\bdocument\.write(ln)?\b/, why: 'document.write' },
  { re: /\beval\s*\(/, why: 'eval' },
  { re: /\bnew\s+Function\s*\(/, why: 'new Function' },
  {
    re: /\bset(Timeout|Interval)\s*\(\s*['"`]/,
    why: 'setTimeout/setInterval dengan string'
  },
  { re: /\bdangerouslySetInnerHTML\b/, why: 'HTML mentah' },
  {
    re: /\bpostMessage\s*\(\s*[^,]+,\s*['"]\*['"]/,
    why: 'postMessage ke semua origin'
  },
  {
    re: /(?<!https:\/\/www\.w3\.org\/2000\/svg["']?[^\n]*)\bhttp:\/\/(?!www\.w3\.org)/,
    why: 'URL http:// (wajib https)'
  },
  {
    re: /(api[_-]?key|secret|passw(or)?d|private[_-]?key|BEGIN [A-Z ]*PRIVATE KEY)\s*[:=]\s*['"][^'"]{6,}/i,
    why: 'dugaan rahasia di kode klien'
  }
]

// Pola yang hanya boleh ada pada berkas tertentu (jalur relatif, pemisah /).
const ALLOW = [
  {
    re: /\bv-html\b/,
    only: ['src/components/SafeHtml.vue'],
    why: 'v-html hanya di SafeHtml.vue (konten sudah dibersihkan DOMPurify)'
  },
  {
    re: /\bfetch\s*\(/,
    only: ['src/services/http.js'],
    why: 'fetch hanya lewat services/http.js'
  },
  {
    re: /\b(localStorage|sessionStorage|indexedDB)\b/,
    only: ['src/utils/storage.js'],
    why: 'penyimpanan hanya lewat utils/storage.js'
  },
  {
    re: /\bwindow\.open\s*\(/,
    only: ['src/utils/open.js'],
    why: 'window.open hanya lewat utils/open.js'
  }
]

function walk(path, out = []) {
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) walk(join(path, name), out)
  } else if (EXT.test(path)) {
    out.push(path)
  }
  return out
}

const files = SCAN.flatMap(p => walk(join(ROOT, p)))
const violations = []

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/')
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')

  lines.forEach((line, i) => {
    // Komentar baris penuh tidak dihitung.
    const code = line.replace(/^\s*(\/\/|\*|<!--).*/, '')
    for (const rule of FORBIDDEN) {
      if (rule.re.test(code))
        violations.push(`${rel}:${i + 1}  ${rule.why}\n    ${line.trim()}`)
    }
    for (const rule of ALLOW) {
      if (rule.re.test(code) && !rule.only.includes(rel)) {
        violations.push(`${rel}:${i + 1}  ${rule.why}\n    ${line.trim()}`)
      }
    }
  })

  // Tautan target=_blank wajib memuat rel="noopener noreferrer".
  for (const m of text.matchAll(/<(a|router-link)\b[^>]*?>/gs)) {
    const tag = m[0]
    if (
      /target\s*=\s*["']_blank["']/.test(tag) &&
      !/rel\s*=\s*["'][^"']*noopener[^"']*["']/.test(tag)
    ) {
      const line = text.slice(0, m.index).split('\n').length
      violations.push(
        `${rel}:${line}  target="_blank" tanpa rel="noopener noreferrer"`
      )
    }
  }
}

if (violations.length > 0) {
  console.error(`Gerbang keamanan GAGAL (${violations.length} pelanggaran):\n`)
  for (const v of violations) console.error(`- ${v}`)
  process.exit(1)
}
console.log(
  `Gerbang keamanan lulus: ${files.length} berkas diperiksa, tidak ada pelanggaran.`
)
