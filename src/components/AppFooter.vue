<template>
  <footer class="footer">
    <div class="wrap footer-cols">
      <div>
        <span class="plate">
          <img
            :src="logo"
            width="160"
            height="40"
            alt="JDIH DPRD Kota Singkawang"
          />
        </span>
        <p class="footer-about">
          Portal produk hukum dan dokumentasi hukum DPRD Kota Singkawang.
        </p>
      </div>
      <div>
        <h2>Dokumen</h2>
        <NavLink
          v-for="k in KOLEKSI_LINKS"
          :key="k.tipe"
          :to="{ path: '/dokumen', query: { tipe: k.tipe } }"
        >
          {{ k.label }}
        </NavLink>
      </div>
      <div>
        <h2>Profil</h2>
        <NavLink
          v-for="p in PROFIL_LINKS"
          :key="p.slug"
          :to="`/profil/${p.slug}`"
        >
          {{ p.label }}
        </NavLink>
        <!-- Web >= 1024 px: membuka panel aksesibilitas. Selain itu (dan di
             Android): menuju bagian Tampilan di Profil. -->
        <NavLink
          :class="{ 'below-lg': !native }"
          :to="{ path: '/info', hash: '#tampilan' }"
        >
          Pengaturan tampilan
        </NavLink>
        <button
          v-if="!native"
          ref="panelBtn"
          type="button"
          class="fbtn only-lg"
          @click="tampilkanPanel(panelBtn)"
        >
          Pengaturan tampilan
        </button>
      </div>
      <div v-if="CONTACT_LINES.length > 0">
        <h2>Kontak</h2>
        <template v-for="line in CONTACT_LINES" :key="line.text">
          <a v-if="line.href" :href="line.href">{{ line.text }}</a>
          <p v-else>{{ line.text }}</p>
        </template>
      </div>
    </div>
    <div class="wrap">
      <div class="legal">
        <p>© DPRD Kota Singkawang</p>
        <nav aria-label="Kebijakan situs">
          <NavLink to="/kebijakan-privasi">Kebijakan Privasi</NavLink>
          <NavLink to="/kebijakan-cookie">Kebijakan Cookie</NavLink>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { Platform } from 'quasar'
import NavLink from './NavLink.vue'
import logo from '@/assets/logo-jdih.png'
import { CONTACT_LINES } from '@/config/env.js'
import { useA11yPanel } from '@/composables/useA11yPanel.js'

const KOLEKSI_LINKS = [
  { tipe: 'peraturan', label: 'Peraturan Perundang-undangan' },
  { tipe: 'monografi', label: 'Monografi Hukum' },
  { tipe: 'artikel', label: 'Artikel dan Majalah Hukum' },
  { tipe: 'putusan', label: 'Putusan' }
]

// Slug halaman Profil dari backend (lihat DDL dan seed): bila tidak ada, halaman
// Profil menampilkan keadaan "tidak ditemukan", bukan galat.
const PROFIL_LINKS = [
  { slug: 'sekilas-sejarah', label: 'Sekilas Sejarah' },
  { slug: 'dasar-hukum', label: 'Dasar Hukum' },
  { slug: 'visi', label: 'Visi dan Misi' },
  { slug: 'jdih-instansi', label: 'Struktur Organisasi' }
]

const native = Platform.is.capacitor
const panelBtn = ref(null)
const { show: tampilkanPanel } = useA11yPanel()
</script>
