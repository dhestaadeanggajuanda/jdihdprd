// Akses data (hanya SELECT). Setiap nilai dari klien masuk lewat parameter `?`;
// satu-satunya nilai yang disisipkan ke teks SQL adalah bilangan bulat yang
// sudah divalidasi (LIMIT/OFFSET dan daftar ID).
import {
  PUBLISHED,
  TIPE_ID,
  STATUS_EXPR,
  DIUBAH_EXPR,
  PROMOSI,
  ORDER,
  LIST_COLUMNS,
  JENIS_KODE,
  TAHUN
} from './sql.js'
import { likeEscape, parseIdList, toInt } from './util.js'

const ints = ids => {
  const clean = [...new Set(ids)].filter(
    n => Number.isInteger(n) && n > 0 && n < 2_147_483_647
  )
  return clean.length > 0 ? clean : [0]
}
const marks = n => Array.from({ length: n }, () => '?').join(',')

function filterSql(f) {
  const where = [PUBLISHED]
  const p = []
  if (f.tipe) {
    where.push('d.tipe_dokumen = ?')
    p.push(TIPE_ID[f.tipe])
  }
  if (f.jenis) {
    where.push(`${JENIS_KODE} = ?`)
    p.push(f.jenis)
  }
  if (f.status) {
    where.push(`${STATUS_EXPR} = ?`)
    p.push(f.status)
  }
  if (f.diubah) where.push(DIUBAH_EXPR)
  if (f.nomor) {
    where.push('TRIM(d.nomor_peraturan) = ?')
    p.push(f.nomor)
  }
  if (f.tahun_dari) {
    where.push(`${TAHUN} >= ?`)
    p.push(f.tahun_dari)
  }
  if (f.tahun_sampai) {
    where.push(`${TAHUN} <= ?`)
    p.push(f.tahun_sampai)
  }
  if (f.subyek) {
    where.push(
      "EXISTS (SELECT 1 FROM data_subyek sb WHERE sb.id_dokumen = d.id AND sb.subyek LIKE ? ESCAPE '|')"
    )
    p.push(`%${likeEscape(f.subyek)}%`)
  }
  if (f.puuTypeId) {
    where.push('d.dokumen_type_id = ?')
    p.push(f.puuTypeId)
  }
  if (f.q) {
    const nt = /^(\d{1,4})\s*[/\s]\s*(\d{4})$/.exec(f.q.trim())
    if (nt) {
      where.push(`TRIM(d.nomor_peraturan) = ? AND ${TAHUN} = ?`)
      p.push(String(Number(nt[1])), Number(nt[2]))
    } else {
      for (const word of f.q.split(/\s+/).filter(Boolean).slice(0, 6)) {
        where.push(
          "CONCAT_WS(' ', d.jenis_peraturan, d.singkatan_jenis, d.nomor_peraturan, d.tahun_terbit, d.judul, d.teu) LIKE ? ESCAPE '|'"
        )
        p.push(`%${likeEscape(word)}%`)
      }
    }
  }
  return { where: where.join(' AND '), params: p }
}

export async function listDokumen(
  db,
  f,
  { page, perPage, sort = 'terbaru', onlyPromoted = false }
) {
  const { where, params } = filterSql(f)
  const extra = onlyPromoted ? ` AND ${PROMOSI}` : ''
  const total = toInt(
    (
      await db.query(
        `SELECT COUNT(*) AS n FROM document d WHERE ${where}${extra}`,
        params
      )
    )[0].n
  )
  const limit = toInt(perPage, 10)
  const offset = (toInt(page, 1) - 1) * limit
  const rows = await db.query(
    `SELECT ${LIST_COLUMNS} FROM document d WHERE ${where}${extra} ORDER BY ${ORDER[sort] ?? ORDER.terbaru} LIMIT ${limit} OFFSET ${offset}`,
    params
  )
  return { rows, total }
}

