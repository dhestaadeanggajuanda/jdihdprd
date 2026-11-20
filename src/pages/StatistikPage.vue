<template>
  <div class="wrap">
    <div class="pagehead">
      <p class="crumbs">
        <NavLink to="/">Beranda</NavLink>
        <AppIcon name="chevron-right" size="xs" />
        <span>Statistik</span>
      </p>
      <h1>Statistik dokumen hukum</h1>
      <p>Ringkasan koleksi dan aktivitas pengunjung.</p>
    </div>

    <SkeletonCards v-if="loading && !s" :count="3" label="Memuat statistik" />
    <ErrorState v-else-if="error && !s" :error="error" @retry="reload" />

    <template v-else-if="s">
      <div class="kpis" role="list" aria-label="Ringkasan">
        <div v-for="k in kpis" :key="k.label" class="card kpi" role="listitem">
          <span class="l">{{ k.label }}</span>
          <span class="v">{{ formatNumber(k.value) }}</span>
          <span class="s">{{ k.sub }}</span>
        </div>
      </div>

      <div class="charts">
        <section class="card chart" aria-labelledby="c1">
          <h2 id="c1">Dokumen per jenis koleksi</h2>
          <p class="sub">Jumlah dokumen</p>
          <HBarChart :items="s.perKoleksi" />
          <ChartTable
            :columns="['Koleksi', 'Dokumen']"
            :rows="s.perKoleksi.map(r => [r.nama, formatNumber(r.jumlah)])"
          />
        </section>

        <section class="card chart" aria-labelledby="c2">
          <h2 id="c2">Status keberlakuan peraturan</h2>
          <p class="sub">{{ formatNumber(s.kpi.peraturanTotal) }} peraturan</p>
          <StatusBar
            :berlaku="s.statusPeraturan.berlaku"
            :berlaku-diubah="s.statusPeraturan.berlakuDiubah"
            :dicabut="s.statusPeraturan.dicabut"
          />
          <ChartTable
            open
            :columns="['Status', 'Peraturan']"
            :rows="statusRows"
          />
        </section>

        <section class="card chart" aria-labelledby="c3">
          <h2 id="c3">Peraturan per jenis</h2>
          <p class="sub">{{ s.perJenis.length }} jenis, dari yang terbanyak</p>
          <HBarChart :items="s.perJenis" />
          <ChartTable
            :columns="['Jenis', 'Peraturan']"
            :rows="s.perJenis.map(r => [r.nama, formatNumber(r.jumlah)])"
          />
        </section>

        <section class="card chart" aria-labelledby="c4">
          <h2 id="c4">Dokumen per tahun penetapan</h2>
          <p class="sub">{{ rentang }}</p>
          <YearColumns :items="s.perTahun" />
          <ChartTable
            :columns="['Tahun', 'Dokumen']"
            :rows="
              s.perTahun.map(r => [
                r.berjalan ? `${r.tahun} (berjalan)` : String(r.tahun),
                formatNumber(r.jumlah)
              ])
            "
          />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import SkeletonCards from '@/components/SkeletonCards.vue'
import ChartTable from '@/components/charts/ChartTable.vue'
import HBarChart from '@/components/charts/HBarChart.vue'
import StatusBar from '@/components/charts/StatusBar.vue'
import YearColumns from '@/components/charts/YearColumns.vue'
import { getStatistik } from '@/services/api.js'
import { useResource } from '@/composables/useResource.js'
import { formatNumber } from '@/utils/format.js'

const {
  data: s,
  error,
  loading,
  reload
} = useResource(signal => getStatistik({ signal }), {
  cacheKey: 'statistik',
  ttlMs: 5 * 60 * 1000
})

const kpis = computed(() => [
  { label: 'Total dokumen', value: s.value.kpi.total, sub: 'Semua koleksi' },
  {
    label: 'Peraturan berlaku',
    value: s.value.kpi.peraturanBerlaku,
    sub: `dari ${formatNumber(s.value.kpi.peraturanTotal)} peraturan`
  },
  {
    label: 'Dokumen dilihat',
    value: s.value.kpi.dilihat30h,
    sub: '30 hari terakhir'
  },
  {
    label: 'Dokumen diunduh',
    value: s.value.kpi.diunduh30h,
    sub: '30 hari terakhir'
  }
])

const statusRows = computed(() => {
  const { berlaku, berlakuDiubah, dicabut } = s.value.statusPeraturan
  const total = Math.max(1, berlaku + berlakuDiubah + dicabut)
  const row = (nama, n) => [
    nama,
    `${formatNumber(n)} (${Math.round((n / total) * 100)}%)`
  ]
  return [
    row('Berlaku', berlaku),
    row('Berlaku, pernah diubah', berlakuDiubah),
    row('Dicabut', dicabut)
  ]
})

const rentang = computed(() => {
  const t = s.value.perTahun
  if (t.length === 0) return ''
  const jumlah = t.reduce((n, r) => n + r.jumlah, 0)
  return `${t[0].tahun} sampai ${t[t.length - 1].tahun}, ${formatNumber(jumlah)} dari ${formatNumber(s.value.kpi.total)} dokumen`
})
</script>
