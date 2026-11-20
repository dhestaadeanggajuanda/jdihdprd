<template>
  <article class="card doc">
    <div class="doc-row">
      <div class="doc-main">
        <div class="doc-top">
          <span class="badge">{{ dokumen.jenis }}</span>
          <StatusBadges :dokumen="dokumen" />
        </div>
        <h3>
          <NavLink class="stretched" :to="`/dokumen/${dokumen.id}`">
            <b class="num">{{ heading }}</b>
            <template v-if="tentang">tentang {{ tentang }}</template>
          </NavLink>
        </h3>
        <p v-if="dokumen.riwayat" class="hist">
          <AppIcon name="corner-down-right" size="sm" />
          <span>{{ dokumen.riwayat }}</span>
        </p>
      </div>
      <div class="doc-side">
        <div class="meta">
          <div v-if="tanggal">
            <AppIcon name="calendar" size="sm" />
            <span>Ditetapkan {{ tanggal }}</span>
          </div>
          <div v-if="dokumen.pemrakarsa">
            <AppIcon name="landmark" size="sm" />
            <span>{{ dokumen.pemrakarsa }}</span>
          </div>
        </div>
        <div class="doc-foot">
          <span v-if="dokumen.berkas" class="num">
            PDF<template v-if="ukuran"> · {{ ukuran }}</template>
          </span>
          <span v-else class="muted">Tanpa berkas</span>
          <a
            v-if="unduhHref"
            class="icon-btn above"
            :href="unduhHref"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Unduh PDF ${heading}`"
          >
            <AppIcon name="download" />
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import StatusBadges from './StatusBadges.vue'
import { judulNomor } from '@/utils/dokumen.js'
import { formatBytes, formatDate } from '@/utils/format.js'
import { lampiranUrl } from '@/services/api.js'

const props = defineProps({
  dokumen: { type: Object, required: true }
})

const bernomor = computed(() =>
  Boolean(props.dokumen.nomor && props.dokumen.tahun)
)
const heading = computed(() =>
  bernomor.value
    ? judulNomor(props.dokumen)
    : props.dokumen.judul || props.dokumen.jenis
)
const tentang = computed(() => (bernomor.value ? props.dokumen.judul : ''))
const tanggal = computed(() => formatDate(props.dokumen.tanggalPenetapan))
const ukuran = computed(() => formatBytes(props.dokumen.berkas?.ukuran))
const unduhHref = computed(() =>
  props.dokumen.berkas
    ? lampiranUrl(props.dokumen.id, props.dokumen.berkas.lampiranId)
    : null
)
</script>
