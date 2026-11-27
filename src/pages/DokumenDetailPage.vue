<template>
  <div class="wrap">
    <p class="crumbs crumbs-top">
      <NavLink to="/">Beranda</NavLink>
      <AppIcon name="chevron-right" size="xs" />
      <NavLink to="/dokumen">Dokumen</NavLink>
      <AppIcon name="chevron-right" size="xs" />
      <NavLink
        :to="{
          path: '/dokumen',
          query: d && d.tipe !== 'peraturan' ? { tipe: d.tipe } : {}
        }"
      >
        {{ d ? KOLEKSI_NAMA[d.tipe] : 'Peraturan' }}
      </NavLink>
      <template v-if="d">
        <AppIcon name="chevron-right" size="xs" />
        <span>{{ judulPendek(d) }}</span>
      </template>
    </p>

    <SkeletonCards v-if="loading && !d" :count="3" label="Memuat dokumen" />
    <ErrorState v-else-if="error && !d" :error="error" @retry="reload">
      <NavLink class="btn btn-text" to="/dokumen">Ke daftar dokumen</NavLink>
    </ErrorState>

    <div v-else-if="d" class="detail">
      <div class="detail-main">
        <header>
          <div class="doc-top doc-top-gap">
            <span class="badge">{{ d.jenis }}</span>
            <StatusBadges :dokumen="d" />
          </div>
          <h1 class="dtitle num">
            <b>{{ heading }}</b>
            <span v-if="tentang">tentang {{ tentang }}</span>
          </h1>
          <p
            v-if="d.dilihat !== null || d.diunduh !== null"
            class="stats stats-gap"
          >
            <span v-if="d.dilihat !== null">
              <AppIcon name="eye" size="sm" />{{ formatNumber(d.dilihat) }}
              dilihat
            </span>
            <span v-if="d.diunduh !== null">
              <AppIcon name="download" size="sm" />{{ formatNumber(d.diunduh) }}
              diunduh
            </span>
          </p>
        </header>

        <div class="actions">
          <a
            v-if="utama"
            class="btn btn-primary"
            :href="unduh(utama)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="download" />Unduh PDF<template v-if="utama.ukuran">
              · {{ formatBytes(utama.ukuran) }}</template
            >
          </a>
          <a
            v-if="abstrak"
            class="btn btn-outline"
            :href="unduh(abstrak)"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lihat abstrak
          </a>
          <button class="btn btn-text" type="button" @click="bagikan"
            ><AppIcon name="share" />Bagikan</button
          >
        </div>

        <PdfPreview
          v-if="d.lampiran.length > 0"
          :lampiran="d.lampiran"
          :judul="judulPendek(d)"
          :alamat="unduh"
        />

        <div v-if="kutipan" class="cite">
          <p><span class="lbl">Cara mengutip</span>{{ kutipan }}</p>
          <button
            class="icon-btn"
            type="button"
            aria-label="Salin kutipan"
            @click="salinKutipan"
          >
            <AppIcon name="copy" />
          </button>
        </div>

        <section
          v-if="d.status"
          class="panel statusbox"
          aria-labelledby="h-status"
        >
          <h2 id="h-status">Status keberlakuan</h2>
          <div class="lead-s">
            <StatusBadges :dokumen="d" />
            <p v-if="d.statusKeterangan">{{ d.statusKeterangan }}</p>
          </div>
          <ol v-if="d.riwayatStatus.length > 0" class="tl" aria-label="Riwayat">
            <li
              v-for="(r, i) in d.riwayatStatus"
              :key="i"
              :class="{ now: r.saatIni }"
            >
              <span class="pt" />
              <div>
                <time v-if="r.tanggal" :datetime="r.tanggal">{{
                  formatDate(r.tanggal)
                }}</time>
                <p>{{ r.keterangan }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section class="panel" aria-labelledby="h-info">
          <h2 id="h-info">Informasi dokumen</h2>
          <dl class="dl num">
            <div v-for="row in infoRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="relasiGroups.length > 0"
          class="panel rel"
          aria-labelledby="h-rel"
        >
          <h2 id="h-rel">Peraturan terkait</h2>
          <template v-for="g in relasiGroups" :key="g.label">
            <h3>{{ g.label }}</h3>
            <ul>
              <li v-for="r in g.items" :key="r.id">
                <NavLink class="plain" :to="`/dokumen/${r.id}`">
                  <p>
                    <span
                      v-if="r.status"
                      :class="['status', r.status === 'berlaku' ? 'ok' : 'bad']"
                    >
                      <AppIcon
                        :name="
                          r.status === 'berlaku' ? 'check-circle' : 'x-circle'
                        "
                        size="xs"
                      />{{ r.status === 'berlaku' ? 'Berlaku' : 'Dicabut' }}
                    </span>
                    <b>{{ judulNomor(r) }}</b>
                    <template v-if="r.judul">tentang {{ r.judul }}</template>
                  </p>
                  <AppIcon name="chevron-right" />
                </NavLink>
              </li>
            </ul>
          </template>
        </section>

        <section
          v-if="d.teu.length > 0 || d.subjek.length > 0"
          class="panel"
          aria-labelledby="h-teu"
        >
          <h2 id="h-teu">T.E.U. Badan dan subjek</h2>
          <div v-if="d.teu.length > 0" class="table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Nama</th><th scope="col">Jenis</th></tr>
              </thead>
              <tbody>
                <tr v-for="t in d.teu" :key="t.nama"
                  ><td>{{ t.nama }}</td><td>{{ t.jenis }}</td></tr
                >
              </tbody>
            </table>
          </div>
          <template v-if="d.subjek.length > 0">
            <h3 class="sub-h">Subjek</h3>
            <div class="chips">
              <NavLink
                v-for="s in d.subjek"
                :key="s"
                class="chip"
                :to="{ path: '/dokumen', query: { subyek: s.toLowerCase() } }"
              >
                {{ s }}
              </NavLink>
            </div>
          </template>
        </section>
      </div>

      <aside v-if="d.lampiran.length > 0" class="aside" aria-label="Berkas">
        <section class="panel" aria-labelledby="h-file">
          <h2 id="h-file">Lampiran dan berkas</h2>
          <ul class="files">
            <li v-for="l in d.lampiran" :key="l.id">
              <span class="fi"><AppIcon name="file" /></span>
              <p>
                {{ l.nama }}
                <small class="num"
                  >PDF<template v-if="l.ukuran">
                    · {{ formatBytes(l.ukuran) }}</template
                  ></small
                >
              </p>
              <a
                class="icon-btn"
                :href="unduh(l)"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`Unduh ${l.nama}`"
              >
                <AppIcon name="download" />
              </a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import PdfPreview from '@/components/PdfPreview.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import StatusBadges from '@/components/StatusBadges.vue'
import { getDokumen, lampiranUrl } from '@/services/api.js'
import { useResource } from '@/composables/useResource.js'
import { useToast } from '@/composables/useToast.js'
import { useWhatsappPesan } from '@/composables/useFabContext.js'
import { pesanDokumen } from '@/utils/whatsapp.js'
import { judulLengkap, judulNomor, judulPendek } from '@/utils/dokumen.js'
import { formatBytes, formatDate, formatNumber } from '@/utils/format.js'
import { copyText, shareLink } from '@/utils/share.js'

const KOLEKSI_NAMA = {
  peraturan: 'Peraturan',
  monografi: 'Monografi',
  artikel: 'Artikel',
  putusan: 'Putusan'
}

const route = useRoute()
const toast = useToast()

const { data, error, loading, reload } = useResource(
  signal => getDokumen(String(route.params.id), { signal }),
  {
    sources: [() => route.params.id],
    enabled: () => route.name === 'dokumen-detail'
  }
)
const d = computed(() => data.value)

useMeta(() => ({ title: d.value ? judulPendek(d.value) : 'Detail dokumen' }))

// Pesan awal tombol WhatsApp di halaman ini: judul dan tautan dokumen.
useWhatsappPesan(() =>
  d.value
    ? pesanDokumen(
        judulLengkap(d.value),
        `${window.location.origin}${route.path}`
      )
    : ''
)

const bernomor = computed(() => Boolean(d.value?.nomor && d.value?.tahun))
const heading = computed(() =>
  bernomor.value ? judulNomor(d.value) : d.value.judul || d.value.jenis
)
const tentang = computed(() => (bernomor.value ? d.value.judul : ''))

const utama = computed(
  () =>
    d.value?.lampiran.find(l => l.peran === 'utama') ??
    d.value?.lampiran[0] ??
    null
)
const abstrak = computed(
  () => d.value?.lampiran.find(l => l.peran === 'abstrak') ?? null
)
const unduh = l => lampiranUrl(d.value.id, l.id)

const kutipan = computed(
  () => d.value?.kutipan ?? (bernomor.value ? judulLengkap(d.value) : null)
)

const infoRows = computed(() => {
  const x = d.value
  if (!x) return []
  const rows = [
    ['Nomor Peraturan', x.nomor],
    ['Tahun Terbit', x.tahun],
    ['Tanggal Penetapan', formatDate(x.tanggalPenetapan)],
    ['Tanggal Pengundangan', formatDate(x.tanggalPengundangan)],
    ['Tempat Terbit', x.tempatTerbit],
    ['Bahasa', x.bahasa],
    ['Sumber', x.sumber],
    ['Pemrakarsa', x.pemrakarsa],
    ['Bidang Hukum', x.bidangHukum]
  ]
  return rows
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([label, value]) => ({ label, value }))
})

const relasiGroups = computed(() => {
  const r = d.value?.relasi
  if (!r) return []
  return [
    { label: 'Mencabut', items: r.mencabut },
    { label: 'Dicabut oleh', items: r.dicabutOleh },
    { label: 'Mengubah', items: r.mengubah },
    { label: 'Diubah oleh', items: r.diubahOleh }
  ].filter(g => g.items.length > 0)
})

async function salinKutipan() {
  toast.show(
    (await copyText(kutipan.value))
      ? 'Kutipan disalin'
      : 'Kutipan tidak dapat disalin'
  )
}

async function bagikan() {
  const hasil = await shareLink({
    title: judulLengkap(d.value),
    url: window.location.href
  })
  if (hasil === 'disalin') toast.show('Tautan disalin')
  else if (hasil === 'gagal') toast.show('Tautan tidak dapat dibagikan')
}
</script>
