// Baris database -> objek API (kontrak: docs/api/openapi.yaml). Skema respons di
// schemas.js bertindak sebagai allowlist kolom: apa pun di luar itu tidak keluar.
import { ID_TIPE, TIPE_NAMA } from './sql.js'
import {
  cleanText,
  dateOnly,
  stripSubjectPrefix,
  tidyTitle,
  titleCase,
  toInt
} from './util.js'
import { isRestricted, resolveLampiran } from './files.js'

export function jenisNama(row) {
  const raw = cleanText(row.jenis_peraturan)
  return raw ? titleCase(raw) : (TIPE_NAMA[row.tipe_dokumen] ?? 'Dokumen')
}

export const nomorTahun = (r, jenis = jenisNama(r)) => {
  const nomor = cleanText(r.nomor_peraturan)
  const tahun = r.tahun_calc ? toInt(r.tahun_calc) : null
  return nomor && tahun ? `${jenis} Nomor ${nomor} Tahun ${tahun}` : jenis
}

const REL_TEKS = {
  dicabut: 'Dicabut oleh',
  diubah: 'Diubah oleh',
  mencabut: 'Mencabut',
  mengubah: 'Mengubah'
}
const REL_URUT = ['dicabut', 'diubah', 'mencabut', 'mengubah']

function relasiRingkas(rows, targets) {
  const out = []
  for (const jenis of REL_URUT) {
    for (const rel of rows.filter(r => r.jenis === jenis)) {
      const t = targets.get(rel.targetId)
      if (t) out.push(`${REL_TEKS[jenis]} ${nomorTahun(t)}`)
    }
  }
  return out.length > 0 ? out.slice(0, 2).join('; ') : null
}

function berkasUtama(lampiran, redirectHosts) {
  const usable = (lampiran ?? []).find(
    l =>
      !isRestricted(l.akses_lampiran, l.pembatasan_lampiran) &&
      resolveLampiran(l.url_lampiran, redirectHosts)
  )
  return usable ? { lampiran_id: String(usable.id), ukuran: null } : null
}

export function toRingkas(row, ctx) {
  const jenis = jenisNama(row)
  const singkatan = cleanText(row.singkatan_jenis)
  const rels = ctx.relasi?.byDoc.get(row.id) ?? []
  return {
    id: String(row.id),
    tipe: ID_TIPE[row.tipe_dokumen],
    jenis,
    // Singkatan yang sama panjang dengan nama jenis tidak berguna sebagai singkatan.
    singkatan:
      singkatan &&
      singkatan.length <= 14 &&
      singkatan.toLowerCase() !== jenis.toLowerCase()
        ? titleCase(singkatan)
        : null,
    nomor: cleanText(row.nomor_peraturan),
    tahun: row.tahun_calc ? toInt(row.tahun_calc) : null,
    judul: stripSubjectPrefix(tidyTitle(row.judul)),
    status: row.status_calc ?? null,
    diubah: Boolean(toInt(row.diubah_calc)),
    riwayat: ctx.relasi ? relasiRingkas(rels, ctx.relasi.targets) : null,
    tanggal_penetapan: dateOnly(row.tanggal_penetapan),
    pemrakarsa: cleanText(row.pemrakarsa),
    berkas: berkasUtama(ctx.lampiran?.get(row.id), ctx.redirectHosts)
  }
}

const refItem = t => {
  const r = toRingkas(t, { relasi: null, lampiran: null, redirectHosts: [] })
  return {
    id: r.id,
    jenis: r.jenis,
    nomor: r.nomor,
    tahun: r.tahun,
    judul: r.judul,
    status: r.status
  }
}