export async function getDokumenRow(db, id) {
  const rows = await db.query(
    `SELECT ${LIST_COLUMNS}, d.tanggal_pengundangan, d.tempat_terbit, d.bahasa, d.sumber, d.bidang_hukum, d.teu,
            d.hit_see, d.hit_download, d.abstrak, d.catatan_status_peraturan
       FROM document d WHERE ${PUBLISHED} AND d.id = ? LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function loadLampiran(db, docIds) {
  const ids = ints(docIds)
  const rows = await db.query(
    `SELECT l.id, l.id_dokumen, l.judul_lampiran, l.url_lampiran, l.akses_lampiran, l.pembatasan_lampiran
       FROM data_lampiran l
      WHERE l.id_dokumen IN (${marks(ids.length)}) AND COALESCE(l.status, 1) = 1
      ORDER BY l.id_dokumen, COALESCE(l.urutan, 9999), l.id`,
    ids
  )
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.id_dokumen)) map.set(r.id_dokumen, [])
    map.get(r.id_dokumen).push(r)
  }
  return map
}

export async function getLampiran(db, docId, lampiranId) {
  const rows = await db.query(
    `SELECT l.id, l.url_lampiran, l.judul_lampiran, l.akses_lampiran, l.pembatasan_lampiran
       FROM data_lampiran l JOIN document d ON d.id = l.id_dokumen
      WHERE l.id = ? AND l.id_dokumen = ? AND COALESCE(l.status, 1) = 1 AND ${PUBLISHED} LIMIT 1`,
    [lampiranId, docId]
  )
  return rows[0] ?? null
}

// Relasi antar peraturan: { docId -> [{ jenis, targetId, catatan, tanggal }] } dan dokumen sasarannya.
export async function loadRelasi(db, docIds) {
  const ids = ints(docIds)
  const rels = await db.query(
    `SELECT s.id_dokumen, LOWER(TRIM(s.status_peraturan)) AS jenis, s.id_dokumen_target, s.catatan_status_peraturan, s.tanggal_perubahan
       FROM data_status s
      WHERE s.id_dokumen IN (${marks(ids.length)})
        AND LOWER(TRIM(s.status_peraturan)) IN ('mencabut', 'dicabut', 'mengubah', 'diubah')
      ORDER BY s.id_dokumen, s.urutan, s.id`,
    ids
  )
  const byDoc = new Map()
  const targetIds = new Set()
  const seen = new Set()
  for (const r of rels) {
    for (const t of parseIdList(r.id_dokumen_target)) {
      const key = `${r.id_dokumen}:${r.jenis}:${t}`
      if (seen.has(key) || t === r.id_dokumen) continue
      seen.add(key)
      targetIds.add(t)
      if (!byDoc.has(r.id_dokumen)) byDoc.set(r.id_dokumen, [])
      byDoc.get(r.id_dokumen).push({
        jenis: r.jenis,
        targetId: t,
        catatan: r.catatan_status_peraturan,
        tanggal: r.tanggal_perubahan
      })
    }
  }
  const targets = new Map()
  if (targetIds.size > 0) {
    const tid = ints([...targetIds])
    const rows = await db.query(
      `SELECT ${LIST_COLUMNS} FROM document d WHERE ${PUBLISHED} AND d.id IN (${marks(tid.length)})`,
      tid
    )
    for (const r of rows) targets.set(r.id, r)
  }
  return { byDoc, targets }
}

export async function loadSubyek(db, docId) {
  const rows = await db.query(
    'SELECT DISTINCT subyek FROM data_subyek WHERE id_dokumen = ? ORDER BY subyek LIMIT 30',
    [docId]
  )
  return rows.map(r => r.subyek)
}

export async function loadPengarang(db, docId) {
  return db.query(
    `SELECT p.name AS nama, COALESCE(NULLIF(tp.name, ''), NULLIF(jp.name, '')) AS jenis
       FROM data_pengarang dp
       LEFT JOIN pengarang p ON p.id = dp.nama_pengarang
       LEFT JOIN tipe_pengarang tp ON tp.id = dp.tipe_pengarang
       LEFT JOIN jenis_pengarang jp ON jp.id = dp.jenis_pengarang
      WHERE dp.id_dokumen = ? AND p.name IS NOT NULL LIMIT 30`,
    [docId]
  )
}

export async function referensiJenis(db) {
  return db.query(
    `SELECT ${JENIS_KODE} AS kode, MIN(TRIM(d.jenis_peraturan)) AS nama, COUNT(*) AS jumlah
       FROM document d
      WHERE ${PUBLISHED} AND d.tipe_dokumen = 1 AND NULLIF(NULLIF(TRIM(d.jenis_peraturan), ''), '-') IS NOT NULL
      GROUP BY kode HAVING kode <> '' ORDER BY jumlah DESC, nama LIMIT 120`
  )
}

export async function puuKategori(db) {
  return db.query(
    `SELECT t.id, t.slug AS kode, t.name AS nama,
            (SELECT COUNT(*) FROM document d WHERE ${PUBLISHED} AND d.dokumen_type_id = t.id) AS jumlah
       FROM document_type t
      WHERE t.document_group_label = 'legislation_formation' AND t.slug IS NOT NULL AND t.slug <> ''
      ORDER BY t.id`
  )
}

export async function koleksi(db) {
  return db.query(
    `SELECT d.tipe_dokumen AS tipe, COUNT(*) AS jumlah,
            SUM(${STATUS_EXPR} = 'berlaku') AS berlaku, SUM(${STATUS_EXPR} = 'dicabut') AS dicabut
       FROM document d WHERE ${PUBLISHED} GROUP BY d.tipe_dokumen`
  )
}

export async function statistik(db, tahunBerjalan) {
  const [tipe, status, jenis, tahun, hit] = await Promise.all([
    koleksi(db),
    db.query(
      `SELECT SUM(${STATUS_EXPR} = 'berlaku' AND NOT ${DIUBAH_EXPR}) AS berlaku,
              SUM(${STATUS_EXPR} = 'berlaku' AND ${DIUBAH_EXPR}) AS berlaku_diubah,
              SUM(${STATUS_EXPR} = 'dicabut') AS dicabut
         FROM document d WHERE ${PUBLISHED} AND d.tipe_dokumen = 1`
    ),
    db.query(
      `SELECT MIN(TRIM(d.jenis_peraturan)) AS nama, COUNT(*) AS jumlah
         FROM document d
        WHERE ${PUBLISHED} AND d.tipe_dokumen = 1 AND NULLIF(NULLIF(TRIM(d.jenis_peraturan), ''), '-') IS NOT NULL
        GROUP BY ${JENIS_KODE} ORDER BY jumlah DESC, nama LIMIT 12`
    ),
    db.query(
      `SELECT ${TAHUN} AS tahun, COUNT(*) AS jumlah
         FROM document d WHERE ${PUBLISHED} AND ${TAHUN} BETWEEN ? AND ? GROUP BY tahun ORDER BY tahun`,
      [tahunBerjalan - 10, tahunBerjalan]
    ),
    db.query(
      `SELECT (SELECT COUNT(*) FROM hit_counter WHERE _created_time >= (UTC_TIMESTAMP() - INTERVAL 30 DAY)) AS dilihat,
              (SELECT COUNT(*) FROM download_counter WHERE _created_time >= (UTC_TIMESTAMP() - INTERVAL 30 DAY)) AS diunduh`
    )
  ])
  return { tipe, status: status[0] ?? {}, jenis, tahun, hit: hit[0] ?? {} }
}

export async function configValues(db, keys) {
  const rows = await db.query(
    `SELECT nama_konfig, isi_konfig FROM frontend_config WHERE nama_konfig IN (${marks(keys.length)})`,
    keys
  )
  return new Map(rows.map(r => [r.nama_konfig, r.isi_konfig]))
}
