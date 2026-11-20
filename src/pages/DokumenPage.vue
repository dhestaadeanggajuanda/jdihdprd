<template>
  <nav class="tabs" aria-label="Jenis koleksi">
    <NavLink
      v-for="k in KOLEKSI"
      :key="k.tipe"
      :to="{
        path: '/dokumen',
        query: k.tipe === 'peraturan' ? {} : { tipe: k.tipe }
      }"
      :current="filters.tipe === k.tipe"
    >
      {{ k.label
      }}<span v-if="count(k.tipe) !== null" class="n num">{{
        formatNumber(count(k.tipe))
      }}</span>
    </NavLink>
    <NavLink to="/pembentukan-puu">
      Pembentukan PUU<span v-if="puuTotal !== null" class="n num">{{
        formatNumber(puuTotal)
      }}</span>
    </NavLink>
  </nav>

  <div class="wrap">
    <div class="pagehead">
      <p class="crumbs">
        <NavLink to="/">Beranda</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <NavLink to="/dokumen">Dokumen</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <span>{{ tabLabel }}</span>
      </p>
      <h1>{{ TITLES[filters.tipe] }}</h1>
    </div>

    <div class="results">
      <aside class="filters card" aria-labelledby="h-filter">
        <h2 id="h-filter">Saring</h2>
        <FilterForm :draft="draft" :jenis-options="jenisOptions" uid="panel" />
        <div class="fa">
          <button class="btn btn-primary grow" type="button" @click="applyDraft"
            >Terapkan</button
          >
          <button class="btn btn-outline" type="button" @click="resetDraft"
            >Atur ulang</button
          >
        </div>
      </aside>

      <div>
        <form class="toolbar" role="search" @submit.prevent="submitSearch">
          <label class="field">
            <AppIcon name="search" />
            <input
              v-model="qInput"
              type="search"
              placeholder="Cari judul atau nomor"
              aria-label="Cari dokumen"
              maxlength="100"
              enterkeyhint="search"
              autocomplete="off"
            />
          </label>
          <button
            class="icon-btn filter-only-compact"
            type="button"
            :aria-label="
              activeCount > 0 ? `Saring, ${activeCount} filter aktif` : 'Saring'
            "
            @click="sheetOpen = true"
          >
            <AppIcon name="sliders" />
            <span v-if="activeCount > 0" class="dot" aria-hidden="true">{{
              activeCount
            }}</span>
          </button>
        </form>

        <div
          v-if="activeChips.length > 0"
          class="active"
          role="group"
          aria-label="Filter aktif"
        >
          <button
            v-for="c in activeChips"
            :key="c.key"
            class="chip on"
            type="button"
            :aria-label="`Hapus filter ${c.label}`"
            @click="pushFilters({ ...filters, ...c.clear })"
          >
            {{ c.label }}<AppIcon name="x" size="xs" />
          </button>
          <button class="btn btn-text btn-sm" type="button" @click="clearAll"
            >Hapus semua</button
          >
        </div>

        <div class="sumrow">
          <p class="num" role="status">{{ summary }}</p>
          <label class="field">
            <select
              aria-label="Urutkan hasil"
              :value="filters.sort"
              @change="pushFilters({ ...filters, sort: $event.target.value })"
            >
              <option value="terbaru">Terbaru</option>
              <option value="nomor">Nomor</option>
              <option value="populer">Terpopuler</option>
            </select>
            <AppIcon name="chevron-down" size="sm" />
          </label>
        </div>

        <div class="list-gap" :aria-busy="loading ? 'true' : 'false'">
          <SkeletonCards
            v-if="loading && !result"
            :count="4"
            label="Memuat dokumen"
          />
          <ErrorState
            v-else-if="error && !result"
            :error="error"
            @retry="reload"
          />
          <template v-else-if="result">
            <StateView
              v-if="result.items.length === 0"
              icon="search"
              title="Tidak ada dokumen yang cocok"
              :message="
                activeCount > 0 || filters.q
                  ? 'Coba hapus filter, atau cari dengan kata kunci yang lebih singkat.'
                  : 'Belum ada dokumen di koleksi ini.'
              "
            >
              <button
                v-if="activeCount > 0 || filters.q"
                class="btn btn-tonal"
                type="button"
                @click="clearAll(true)"
                >Hapus semua filter</button
              >
            </StateView>
            <div v-else class="docs list">
              <DocCard v-for="d in result.items" :key="d.id" :dokumen="d" />
            </div>
            <AppPager
              :page="result.meta.page"
              :total-pages="result.meta.totalPages"
              :to-page="toPage"
            />
          </template>
        </div>
      </div>
    </div>
  </div>

  <FilterSheet
    v-model="sheetOpen"
    :draft="draft"
    :jenis-options="jenisOptions"
    :total="previewTotal"
    @apply="applyDraft"
    @reset="resetDraft"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import AppPager from '@/components/AppPager.vue'
import DocCard from '@/components/DocCard.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterForm from '@/components/FilterForm.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import NavLink from '@/components/NavLink.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import StateView from '@/components/StateView.vue'
import {
  getPuuKategori,
  getReferensi,
  getRingkasan,
  searchDokumen
} from '@/services/api.js'
import { useResource } from '@/composables/useResource.js'
import { formatNumber } from '@/utils/format.js'
import {
  PER_PAGE,
  countActiveFilters,
  parseListQuery,
  toRouteQuery
} from '@/utils/validators.js'