export function toDetail(row, ctx) {
  const base = toRingkas(row, ctx)
  const rels = ctx.relasi.byDoc.get(row.id) ?? []
  const by = jenis =>
    rels
      .filter(r => r.jenis === jenis)
      .map(r => ctx.relasi.targets.get(r.targetId))
      .filter(Boolean)
      .map(t => refItem(t))

  const mencabut = by('mencabut')
  const dicabutOleh = by('dicabut')
  const mengubah = by('mengubah')
  const diubahOleh = by('diubah')
  const peraturan = row.tipe_dokumen === 1
  const nama = nomorTahun(row)

  // Linimasa dari yang terbaru. Tanggal peristiwa relasi = tanggal_perubahan, bila kosong tanggal penetapan sasaran.
  const riwayat = []
  for (const jenis of ['dicabut', 'diubah']) {
    for (const rel of rels.filter(r => r.jenis === jenis)) {
      const t = ctx.relasi.targets.get(rel.targetId)
      if (!t) continue
      riwayat.push({
        tanggal: dateOnly(rel.tanggal) ?? dateOnly(t.tanggal_penetapan),
        keterangan: `${REL_TEKS[jenis]} ${nomorTahun(t)}`,
        saat_ini: false
      })
    }
  }
  riwayat.sort((a, b) =>
    String(b.tanggal ?? '').localeCompare(String(a.tanggal ?? ''))
  )
  if (peraturan) {
    if (dateOnly(row.tanggal_pengundangan)) {
      riwayat.push({
        tanggal: dateOnly(row.tanggal_pengundangan),
        keterangan: 'Diundangkan',
        saat_ini: false
      })
    }
    if (dateOnly(row.tanggal_penetapan)) {
      riwayat.push({
        tanggal: dateOnly(row.tanggal_penetapan),
        keterangan: 'Ditetapkan',
        saat_ini: false
      })
    }
  }
  if (riwayat.length > 0) riwayat[0].saat_ini = true

  let keterangan = null
  if (base.status === 'dicabut') {
    keterangan =
      dicabutOleh.length > 0
        ? `Tidak berlaku lagi karena dicabut oleh ${nomorTahun(ctx.relasi.targets.get(rels.find(r => r.jenis === 'dicabut').targetId))}.`
        : 'Tidak berlaku lagi.'
  } else if (base.status === 'berlaku' && diubahOleh.length > 0) {
    keterangan = `Masih berlaku dan telah diubah oleh ${nomorTahun(ctx.relasi.targets.get(rels.find(r => r.jenis === 'diubah').targetId))}. Baca keduanya bersama-sama.`
  } else if (base.status === 'berlaku') {
    keterangan = 'Masih berlaku.'
  }

  const sumber = cleanText(row.sumber)
  const kutipan = `${nama}${base.judul ? ` tentang ${base.judul}` : ''}${sumber ? ` (${sumber})` : ''}`

  const lampiran = (ctx.lampiran.get(row.id) ?? [])
    .filter(
      l =>
        !isRestricted(l.akses_lampiran, l.pembatasan_lampiran) &&
        resolveLampiran(l.url_lampiran, ctx.redirectHosts)
    )
    .map((l, i) => ({
      id: String(l.id),
      nama: cleanText(l.judul_lampiran) ?? `Lampiran ${i + 1}`,
      ukuran: null,
      peran: /abstrak/i.test(l.judul_lampiran ?? '')
        ? 'abstrak'
        : i === 0
          ? 'utama'
          : 'lampiran'
    }))

  return {
    ...base,
    riwayat: base.riwayat ?? cleanText(row.catatan_status_peraturan) ?? null,
    tanggal_pengundangan: dateOnly(row.tanggal_pengundangan),
    tempat_terbit: cleanText(row.tempat_terbit),
    bahasa: cleanText(row.bahasa),
    sumber,
    bidang_hukum: cleanText(row.bidang_hukum),
    dilihat: toInt(row.hit_see),
    diunduh: toInt(row.hit_download),
    kutipan,
    status_keterangan: keterangan,
    riwayat_status: riwayat.slice(0, 20),
    relasi: {
      mencabut,
      dicabut_oleh: dicabutOleh,
      mengubah,
      diubah_oleh: diubahOleh
    },
    teu: ctx.pengarang.map(p => ({ nama: p.nama, jenis: p.jenis ?? 'Badan' })),
    subjek: ctx.subyek,
    lampiran
  }
}
