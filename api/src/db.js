// Kolam koneksi MySQL. Semua kueri memakai pernyataan terparameter (execute);
// akun database harus SELECT-only (lihat db/grants.sql).
import mysql from 'mysql2/promise'

export function createDb(
  url,
  { connectionLimit = 10, queryTimeoutMs = 8000 } = {}
) {
  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 100,
    charset: 'utf8mb4',
    timezone: 'Z',
    // DATE/DATETIME tetap string "YYYY-MM-DD ...": tanpa konversi zona waktu.
    dateStrings: true,
    connectTimeout: 5000,
    multipleStatements: false
  })
  return {
    async query(sql, values = []) {
      const [rows] = await pool.execute({
        sql,
        values,
        timeout: queryTimeoutMs
      })
      return rows
    },
    async ping() {
      await pool.query('SELECT 1')
    },
    close: () => pool.end()
  }
}
