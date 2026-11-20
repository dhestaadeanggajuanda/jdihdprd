<template>
  <HeroSlider />

  <NewsStrip :post="news?.posts[0] ?? null" :loading="newsLoading && !news" />

  <section class="sec wrap" aria-labelledby="h-koleksi">
    <SectionHead id="h-koleksi" title="Koleksi" to="/dokumen" />
    <SkeletonCards
      v-if="ringkasanLoading && !ringkasan"
      :count="2"
      label="Memuat koleksi"
    />
    <ErrorState
      v-else-if="ringkasanError && !ringkasan"
      :error="ringkasanError"
      @retry="reloadRingkasan"
    />
    <div v-else-if="ringkasan" class="colls">
      <NavLink
        v-for="k in ringkasan.koleksi"
        :key="k.tipe"
        class="card coll plain stretched"
        :to="{
          path: '/dokumen',
          query: k.tipe === 'peraturan' ? {} : { tipe: k.tipe }
        }"
      >
        <span class="ico"
          ><AppIcon :name="KOLEKSI_ICON[k.tipe] ?? 'file'"
        /></span>
        <span>
          <b>{{ k.nama }}</b>
          <span class="n num">{{ formatNumber(k.jumlah) }} dokumen</span>
          <span class="split num">{{ ringkasKoleksi(k) }}</span>
        </span>
      </NavLink>
    </div>
  </section>

  <section class="sec wrap" aria-labelledby="h-terbaru">
    <SectionHead id="h-terbaru" title="Produk hukum terbaru" to="/dokumen" />
    <SkeletonCards
      v-if="ringkasanLoading && !ringkasan"
      :count="3"
      label="Memuat produk hukum terbaru"
    />
    <ErrorState
      v-else-if="ringkasanError && !ringkasan"
      :error="ringkasanError"
      @retry="reloadRingkasan"
    />
    <StateView
      v-else-if="ringkasan && ringkasan.terbaru.length === 0"
      icon="file"
      title="Belum ada produk hukum"
      message="Produk hukum yang terbit akan tampil di sini."
    />
    <div v-else-if="ringkasan" class="docs cols-3 trim-md">
      <DocCard v-for="d in ringkasan.terbaru" :key="d.id" :dokumen="d" />
    </div>
  </section>

  <section class="sec wrap" aria-labelledby="h-berita">
    <SectionHead id="h-berita" title="Berita terkait" to="/berita" />
    <p class="topics topics-gap">
      Topik:
      <span v-for="t in NEWS_FILTER" :key="t" class="chip">{{ t }}</span>
    </p>
    <SkeletonCards
      v-if="newsLoading && !news"
      :count="3"
      label="Memuat berita"
    />
    <ErrorState
      v-else-if="newsError && !news"
      :error="newsError"
      @retry="reloadNews"
    >
      <a
        class="btn btn-text"
        :href="MEDIACENTER_URL"
        target="_blank"
        rel="noopener noreferrer"
        >Buka Media Center</a
      >
    </ErrorState>
    <StateView
      v-else-if="news && news.posts.length === 0"
      icon="newspaper"
      title="Belum ada berita yang cocok"
      message="Berita dengan topik di atas belum tersedia di Media Center."
    />
    <div v-else-if="news" class="posts trim-md">
      <PostCard v-for="p in news.posts.slice(0, 3)" :key="p.id" :post="p" />
    </div>
  </section>

  <section class="sec wrap" aria-labelledby="h-tautan">
    <SectionHead id="h-tautan" title="Tautan terkait" />
    <div class="links">
      <a
        v-for="l in RELATED_LINKS"
        :key="l.host"
        :href="l.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          {{ l.nama }}
          <small>{{ l.host }}</small>
        </span>
        <AppIcon name="external-link" size="sm" />
        <span class="sr">(dibuka di tab baru)</span>
      </a>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import DocCard from '@/components/DocCard.vue'
import ErrorState from '@/components/ErrorState.vue'
import HeroSlider from '@/components/HeroSlider.vue'
import NavLink from '@/components/NavLink.vue'
import NewsStrip from '@/components/NewsStrip.vue'
import PostCard from '@/components/PostCard.vue'
import SectionHead from '@/components/SectionHead.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import StateView from '@/components/StateView.vue'
import { NEWS_FILTER } from '@/config/env.js'
import { MEDIACENTER_URL } from '@/config/endpoints.js'
import { RELATED_LINKS } from '@/config/hosts.js'
import { getRingkasan } from '@/services/api.js'
import { fetchNews } from '@/services/news.js'
import { useResource } from '@/composables/useResource.js'
import { formatNumber } from '@/utils/format.js'

const KOLEKSI_ICON = {
  peraturan: 'landmark',
  monografi: 'book',
  artikel: 'file-text',
  putusan: 'scale'
}

const {
  data: ringkasan,
  error: ringkasanError,
  loading: ringkasanLoading,
  reload: reloadRingkasan
} = useResource(signal => getRingkasan({ signal }), { cacheKey: 'ringkasan' })

const {
  data: news,
  error: newsError,
  loading: newsLoading,
  reload: reloadNews
} = useResource(signal => fetchNews({ limit: 6, signal }), {
  cacheKey: 'berita:beranda',
  ttlMs: 5 * 60 * 1000
})

function ringkasKoleksi(k) {
  if (k.tipe === 'peraturan' && k.berlaku !== null && k.dicabut !== null) {
    return `${formatNumber(k.berlaku)} berlaku · ${formatNumber(k.dicabut)} dicabut`
  }
  return k.deskripsi ?? ''
}
</script>
