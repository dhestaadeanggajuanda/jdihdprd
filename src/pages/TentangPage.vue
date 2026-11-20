<template>
  <div class="wrap about">
    <nav class="sidenav" aria-label="Halaman Tentang Kami">
      <template v-for="(p, i) in daftar" :key="p.slug">
        <span v-if="p.grup && daftar[i - 1]?.grup !== p.grup" class="grp">{{
          p.grup
        }}</span>
        <NavLink
          :to="`/tentang/${p.slug}`"
          :current="p.slug === aktif"
          :class="{ sub: p.grup }"
          >{{ p.judul }}</NavLink
        >
      </template>
    </nav>

    <article class="prose">
      <p class="crumbs crumbs-top">
        <NavLink to="/">Beranda</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <NavLink to="/tentang">Tentang</NavLink>
        <template v-if="halaman">
          <AppIcon name="chevron-right" size="xs" />
          <span>{{ halaman.judul }}</span>
        </template>
      </p>

      <SkeletonCards
        v-if="(listLoading && !daftarData) || (loading && !halaman)"
        :count="2"
        label="Memuat halaman"
      />
      <ErrorState
        v-else-if="galat && !halaman"
        :error="galat"
        @retry="muatUlang"
      />
      <template v-else-if="halaman">
        <h1>{{ halaman.judul }}</h1>
        <SafeHtml v-if="halaman.isiHtml" :html="halaman.isiHtml" />
        <figure v-if="halaman.berkas?.tipe === 'gambar'" class="page-figure">
          <img
            :src="halamanBerkasUrl(halaman.slug)"
            :alt="`Bagan: ${halaman.judul}`"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
        </figure>
        <p v-else-if="halaman.berkas?.tipe === 'pdf'">
          <a
            class="btn btn-primary"
            :href="halamanBerkasUrl(halaman.slug)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="download" />Unduh {{ halaman.judul }} (PDF)
          </a>
        </p>
      </template>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import SafeHtml from '@/components/SafeHtml.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import { getHalaman, getHalamanList, halamanBerkasUrl } from '@/services/api.js'
import { useBarTitle } from '@/composables/useBarTitle.js'
import { useResource } from '@/composables/useResource.js'

const route = useRoute()

const {
  data: daftarData,
  error: listError,
  loading: listLoading,
  reload: reloadList
} = useResource(signal => getHalamanList({ signal }), {
  cacheKey: 'halaman:daftar',
  ttlMs: 10 * 60 * 1000
})
const daftar = computed(() => daftarData.value ?? [])

// Tanpa slug di URL: tampilkan halaman pertama dari daftar.
const aktif = computed(() => route.params.slug || daftar.value[0]?.slug || '')

const {
  data: halaman,
  error,
  loading,
  reload
} = useResource(signal => getHalaman(aktif.value, { signal }), {
  sources: [aktif],
  enabled: () => route.name === 'tentang' && aktif.value !== '',
  cacheKey: () => `halaman:${aktif.value}`,
  ttlMs: 10 * 60 * 1000
})

const galat = computed(() => listError.value ?? error.value)
const muatUlang = () => (listError.value ? reloadList() : reload())

useMeta(() => ({ title: halaman.value?.judul ?? 'Tentang' }))
useBarTitle(() => halaman.value?.judul)
</script>
