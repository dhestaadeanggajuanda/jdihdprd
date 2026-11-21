// Pembatas laju dan IP klien: X-Forwarded-For palsu tidak boleh menghindari batas.
// Tidak butuh database (database tiruan; yang dihitung hanya kode 429).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadConfig, parseTrustProxy } from '../src/config.js'
import { buildServer } from '../src/server.js'

const DB_URL = 'mysql://u:p@127.0.0.1:3306/x'
const stubDb = { query: async () => [], ping: async () => {} }

async function server(extra) {
  const cfg = loadConfig({ DB_URL, RATE_LIMIT_MAX: '3', ...extra })
  const app = await buildServer({ db: stubDb, cfg })
  await app.ready()
  return app
}

const hit = (app, headers = {}, remoteAddress = '127.0.0.1') =>
  app
    .inject({ method: 'GET', url: '/api/v1/ringkasan', headers, remoteAddress })
    .then(r => r.statusCode)

test('parseTrustProxy: loopback atau daftar IP/CIDR; "true", angka, dan "semua alamat" ditolak', () => {
  assert.equal(parseTrustProxy(undefined), false)
  assert.equal(parseTrustProxy(''), false)
  assert.equal(parseTrustProxy('0'), false)
  assert.deepEqual(parseTrustProxy('loopback'), ['loopback'])
  assert.deepEqual(parseTrustProxy(' LOOPBACK '), ['loopback'])
  assert.deepEqual(parseTrustProxy('10.0.0.1'), ['10.0.0.1'])
  assert.deepEqual(parseTrustProxy('127.0.0.1, 10.0.0.0/8'), [
    '127.0.0.1',
    '10.0.0.0/8'
  ])
  assert.deepEqual(parseTrustProxy('::1'), ['::1'])
  for (const bad of [
    'true',
    'TRUE',
    'yes',
    '1',
    '2',
    '10',
    '1.2.3',
    'abc',
    '1,',
    ',',
    '0.0.0.0/0',
    '::/0',
    '10.0.0.1, 0.0.0.0/0',
    '10.0.0.0/33',
    '::1/129',
    '10.0.0.0/8/8'
  ])
    assert.throws(() => parseTrustProxy(bad), /TRUST_PROXY/, bad)
  assert.throws(
    () => loadConfig({ DB_URL, TRUST_PROXY: 'true' }),
    /TRUST_PROXY/
  )
})

test('TRUST_PROXY=loopback: IP klien dari kanan X-Forwarded-For; entri palsu di kiri tidak berpengaruh', async () => {
  const app = await server({ TRUST_PROXY: 'loopback' })
  const codes = []
  // Nginx menambahkan IP asli (203.0.113.9) di KANAN; klien memalsukan bagian kiri tiap kali.
  for (let i = 0; i < 6; i++)
    codes.push(
      await hit(app, { 'x-forwarded-for': `10.0.0.${i}, 203.0.113.9` })
    )
  assert.deepEqual(
    codes.map(c => c === 429),
    [false, false, false, true, true, true],
    `kode: ${codes}`
  )
  // Pelindung dari alasan yang salah: klien lain (IP asli berbeda, lewat proxy yang sama)
  // harus mendapat keranjang sendiri, bukan ikut terkena batas milik 127.0.0.1.
  for (const real of ['203.0.113.10', '203.0.113.11'])
    assert.notEqual(await hit(app, { 'x-forwarded-for': real }), 429, real)
  // Header yang sudah ditimpa nginx (hanya IP asli) menghasilkan kunci yang sama dengan IP itu.
  assert.equal(await hit(app, { 'x-forwarded-for': '203.0.113.9' }), 429)
  await app.close()
})

test('TRUST_PROXY=loopback: X-Forwarded-For dari soket yang bukan proxy tepercaya diabaikan', async () => {
  const app = await server({ TRUST_PROXY: 'loopback' })
  const codes = []
  // Klien menyambung langsung (bukan lewat nginx) dan memalsukan IP tiap permintaan.
  for (let i = 0; i < 6; i++)
    codes.push(
      await hit(app, { 'x-forwarded-for': `10.0.0.${i}` }, '198.51.100.7')
    )
  assert.deepEqual(
    codes.map(c => c === 429),
    [false, false, false, true, true, true],
    `kode: ${codes}`
  )
  await app.close()
})

test('429 tidak boleh disimpan perantara (Cache-Control: no-store)', async () => {
  const app = await server({})
  for (let i = 0; i < 3; i++) await hit(app)
  const r = await app.inject({
    method: 'GET',
    url: '/api/v1/ringkasan',
    remoteAddress: '127.0.0.1'
  })
  assert.equal(r.statusCode, 429)
  assert.equal(r.headers['cache-control'], 'no-store')
  await app.close()
})

test('tanpa TRUST_PROXY: X-Forwarded-For diabaikan, kunci = alamat soket', async () => {
  const app = await server({})
  const codes = []
  for (let i = 0; i < 6; i++)
    codes.push(await hit(app, { 'x-forwarded-for': `198.51.100.${i}` }))
  assert.deepEqual(
    codes.map(c => c === 429),
    [false, false, false, true, true, true],
    `kode: ${codes}`
  )
  assert.notEqual(await hit(app, {}, '192.0.2.77'), 429) // soket lain = keranjang lain
  await app.close()
})