const KOLEKSI = [
  { tipe: 'peraturan', label: 'Peraturan' },
  { tipe: 'monografi', label: 'Monografi' },
  { tipe: 'artikel', label: 'Artikel' },
  { tipe: 'putusan', label: 'Putusan' }
]
const TITLES = {
  peraturan: 'Peraturan Perundang-undangan',
  monografi: 'Monografi Hukum',
  artikel: 'Artikel dan Majalah Hukum',
  putusan: 'Putusan'
}
const FILTER_KEYS = {
  jenis: '',
  status: '',
  diubah: false,
  nomor: '',
  tahun_dari: '',
  tahun_sampai: '',
  subyek: ''
}

const route = useRoute()
const router = useRouter()

// URL adalah sumber kebenaran: filter, urutan, dan halaman bisa dibagikan.
const filters = computed(() => parseListQuery(route.query))
const draft = reactive({ ...FILTER_KEYS, ...pickFilters(filters.value) })
const qInput = ref(filters.value.q)
const sheetOpen = ref(false)

function pickFilters(f) {
  return Object.fromEntries(Object.keys(FILTER_KEYS).map(k => [k, f[k]]))
}

watch(filters, f => {
  Object.assign(draft, pickFilters(f))
  qInput.value = f.q
})

useMeta(() => ({ title: TITLES[filters.value.tipe] }))

const { data: ringkasan } = useResource(signal => getRingkasan({ signal }), {
  cacheKey: 'ringkasan'
})
const { data: jenisData } = useResource(
  signal => getReferensi('jenis-peraturan', { signal }),
  {
    cacheKey: 'referensi:jenis-peraturan',
    ttlMs: 10 * 60 * 1000
  }
)
const { data: puu } = useResource(signal => getPuuKategori({ signal }), {
  cacheKey: 'puu:kategori',
  ttlMs: 10 * 60 * 1000
})

const {
  data: result,
  error,
  loading,
  reload
} = useResource(
  signal => searchDokumen(filters.value, { perPage: PER_PAGE, signal }),
  {
    sources: [() => JSON.stringify(filters.value)],
    enabled: () => route.name === 'dokumen'
  }
)

const jenisOptions = computed(() => jenisData.value ?? [])
const puuTotal = computed(() =>
  puu.value ? puu.value.reduce((n, k) => n + (k.jumlah ?? 0), 0) : null
)
const count = tipe =>
  ringkasan.value?.koleksi.find(k => k.tipe === tipe)?.jumlah ?? null
const tabLabel = computed(
  () => KOLEKSI.find(k => k.tipe === filters.value.tipe)?.label ?? 'Peraturan'
)
const activeCount = computed(() => countActiveFilters(filters.value))

const summary = computed(() => {
  const r = result.value
  if (!r) return loading.value ? 'Memuat dokumen' : ''
  if (r.meta.total === 0) return '0 dokumen'
  const start = (r.meta.page - 1) * r.meta.perPage + 1
  const end = Math.min(start + r.items.length - 1, r.meta.total)
  return `${formatNumber(start)}–${formatNumber(end)} dari ${formatNumber(r.meta.total)} dokumen`
})

const activeChips = computed(() => {
  const f = filters.value
  const chips = []
  if (f.jenis)
    chips.push({
      key: 'jenis',
      label: jenisOptions.value.find(j => j.kode === f.jenis)?.nama ?? f.jenis,
      clear: { jenis: '' }
    })
  if (f.status)
    chips.push({
      key: 'status',
      label: f.status === 'berlaku' ? 'Berlaku' : 'Dicabut',
      clear: { status: '' }
    })
  if (f.diubah)
    chips.push({
      key: 'diubah',
      label: 'Pernah diubah',
      clear: { diubah: false }
    })
  if (f.nomor)
    chips.push({
      key: 'nomor',
      label: `Nomor ${f.nomor}`,
      clear: { nomor: '' }
    })
  if (f.tahun_dari || f.tahun_sampai) {
    const { tahun_dari: a, tahun_sampai: b } = f
    const label =
      a && b
        ? a === b
          ? `Tahun ${a}`
          : `Tahun ${a}–${b}`
        : a
          ? `Sejak ${a}`
          : `Sampai ${b}`
    chips.push({
      key: 'tahun',
      label,
      clear: { tahun_dari: '', tahun_sampai: '' }
    })
  }
  if (f.subyek)
    chips.push({
      key: 'subyek',
      label: `Subjek ${f.subyek}`,
      clear: { subyek: '' }
    })
  return chips
})

function pushFilters(next) {
  router.push({ path: '/dokumen', query: toRouteQuery({ ...next, page: 1 }) })
}
const toPage = page => ({
  path: '/dokumen',
  query: toRouteQuery({ ...filters.value, page })
})

function submitSearch() {
  pushFilters({ ...filters.value, q: qInput.value })
}
function applyDraft() {
  sheetOpen.value = false
  pushFilters({ ...filters.value, ...draft })
}
function resetDraft() {
  Object.assign(draft, FILTER_KEYS)
}
function clearAll(withKeyword = false) {
  pushFilters({
    ...filters.value,
    ...FILTER_KEYS,
    ...(withKeyword === true ? { q: '' } : {})
  })
}

// Perkiraan jumlah hasil untuk draf pada lembar filter ("Tampilkan N hasil").
const previewTotal = ref(null)
let previewTimer = null
let previewCtl = null
watch(
  () => (sheetOpen.value ? JSON.stringify(draft) : null),
  key => {
    clearTimeout(previewTimer)
    previewCtl?.abort()
    if (key === null) {
      previewTotal.value = null
      return
    }
    previewTimer = setTimeout(async () => {
      previewCtl = new AbortController()
      try {
        const r = await searchDokumen(
          { ...filters.value, ...draft, page: 1 },
          { perPage: 1, signal: previewCtl.signal }
        )
        previewTotal.value = r.meta.total
      } catch {
        previewTotal.value = null
      }
    }, 300)
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  clearTimeout(previewTimer)
  previewCtl?.abort()
})
</script>
