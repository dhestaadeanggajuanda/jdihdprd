// Ekspresi SQL bersama. Semua tabel diberi alias `d` (document).
//
// Konvensi data (dari skema dan data contoh JDIH; perlu diverifikasi dengan data nyata):
//  - tipe_dokumen: 1 peraturan, 2 monografi, 3 artikel/majalah, 4 putusan
//  - terbit di publik bila is_publish = 1 dan sembunyikan_di_opac bukan "Ya"/"1"
//  - jenis = teks document.jenis_peraturan (kode = slug ASCII dari teks itu)
//  - status keberlakuan hanya untuk peraturan; "dicabut" bila document.status menyatakan
//    tidak berlaku ATAU ada relasi "dicabut" pada data_status
//  - penghitung dilihat/diunduh = document.hit_see / hit_download (hanya dibaca)

export const TIPE_ID = Object.freeze({
  peraturan: 1,
  monografi: 2,
  artikel: 3,
  putusan: 4
})
export const ID_TIPE = Object.freeze({
  1: 'peraturan',
  2: 'monografi',
  3: 'artikel',
  4: 'putusan'
})
export const TIPE_NAMA = Object.freeze({
  1: 'Peraturan',
  2: 'Monografi',
  3: 'Artikel',
  4: 'Putusan'
})

const publishedOf = a =>
  `${a}.is_publish = 1 AND COALESCE(LOWER(TRIM(${a}.sembunyikan_di_opac)), '') NOT IN ('ya', '1', 'y', 'true') AND ${a}.tipe_dokumen IN (1, 2, 3, 4)`

export const PUBLISHED = publishedOf('d')

// Kode jenis: sama persis dengan slugify() di util.js (ASCII).
export const JENIS_KODE =
  "TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(TRIM(d.jenis_peraturan), '[^A-Za-z0-9]+', '-')))"

export const TAHUN =
  "COALESCE(NULLIF(CAST(REGEXP_SUBSTR(d.tahun_terbit, '[0-9]{4}') AS UNSIGNED), 0), YEAR(d.tanggal_penetapan))"

// Relasi hanya dihitung bila dokumen sasarannya terbit (id_dokumen_target bisa berisi daftar dipisah koma):
// relasi ke draf atau dokumen tersembunyi tidak boleh memengaruhi apa pun yang tampil di publik.
const relasi = jenis => `EXISTS (SELECT 1 FROM data_status s JOIN document t
    ON FIND_IN_SET(t.id, REPLACE(s.id_dokumen_target, ' ', '')) > 0 AND ${publishedOf('t')}
  WHERE s.id_dokumen = d.id AND LOWER(TRIM(s.status_peraturan)) = '${jenis}')`

export const STATUS_EXPR = `(CASE
  WHEN d.tipe_dokumen <> 1 THEN NULL
  WHEN LOWER(TRIM(d.status)) IN ('tidak berlaku', 'dicabut', 'tidak memiliki daya guna') THEN 'dicabut'
  WHEN ${relasi('dicabut')} THEN 'dicabut'
  ELSE 'berlaku' END)`

export const DIUBAH_EXPR = `(d.tipe_dokumen = 1 AND ${relasi('diubah')})`

export const PROMOSI =
  "COALESCE(LOWER(TRIM(d.promosikan_ke_beranda)), 'ya') NOT IN ('tidak', '0', 'n', 'false')"

export const ORDER = Object.freeze({
  terbaru: 'COALESCE(d.tanggal_penetapan, DATE(d.created_at)) DESC, d.id DESC',
  nomor: `${TAHUN} DESC, CAST(REGEXP_SUBSTR(d.nomor_peraturan, '[0-9]+') AS UNSIGNED) DESC, d.id DESC`,
  populer: 'COALESCE(d.hit_see, 0) DESC, d.id DESC'
})

// Kolom ringkas yang dipilih untuk daftar.
export const LIST_COLUMNS = `d.id, d.tipe_dokumen, d.judul, d.nomor_peraturan, d.jenis_peraturan, d.singkatan_jenis,
  d.tanggal_penetapan, d.pemrakarsa, ${TAHUN} AS tahun_calc, ${STATUS_EXPR} AS status_calc, ${DIUBAH_EXPR} AS diubah_calc`
