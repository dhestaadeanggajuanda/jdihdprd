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
        <h2>Tentang</h2>
        <NavLink to="/tentang/dasar-hukum">Dasar Hukum</NavLink>
        <NavLink to="/statistik">Statistik</NavLink>
        <NavLink to="/berita">Berita</NavLink>
        <NavLink to="/info">Pengaturan tampilan</NavLink>
      </div>
      <div v-if="CONTACT_LINES.length > 0">
        <h2>Kontak</h2>
        <template v-for="line in CONTACT_LINES" :key="line.text">
          <a v-if="line.href" :href="line.href">{{ line.text }}</a>
          <p v-else>{{ line.text }}</p>
        </template>
      </div>
    </div>
  </footer>
</template>

<script setup>
import NavLink from './NavLink.vue'
import logo from '@/assets/logo-jdih.png'
import { CONTACT_LINES } from '@/config/env.js'

const KOLEKSI_LINKS = [
  { tipe: 'peraturan', label: 'Peraturan Perundang-undangan' },
  { tipe: 'monografi', label: 'Monografi Hukum' },
  { tipe: 'artikel', label: 'Artikel dan Majalah Hukum' },
  { tipe: 'putusan', label: 'Putusan' }
]
</script>
