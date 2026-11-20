<template>
  <article class="card post">
    <img
      v-if="post.image"
      :src="post.image.url"
      alt=""
      :width="post.image.width || 104"
      :height="post.image.height || 78"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
    />
    <div class="txt">
      <h3>
        <a
          class="stretched"
          :href="post.link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ post.title }}
        </a>
      </h3>
      <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
      <p class="when">
        <AppIcon name="calendar" size="xs" />
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <span class="sr">, dibuka di situs Media Center</span>
        <AppIcon name="external-link" size="xs" />
      </p>
    </div>
  </article>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { formatDate } from '@/utils/format.js'

// Gambar dan tautan sudah divalidasi ke host Media Center (services/news.js).
defineProps({
  post: { type: Object, required: true }
})
</script>
