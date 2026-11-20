<template>
  <div class="wrap">
    <div class="pagehead">
      <p class="crumbs">
        <NavLink to="/">Beranda</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <span>Berita</span>
      </p>
      <h1>Berita terkait produk hukum</h1>
      <p
        >Dari Media Center Kota Singkawang. Artikel dibuka di situs Media
        Center.</p
      >
    </div>

    <p class="topics topics-gap">
      Topik:
      <span v-for="t in NEWS_FILTER" :key="t" class="chip">{{ t }}</span>
    </p>

    <h2 class="sr">Daftar berita</h2>
    <SkeletonCards v-if="loading && !news" :count="4" label="Memuat berita" />
    <ErrorState v-else-if="error && !news" :error="error" @retry="reload">
      <a
        class="btn btn-text"
        :href="MEDIACENTER_URL"
        target="_blank"
        rel="noopener noreferrer"
        >Buka Media Center</a
      >
    </ErrorState>
    <template v-else-if="news">
      <p v-if="news.partial" class="note note-gap" role="status">
        <AppIcon name="info" />
        <span
          >Sebagian topik belum dapat dimuat. Yang tampil hanya berita dari
          topik yang berhasil.</span
        >
      </p>
      <StateView
        v-if="news.posts.length === 0"
        icon="newspaper"
        title="Belum ada berita yang cocok"
        message="Berita dengan topik di atas belum tersedia di Media Center."
      />
      <div v-else class="posts" :aria-busy="loading ? 'true' : 'false'">
        <PostCard v-for="p in news.posts" :key="p.id" :post="p" />
      </div>
      <div v-if="news.hasMore && limit < MAX_LIMIT" class="more">
        <button
          class="btn btn-outline"
          type="button"
          :disabled="loading"
          @click="limit += STEP"
        >
          {{ loading ? 'Memuat…' : 'Muat berita lainnya' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import PostCard from '@/components/PostCard.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import StateView from '@/components/StateView.vue'
import { NEWS_FILTER } from '@/config/env.js'
import { MEDIACENTER_URL } from '@/config/endpoints.js'
import { fetchNews } from '@/services/news.js'
import { useResource } from '@/composables/useResource.js'

const STEP = 6
const MAX_LIMIT = 30
const limit = ref(STEP)

const {
  data: news,
  error,
  loading,
  reload
} = useResource(signal => fetchNews({ limit: limit.value, signal }), {
  sources: [limit],
  cacheKey: () => `berita:${limit.value}`,
  ttlMs: 5 * 60 * 1000
})
</script>
