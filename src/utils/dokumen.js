// Label tampilan dokumen yang diturunkan dari data terstruktur.

export function judulNomor(d) {
  if (d.nomor && d.tahun) return `${d.jenis} Nomor ${d.nomor} Tahun ${d.tahun}`
  if (d.tahun) return `${d.jenis} Tahun ${d.tahun}`
  return d.jenis
}

export function judulPendek(d) {
  const abbr = d.singkatan || d.jenis
  if (d.nomor && d.tahun) return `${abbr} ${d.nomor}/${d.tahun}`
  return abbr
}

// Teks untuk pembaca layar dan judul tab: gabungan nomor dan judul.
export function judulLengkap(d) {
  const head = judulNomor(d)
  return d.judul ? `${head} tentang ${d.judul}` : head
}

// Status ditampilkan dengan ikon + teks, tidak hanya warna.
export function statusBadges(d) {
  const out = []
  if (d.status === 'berlaku') {
    out.push({
      key: 'berlaku',
      tone: 'ok',
      icon: 'check-circle',
      label: 'Berlaku'
    })
  } else if (d.status === 'dicabut') {
    out.push({
      key: 'dicabut',
      tone: 'bad',
      icon: 'x-circle',
      label: 'Dicabut'
    })
  }
  if (d.status === 'berlaku' && d.diubah) {
    out.push({ key: 'diubah', tone: 'warn', icon: 'edit', label: 'Diubah' })
  }
  return out
}
