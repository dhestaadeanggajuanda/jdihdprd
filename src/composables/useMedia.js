// Ref yang mengikuti media query (mis. '(min-width: 1024px)').
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useMedia(query) {
  const cocok = ref(globalThis.matchMedia?.(query).matches ?? false)
  let media = null
  const onChange = event => (cocok.value = event.matches)
  onMounted(() => {
    media = globalThis.matchMedia?.(query) ?? null
    if (media) {
      cocok.value = media.matches
      media.addEventListener('change', onChange)
    }
  })
  onBeforeUnmount(() => media?.removeEventListener('change', onChange))
  return cocok
}
