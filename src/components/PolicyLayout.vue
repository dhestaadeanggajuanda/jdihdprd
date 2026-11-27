<template>
  <div class="wrap about">
    <ProfilNav :daftar="daftar" :kebijakan="kebijakan" />

    <div class="policy">
      <article class="prose">
        <p class="crumbs crumbs-top">
          <NavLink to="/">Beranda</NavLink>
          <AppIcon name="chevron-right" size="xs" />
          <NavLink to="/profil">Profil</NavLink>
          <AppIcon name="chevron-right" size="xs" />
          <span>{{ judul }}</span>
        </p>
        <h1>{{ judul }}</h1>
        <p class="policy-lead">{{ lead }}</p>
        <p class="policy-meta">
          <span v-if="!lengkap" class="badge sample">Naskah contoh</span>
          <span>Berlaku sejak <PolicyFill :value="KEBIJAKAN.berlaku" /></span>
          <span>Diperbarui <PolicyFill :value="KEBIJAKAN.diperbarui" /></span>
        </p>

        <section class="summary" aria-labelledby="sum">
          <h2 id="sum">Ringkasnya</h2>
          <ul>
            <slot name="ringkas" />
          </ul>
        </section>

        <details class="toc toc-inline">
          <summary
            >Di halaman ini<AppIcon name="chevron-down" size="sm"
          /></summary>
          <ol>
            <li v-for="s in toc" :key="s.id">
              <a :href="`#${s.id}`" @click.prevent="lompat(s.id)">{{
                s.label
              }}</a>
            </li>
          </ol>
        </details>

        <slot />

        <div v-if="!lengkap" class="note note-end">
          <AppIcon name="info" />
          <p
            >Naskah ini contoh untuk memperlihatkan tata letak dan nada bahasa.
            Isi akhir perlu ditinjau dan disahkan oleh instansi sebelum
            diterbitkan.</p
          >
        </div>
      </article>

      <nav class="toc toc-side" aria-label="Di halaman ini">
        <h2>Di halaman ini</h2>
        <ol>
          <li v-for="s in toc" :key="s.id">
            <a :href="`#${s.id}`" @click.prevent="lompat(s.id)">{{
              s.label
            }}</a>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import NavLink from './NavLink.vue'
import PolicyFill from './PolicyFill.vue'
import ProfilNav from './ProfilNav.vue'
import { KEBIJAKAN, isKebijakanLengkap } from '@/config/env.js'

// Kerangka halaman kebijakan: menu samping Profil, naskah, ringkasan, daftar isi
// (di dalam naskah < 1280 px, di samping >= 1280 px).
const props = defineProps({
  judul: { type: String, required: true },
  lead: { type: String, required: true },
  // 'privasi' | 'cookie'
  kebijakan: { type: String, required: true },
  // [{ id, label }]
  toc: { type: Array, required: true },
  daftar: { type: Array, default: () => [] },
  // Isian yang dipakai naskah ini menentukan apakah masih "Naskah contoh".
  asisten: { type: Boolean, default: false }
})

const router = useRouter()
const lengkap = computed(() =>
  isKebijakanLengkap(KEBIJAKAN, { asisten: props.asisten })
)

// Router (bukan jangkar bawaan) agar tetap benar di mode hash (aplikasi Android);
// fokus ikut ke judul bagian supaya urutan papan ketik berlanjut dari sana.
async function lompat(id) {
  await router.push({ hash: `#${id}` })
  await nextTick()
  const el = document.getElementById(id)
  if (el) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
}
</script>
