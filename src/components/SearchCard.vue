<template>
  <form class="searchcard" role="search" novalidate @submit.prevent="submit">
    <div class="seg" role="group" aria-label="Cara mencari">
      <button
        type="button"
        :aria-pressed="mode === 'kata'"
        @click="setMode('kata')"
      >
        <AppIcon v-if="mode === 'kata'" name="check" size="sm" />Kata kunci
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'nomor'"
        @click="setMode('nomor')"
      >
        <AppIcon v-if="mode === 'nomor'" name="check" size="sm" />Nomor &amp;
        tahun
      </button>
    </div>

    <label v-if="mode === 'kata'" class="field">
      <AppIcon name="search" />
      <input
        ref="kataEl"
        v-model="q"
        type="search"
        placeholder="Judul atau kata kunci"
        aria-label="Kata kunci"
        maxlength="100"
        enterkeyhint="search"
        autocomplete="off"
        :aria-invalid="Boolean(problem)"
        :aria-describedby="problem ? 'cari-masalah' : undefined"
      />
    </label>
    <div v-else class="searchrow2">
      <label class="field">
        <input
          ref="nomorEl"
          v-model="nomor"
          inputmode="numeric"
          placeholder="Nomor"
          aria-label="Nomor peraturan"
          maxlength="20"
          autocomplete="off"
          :aria-invalid="Boolean(problem)"
          :aria-describedby="problem ? 'cari-masalah' : undefined"
        />
      </label>
      <label class="field">
        <input
          v-model="tahun"
          inputmode="numeric"
          placeholder="Tahun"
          aria-label="Tahun"
          maxlength="4"
          autocomplete="off"
          :aria-invalid="Boolean(problem)"
        />
      </label>
    </div>

    <div class="searchrow">
      <label class="field">
        <select v-model="jenis" aria-label="Jenis dokumen">
          <option value="">Semua jenis</option>
          <option v-for="j in jenisList" :key="j.kode" :value="j.kode">{{
            j.nama
          }}</option>
        </select>
        <AppIcon name="chevron-down" size="sm" />
      </label>
      <button class="btn btn-primary" type="submit">Cari</button>
    </div>

    <p v-if="problem" id="cari-masalah" class="field-error" role="alert">{{
      problem
    }}</p>
  </form>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { getReferensi } from '@/services/api.js'
import { useResource } from '@/composables/useResource.js'
import { DEFAULT_FILTERS, toRouteQuery } from '@/utils/validators.js'

const router = useRouter()

const mode = ref('kata')
const q = ref('')
const nomor = ref('')
const tahun = ref('')
const jenis = ref('')
const problem = ref('')
const kataEl = ref(null)
const nomorEl = ref(null)

const { data: jenisData } = useResource(
  signal => getReferensi('jenis-peraturan', { signal }),
  {
    cacheKey: 'referensi:jenis-peraturan',
    ttlMs: 10 * 60 * 1000
  }
)
const jenisList = computed(() => jenisData.value ?? [])

function setMode(next) {
  mode.value = next
  problem.value = ''
  nextTick(() => (next === 'kata' ? kataEl : nomorEl).value?.focus())
}

function submit() {
  problem.value = ''
  const filters = { ...DEFAULT_FILTERS, jenis: jenis.value }

  if (mode.value === 'kata') {
    const text = q.value.replace(/\s+/g, ' ').trim()
    if (text.length === 1) {
      problem.value = 'Kata kunci minimal 2 huruf.'
      return
    }
    filters.q = text
  } else {
    const n = nomor.value.trim()
    const t = tahun.value.trim()
    if (!n && !t) {
      problem.value = 'Isi nomor, tahun, atau keduanya.'
      return
    }
    if (n && !/^[0-9A-Za-z/.-]{1,20}$/.test(n)) {
      problem.value =
        'Nomor hanya boleh huruf, angka, garis miring, titik, atau tanda hubung.'
      return
    }
    if (t && !/^(19|20)\d{2}$/.test(t)) {
      problem.value = 'Tahun harus empat angka, misalnya 2023.'
      return
    }
    filters.nomor = n
    filters.tahun_dari = t
    filters.tahun_sampai = t
  }

  router.push({ path: '/dokumen', query: toRouteQuery(filters) })
}
</script>
