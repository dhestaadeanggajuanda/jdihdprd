import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  safeFileName,
  resolveLampiran,
  isRestricted,
  openLocal,
  attachmentName
} from '../src/files.js'

const HOSTS = ['bphn.jdihn.go.id', 'jdihn.go.id']

test('safeFileName menolak pemisah jalur, "..", ekstensi di luar allowlist, dan bukan string', () => {
  for (const bad of [
    '../a.pdf',
    'a/../b.pdf',
    'a/b.pdf',
    'a\\b.pdf',
    '..',
    '.pdf',
    'a.exe',
    'a.php',
    'a.svg',
    'a.html',
    'a',
    '',
    null,
    undefined,
    42,
    'a\u0000.pdf',
    'x'.repeat(250) + '.pdf'
  ])
    assert.equal(safeFileName(bad), null, String(bad))
  for (const good of ['perda-7-2019.pdf', 'Perda No 7 (2019).PDF', 'a b.docx'])
    assert.equal(safeFileName(good), good)
})

test('resolveLampiran: URL https ke host allowlist dialihkan; host lain tidak', () => {
  assert.deepEqual(
    resolveLampiran('https://bphn.jdihn.go.id/common/dokumen/p.pdf', HOSTS),
    { kind: 'redirect', url: 'https://bphn.jdihn.go.id/common/dokumen/p.pdf' }
  )
  for (const bad of [
    'https://evil.example.com/x.pdf',
    'https://bphn.jdihn.go.id.evil.com/x.pdf', // subdomain palsu
    'https://evil.com/bphn.jdihn.go.id/x.pdf',
    'https://user:pw@bphn.jdihn.go.id/x.pdf', // userinfo
    'https://bphn.jdihn.go.id:8443/x.pdf', // port
    'http://bphn.jdihn.go.id/x.pdf', // bukan https dan bukan /common/dokumen/
    'javascript:alert(1)',
    'file:///etc/passwd',
    'ftp://bphn.jdihn.go.id/x.pdf',
    '//bphn.jdihn.go.id/x.pdf',
    ''
  ])
    assert.equal(
      resolveLampiran(bad, HOSTS)?.kind === 'redirect',
      false,
      `${bad} tidak boleh dialihkan`
    )
})

test('resolveLampiran: jalur lokal hanya mengambil nama berkas yang aman', () => {
  assert.deepEqual(resolveLampiran('perda-7-2019.pdf', HOSTS), {
    kind: 'local',
    name: 'perda-7-2019.pdf'
  })
  assert.deepEqual(resolveLampiran('x/y/../z/perda.pdf', HOSTS), {
    kind: 'local',
    name: 'perda.pdf'
  })
  assert.deepEqual(
    resolveLampiran('http://localhost/ildis/common/dokumen/a%20b.pdf', HOSTS),
    { kind: 'local', name: 'a b.pdf' }
  )
  for (const bad of [
    '../../etc/passwd',
    'http://localhost/common/dokumen/%2e%2e%2fsecret.pdf',
    'http://localhost/common/dokumen/..%5Csecret.pdf',
    'http://localhost/common/dokumen/a.exe',
    'x'.repeat(601),
    null
  ])
    assert.equal(resolveLampiran(bad, HOSTS), null, String(bad))
})

test('resolveLampiran: persen-encoding rusak di data tidak melempar galat', () => {
  assert.doesNotThrow(() =>
    resolveLampiran('http://localhost/common/dokumen/%E0%A4%A.pdf', HOSTS)
  )
  assert.equal(
    resolveLampiran('http://localhost/common/dokumen/%E0%A4%A.pdf', HOSTS),
    null
  )
  assert.equal(
    resolveLampiran('http://localhost/common/dokumen/%.pdf', HOSTS),
    null
  )
})

test('isRestricted: konservatif', () => {
  for (const [a, p] of [
    ['Tertutup', null],
    ['terbatas', ''],
    ['Private', '-'],
    [null, 'Hanya untuk internal'],
    ['Terbuka', 'Rahasia']
  ])
    assert.equal(isRestricted(a, p), true, `${a} / ${p}`)
  for (const [a, p] of [
    [null, null],
    ['', ''],
    ['Terbuka', '-'],
    ['Terbuka', 'Tidak ada'],
    [null, 'tanpa pembatasan']
  ])
    assert.equal(isRestricted(a, p), false, `${a} / ${p}`)
})

test('attachmentName: tanda kutip dan karakter non-ASCII tidak merusak header', () => {
  const h = attachmentName('Perda "7" é.pdf')
  assert.ok(!/[\r\n]/.test(h))
  assert.match(h, /^attachment; filename="[^"\\]*"; filename\*=UTF-8''/)
})

test('openLocal: tetap di dalam folder (symlink keluar ditolak) dan hanya berkas biasa', async () => {
  const base = await mkdtemp(join(tmpdir(), 'jdih-files-'))
  const dir = join(base, 'dokumen')
  const outside = join(base, 'rahasia')
  await mkdir(dir)
  await mkdir(outside)
  await writeFile(join(dir, 'ok.pdf'), '%PDF ok')
  await writeFile(join(outside, 'secret.pdf'), '%PDF secret')
  await mkdir(join(dir, 'folder.pdf'))
  let symlinkOk = true
  try {
    await symlink(join(outside, 'secret.pdf'), join(dir, 'tautan.pdf'))
  } catch {
    symlinkOk = false // Windows tanpa hak membuat symlink
  }
  try {
    const f = await openLocal(dir, 'ok.pdf')
    assert.equal(f.size, 7)
    f.stream.destroy()
    assert.equal(await openLocal(dir, 'tidak-ada.pdf'), null)
    assert.equal(await openLocal(dir, 'folder.pdf'), null, 'direktori ditolak')
    assert.equal(await openLocal(dir, '../rahasia/secret.pdf'), null)
    assert.equal(await openLocal('', 'ok.pdf'), null)
    if (symlinkOk)
      assert.equal(
        await openLocal(dir, 'tautan.pdf'),
        null,
        'symlink ke luar folder ditolak'
      )
  } finally {
    await rm(base, { recursive: true, force: true })
  }
})
