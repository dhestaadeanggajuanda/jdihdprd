import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// useAppearance memegang keadaan di tingkat modul (satu sumber untuk widget, Profil, dan
// footer), jadi tiap tes memuat ulang modulnya dengan penyimpanan yang bersih.
async function muat({ capacitor = false, tampilan, aksesibilitas } = {}) {
  vi.resetModules()
  localStorage.clear()
  if (tampilan !== undefined) {
    localStorage.setItem('jdih:tampilan', tampilan)
  }
  if (aksesibilitas !== undefined) {
    localStorage.setItem('jdih:aksesibilitas', aksesibilitas)
  }
  const dark = { set: vi.fn() }
  vi.doMock('quasar', () => ({
    Dark: dark,
    Platform: { is: { capacitor } }
  }))
  const mod = await import('@/composables/useAppearance.js')
  return { ...mod, dark }
}

const attr = name => document.documentElement.dataset[name]

beforeEach(() => {
  for (const k of Object.keys(document.documentElement.dataset)) {
    delete document.documentElement.dataset[k]
  }
})

describe('useAppearance: tema dan ukuran teks (jdih:tampilan)', () => {
  it('bawaan: sistem dan normal; menerapkan atribut di <html>', async () => {
    const { initAppearance, useAppearance } = await muat()
    initAppearance()
    expect(useAppearance().state).toMatchObject({
      theme: 'system',
      text: 'normal'
    })
    expect(attr('theme')).toBe('light')
    expect(attr('text')).toBe('normal')
  })

  it('menyimpan perubahan dan menerapkannya', async () => {
    const { initAppearance, useAppearance, dark } = await muat()
    initAppearance()
    const { setTheme, setText } = useAppearance()
    setTheme('dark')
    setText('xlarge')
    await nextTick()
    expect(attr('theme')).toBe('dark')
    expect(attr('text')).toBe('xlarge')
    expect(dark.set).toHaveBeenLastCalledWith(true)
    expect(JSON.parse(localStorage.getItem('jdih:tampilan'))).toEqual({
      theme: 'dark',
      text: 'xlarge'
    })
  })

  it('nilai tersimpan yang tidak dikenal kembali ke bawaan', async () => {
    const { useAppearance } = await muat({
      tampilan: JSON.stringify({ theme: 'neon', text: '999' })
    })
    expect(useAppearance().state).toMatchObject({
      theme: 'system',
      text: 'normal'
    })
  })

  it('setTheme dan setText menolak nilai di luar daftar', async () => {
    const { useAppearance } = await muat()
    const { state, setTheme, setText } = useAppearance()
    setTheme('neon')
    setText('raksasa')
    expect(state).toMatchObject({ theme: 'system', text: 'normal' })
  })
})

