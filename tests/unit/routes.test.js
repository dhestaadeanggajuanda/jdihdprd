import { describe, it, expect } from 'vitest'
import routes from '@/router/routes.js'
import { APP_NAV, MAIN_NAV } from '@/components/nav.js'

const anak = routes[0].children
const rute = nama => anak.find(r => r.name === nama)

describe('rute Profil dan kebijakan', () => {
  it('tautan lama /tentang dialihkan ke /profil (slug, kueri, dan hash terbawa)', () => {
    const lama = anak.find(r => r.path.startsWith('tentang/'))
    expect(typeof lama.redirect).toBe('function')
    expect(
      lama.redirect({
        params: { slug: 'dasar-hukum' },
        query: { a: '1' },
        hash: '#x'
      })
    ).toEqual({ path: '/profil/dasar-hukum', query: { a: '1' }, hash: '#x' })
    expect(lama.redirect({ params: {}, query: {}, hash: '' })).toEqual({
      path: '/profil',
      query: {},
      hash: ''
    })
  })

  it('slug dibatasi huruf kecil, angka, dan tanda hubung', () => {
    const profil = rute('profil')
    expect(profil.path).toBe('profil/:slug([a-z0-9-]{1,120})?')
    const lama = anak.find(r => r.path.startsWith('tentang/'))
    expect(lama.path).toBe('tentang/:slug([a-z0-9-]{1,120})?')
  })

  it('halaman kebijakan ada, dengan induk logis hub dan menu Profil aktif', () => {
    for (const [nama, path] of [
      ['kebijakan-privasi', 'kebijakan-privasi'],
      ['kebijakan-cookie', 'kebijakan-cookie']
    ]) {
      const r = rute(nama)
      expect(r.path).toBe(path)
      expect(r.meta).toMatchObject({
        bar: 'back',
        back: '/info',
        nav: 'profil',
        app: 'profil'
      })
    }
  })

  it('hub /info tetap ada dan berjudul Profil', () => {
    expect(rute('info').meta).toMatchObject({
      barTitle: 'Profil',
      nav: 'profil',
      app: 'profil'
    })
  })

  it('halaman tidak ditemukan tetap terakhir', () => {
    expect(anak.at(-1).name).toBe('tidak-ditemukan')
  })

  it('setiap kunci navigasi aktif pada rute cocok dengan kunci menu', () => {
    const kunciHeader = new Set(MAIN_NAV.map(n => n.key))
    const kunciTab = new Set(APP_NAV.map(n => n.key))
    for (const r of anak) {
      if (r.meta?.nav) expect(kunciHeader.has(r.meta.nav), r.name).toBe(true)
      const app = r.meta?.app ?? r.meta?.nav
      if (app) expect(kunciTab.has(app), r.name).toBe(true)
    }
  })
})

describe('navigasi', () => {
  it('urutan header: Profil di sebelah Beranda', () => {
    expect(MAIN_NAV.map(n => n.label)).toEqual([
      'Beranda',
      'Profil',
      'Dokumen',
      'Pembentukan PUU',
      'Berita',
      'Statistik'
    ])
  })

  it('tab bawah: Profil di posisi dua dan membuka hub', () => {
    expect(APP_NAV.map(n => n.label)).toEqual([
      'Beranda',
      'Profil',
      'Dokumen',
      'Berita',
      'Statistik'
    ])
    expect(APP_NAV[1]).toMatchObject({ to: '/info', icon: 'landmark' })
  })

  it('tidak ada kunci ganda', () => {
    expect(new Set(MAIN_NAV.map(n => n.key)).size).toBe(MAIN_NAV.length)
    expect(new Set(APP_NAV.map(n => n.key)).size).toBe(APP_NAV.length)
  })
})
