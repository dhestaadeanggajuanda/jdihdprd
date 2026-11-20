// Format tampilan bahasa Indonesia. Dibuat manual (bukan Intl) agar hasilnya
// sama di semua peramban dan WebView.

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
]

export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  if (!m) return ''
  const month = BULAN[Number(m[2]) - 1]
  if (!month) return ''
  return `${Number(m[3])} ${month} ${m[1]}`
}

export function formatNumber(n) {
  if (!Number.isFinite(n)) return ''
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1000) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1).replace('.', ',')} MB`
}
