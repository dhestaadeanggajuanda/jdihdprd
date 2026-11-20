<template>
  <div class="wrap">
    <div class="pagehead">
      <p class="crumbs">
        <NavLink to="/">Beranda</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <NavLink to="/dokumen">Dokumen</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <span>Pembentukan PUU</span>
      </p>
      <h1>Dokumen pembentukan peraturan</h1>
      <p
        >Naskah akademik, rancangan, risalah, dan dokumen lain dalam proses
        pembentukan peraturan perundang-undangan.</p
      >
    </div>

    <SkeletonCards
      v-if="kategoriLoading && !kategori"
      :count="2"
      label="Memuat kategori"
    />
    <ErrorState
      v-else-if="kategoriError && !kategori"
      :error="kategoriError"
      @retry="reloadKategori"
    />
    <template v-else-if="kategori">
      <div class="chips puu-chips" role="group" aria-label="Kategori">
        <NavLink class="chip" to="/pembentukan-puu" :current="!aktif"
          >Semua</NavLink
        >
        <NavLink
          v-for="k in kategori"
          :key="k.kode"
          class="chip"
          :to="`/pembentukan-puu/${k.kode}`"
          :current="k.kode === aktif"
        >
          {{ k.nama
          }}<span class="num muted"> {{ formatNumber(k.jumlah ?? 0) }}</span>
        </NavLink>
      </div>

      <div class="list-gap">
        <template v-if="aktif">
          <SkeletonCards
            v-if="loading && !hasil"
            :count="3"
            label="Memuat dokumen"
          />
          <ErrorState
            v-else-if="error && !hasil"
            :error="error"
            @retry="reload"
          />
          <template v-else-if="hasil">
            <StateView
              v-if="hasil.items.length === 0"
              icon="file"
              title="Belum ada dokumen"
              :message="`Belum ada dokumen pada kategori ${namaAktif}.`"
            />
            <div v-else class="docs list">
              <DocCard v-for="d in hasil.items" :key="d.id" :dokumen="d" />
            </div>
            <AppPager
              :page="hasil.meta.page"
              :total-pages="hasil.meta.totalPages"
              :to-page="toPage"
            />
          </template>
        </template>
        <StateView
          v-else-if="semuaKosong"
          icon="file"
          title="Belum ada dokumen"
          message="Dokumen pembentukan peraturan yang diunggah akan tampil di sini."
        />
        <p v-else class="muted"
          >Pilih salah satu kategori di atas untuk melihat dokumennya.</p
        >
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import AppPager from '@/components/AppPager.vue'
import DocCard from '@/components/DocCard.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import StateView from '@/components/StateView.vue'
import { getPuu, getPuuKategori } from '@/services/api.js'
import { useResource } from '@/composables/useResource.js'
import { formatNumber } from '@/utils/format.js'

const route = useRoute()
const aktif = computed(() =>
  route.params.kategori ? String(route.params.kategori) : ''
)
const page = computed(() => {
  const n = Number(route.query.page)
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : 1
})

const {
  data: kategori,
  error: kategoriError,
  loading: kategoriLoading,
  reload: reloadKategori
} = useResource(signal => getPuuKategori({ signal }), {
  cacheKey: 'puu:kategori',
  ttlMs: 10 * 60 * 1000
})

const {
  data: hasil,
  error,
  loading,
  reload
} = useResource(signal => getPuu(aktif.value, { page: page.value, signal }), {
  sources: [aktif, page],
  enabled: () => route.name === 'puu' && aktif.value !== ''
})

const namaAktif = computed(
  () => kategori.value?.find(k => k.kode === aktif.value)?.nama ?? ''
)
const semuaKosong = computed(() => (kategori.value ?? []).every(k => !k.jumlah))
const toPage = p => ({
  path: `/pembentukan-puu/${aktif.value}`,
  query: p > 1 ? { page: String(p) } : {}
})
</script>
