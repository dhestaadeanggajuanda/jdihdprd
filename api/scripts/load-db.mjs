// Memuat skema + data uji ke database, dan (opsional) membuat akun SELECT-only.
//   ADMIN_DB_URL=mysql://root@127.0.0.1:3307/jdih_test node scripts/load-db.mjs [--fresh] [--grants]
//   --fresh   DROP lalu CREATE database
//   Semua opsi hanya diterima untuk database uji (nama memuat test/tmp/dev): skrip
//   ini memuat data sintetis dan tidak boleh diarahkan ke database produksi.
//   --grants  buat akun baca-saja dari db/grants.sql (DB_RO_USER, DB_RO_PASSWORD, DB_RO_HOST)
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'

const url = process.env.ADMIN_DB_URL
if (!url) {
  console.error('Isi ADMIN_DB_URL (mysql://akun-admin@host:port/nama_db)')
  process.exit(2)
}
const u = new URL(url)
const dbName = decodeURIComponent(u.pathname.slice(1))
if (!/^[A-Za-z0-9_]{1,64}$/.test(dbName))
  throw new Error('nama database tidak valid')
const fresh = process.argv.includes('--fresh')
const grants = process.argv.includes('--grants')
// Skrip ini menyuntikkan DATA SINTETIS (db/seed.sql). Tolak database yang bukan
// database uji, apa pun opsinya, agar tidak pernah tercampur dengan data produksi.
if (!/test|tmp|dev/i.test(dbName))
  throw new Error(
    'skrip ini hanya untuk database uji (nama harus memuat test/tmp/dev)'
  )

const root = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  multipleStatements: true,
  charset: 'utf8mb4'
})
if (fresh) await root.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
await root.query(
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`
)
await root.query(`USE \`${dbName}\``)

const here = new URL('../db/', import.meta.url)
await root.query(await readFile(new URL('schema.sql', here), 'utf8'))
await root.query(await readFile(new URL('seed.sql', here), 'utf8'))
console.log(`skema dan data uji dimuat ke ${dbName}`)

if (grants) {
  const user = process.env.DB_RO_USER ?? 'jdih_ro'
  const password = process.env.DB_RO_PASSWORD
  const host = process.env.DB_RO_HOST ?? '%'
  if (!password) throw new Error('DB_RO_PASSWORD wajib untuk --grants')
  for (const [k, v] of [
    ['user', user],
    ['host', host],
    ['password', password]
  ]) {
    if (!/^[A-Za-z0-9_.%-]{1,64}$/.test(v) && k !== 'password')
      throw new Error(`${k} tidak valid`)
  }
  if (/['\\`]/.test(password))
    throw new Error('password tidak boleh memuat tanda kutip atau backslash')
  const tpl = (await readFile(new URL('grants.sql', here), 'utf8'))
    .replaceAll('{{DB}}', dbName)
    .replaceAll('{{USER}}', user)
    .replaceAll('{{HOST}}', host)
    .replaceAll('{{PASSWORD}}', password)
  await root.query(tpl)
  console.log(`akun baca-saja ${user}@${host} dibuat`)
}
await root.end()