describe('useAppearance: pilihan aksesibilitas (jdih:aksesibilitas)', () => {
  it('semua mati secara bawaan dan tidak memasang atribut', async () => {
    const { initAppearance, useAppearance, A11Y_FLAGS } = await muat()
    initAppearance()
    const { a11y } = useAppearance()
    expect(A11Y_FLAGS).toEqual([
      'contrast',
      'spacing',
      'links',
      'motion',
      'gray',
      'cursor'
    ])
    for (const k of A11Y_FLAGS) {
      expect(a11y[k], k).toBe(false)
    }
    for (const name of [
      'a11yContrast',
      'a11ySpacing',
      'a11yLinks',
      'a11yMotion',
      'a11yGray',
      'a11yCursor'
    ]) {
      expect(attr(name), name).toBeUndefined()
    }
  })

  it('menyalakan pilihan memasang atribut yang dipakai CSS dan menyimpannya', async () => {
    const { initAppearance, useAppearance } = await muat()
    initAppearance()
    const { toggleA11y } = useAppearance()
    for (const f of [
      'contrast',
      'spacing',
      'links',
      'motion',
      'gray',
      'cursor'
    ]) {
      toggleA11y(f)
    }
    await nextTick()
    const html = document.documentElement
    expect(html.getAttribute('data-a11y-contrast')).toBe('high')
    expect(html.getAttribute('data-a11y-motion')).toBe('off')
    for (const n of ['spacing', 'links', 'gray', 'cursor']) {
      expect(html.hasAttribute(`data-a11y-${n}`), n).toBe(true)
    }
    expect(JSON.parse(localStorage.getItem('jdih:aksesibilitas'))).toEqual({
      contrast: true,
      spacing: true,
      links: true,
      motion: true,
      gray: true,
      cursor: true
    })
    toggleA11y('contrast')
    await nextTick()
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false)
  })

  it('daftar putih: kunci asing dan nilai bukan true diabaikan saat dibaca', async () => {
    const { useAppearance } = await muat({
      aksesibilitas: JSON.stringify({
        contrast: true,
        gray: 'ya',
        spacing: 1,
        sembarang: true,
        __proto__: { motion: true }
      })
    })
    const { a11y } = useAppearance()
    expect(a11y.contrast).toBe(true)
    expect(a11y.gray).toBe(false)
    expect(a11y.spacing).toBe(false)
    expect(a11y.motion).toBe(false)
    expect(Object.keys(a11y)).not.toContain('sembarang')
  })

  it('isi tersimpan yang rusak atau bukan objek tidak merusak aplikasi', async () => {
    for (const mentah of ['{rusak', 'null', '42', '"x"', '[true]']) {
      const { useAppearance } = await muat({ aksesibilitas: mentah })
      const { a11y } = useAppearance()
      expect(
        Object.values(a11y).every(v => v === false),
        mentah
      ).toBe(true)
    }
  })

  it('setA11y dan toggleA11y menolak nama pilihan yang tidak dikenal', async () => {
    const { useAppearance } = await muat()
    const { a11y, setA11y, toggleA11y } = useAppearance()
    setA11y('hack', true)
    toggleA11y('hack')
    expect(Object.keys(a11y)).not.toContain('hack')
    setA11y('gray', 'true')
    expect(a11y.gray).toBe(false)
    setA11y('gray', true)
    expect(a11y.gray).toBe(true)
  })

  it('Android memakai pengaturan sistem: atribut tidak dipasang walau tersimpan', async () => {
    const { initAppearance } = await muat({
      capacitor: true,
      aksesibilitas: JSON.stringify({ contrast: true, gray: true })
    })
    initAppearance()
    const html = document.documentElement
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false)
    expect(html.hasAttribute('data-a11y-gray')).toBe(false)
  })

  it('reset mengembalikan semuanya, termasuk tema dan ukuran teks', async () => {
    const { initAppearance, useAppearance, isAppearanceChanged } = await muat()
    initAppearance()
    const { state, a11y, setTheme, setText, toggleA11y, reset } =
      useAppearance()
    expect(isAppearanceChanged()).toBe(false)
    setTheme('dark')
    setText('large')
    toggleA11y('links')
    expect(isAppearanceChanged()).toBe(true)
    reset()
    await nextTick()
    expect(state).toMatchObject({ theme: 'system', text: 'normal' })
    expect(a11y.links).toBe(false)
    expect(isAppearanceChanged()).toBe(false)
    expect(document.documentElement.hasAttribute('data-a11y-links')).toBe(false)
  })
})

describe('hapusDataTersimpan (Kebijakan Cookie)', () => {
  it('menghapus ketiga entri dan mengembalikan pilihan ke bawaan', async () => {
    const { initAppearance, useAppearance } = await muat()
    initAppearance()
    const { setTheme, toggleA11y } = useAppearance()
    setTheme('dark')
    toggleA11y('gray')
    await nextTick()
    localStorage.setItem(
      'jdih:notifikasi',
      JSON.stringify({ aktif: true, jenis: ['perda'] })
    )
    expect(localStorage.getItem('jdih:tampilan')).not.toBeNull()
    expect(localStorage.getItem('jdih:aksesibilitas')).not.toBeNull()

    const { hapusDataTersimpan, STORAGE_KEYS } =
      await import('@/services/dataTersimpan.js')
    expect(STORAGE_KEYS).toEqual(['tampilan', 'aksesibilitas', 'notifikasi'])
    await hapusDataTersimpan()

    for (const k of STORAGE_KEYS) {
      expect(localStorage.getItem(`jdih:${k}`), k).toBeNull()
    }
    expect(useAppearance().state).toMatchObject({
      theme: 'system',
      text: 'normal'
    })
    expect(useAppearance().a11y.gray).toBe(false)
    expect(document.documentElement.hasAttribute('data-a11y-gray')).toBe(false)
  })

  it('tidak menyentuh kunci milik situs lain di localStorage yang sama', async () => {
    await muat()
    localStorage.setItem('lain:kunci', 'tetap')
    const { hapusDataTersimpan } = await import('@/services/dataTersimpan.js')
    await hapusDataTersimpan()
    expect(localStorage.getItem('lain:kunci')).toBe('tetap')
  })
})
