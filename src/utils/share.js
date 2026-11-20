// Bagikan tautan dan salin teks. Memakai Web Share bila ada, selain itu menyalin
// ke papan klip. Hasilnya dilaporkan agar UI bisa memberi umpan balik.

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // jatuh ke cara lama di bawah
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** @returns {Promise<'dibagikan'|'disalin'|'dibatalkan'|'gagal'>} */
export async function shareLink({ title, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'dibagikan'
    } catch (err) {
      if (err?.name === 'AbortError') return 'dibatalkan'
    }
  }
  return (await copyText(url)) ? 'disalin' : 'gagal'
}
