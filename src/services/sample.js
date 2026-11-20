// Penanda "data contoh": API pengembangan (dev/mock-api) mengirim header
// X-Data-Sample. API produksi tidak mengirimnya, jadi penanda tidak muncul.
import { ref } from 'vue'

export const sampleData = ref(false)

export function noteSample(headers) {
  if (headers?.get?.('x-data-sample') === 'true') sampleData.value = true
}
