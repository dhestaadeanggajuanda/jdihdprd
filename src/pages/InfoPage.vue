<template>
  <div class="wrap narrow">
    <div class="pagehead vh-compact">
      <h1>Info</h1>
      <p>Tentang JDIH, tampilan, notifikasi, dan tautan terkait.</p>
    </div>

    <section aria-labelledby="h-tentang">
      <h2 id="h-tentang" class="group-h">Tentang kami</h2>
      <div class="menu-list">
        <ErrorState
          v-if="listError && !daftar"
          :error="listError"
          @retry="reloadList"
        />
        <template v-else>
          <NavLink
            v-for="p in daftar ?? []"
            :key="p.slug"
            class="srow"
            :to="`/tentang/${p.slug}`"
          >
            <p>{{ p.grup ? `${p.grup}: ${p.judul}` : p.judul }}</p>
            <AppIcon name="chevron-right" />
          </NavLink>
          <div v-if="!daftar" class="srow" aria-hidden="true"
            ><span class="shimmer srow-sk"
          /></div>
        </template>
      </div>
    </section>

    <section id="notifikasi" aria-labelledby="h-notif">
      <h2 id="h-notif" class="group-h">Notifikasi</h2>
      <div class="menu-list">
        <div class="srow">
          <span class="lead-i"><AppIcon name="bell" /></span>
          <p>
            Peraturan baru
            <small>{{ dukungan.pesan }}</small>
          </p>
          <button
            class="switch"
            :class="{ on: notif.aktif }"
            type="button"
            role="switch"
            :aria-checked="notif.aktif"
            aria-label="Notifikasi peraturan baru"
            :disabled="dukungan.status !== 'tersedia'"
            @click="toggleNotif"
          />
        </div>
        <template v-if="dukungan.status === 'tersedia' && notif.aktif">
          <div v-for="j in JENIS_NOTIFIKASI" :key="j.kode" class="srow">
            <p class="srow-indent">{{ j.label }}</p>
            <button
              class="switch"
              :class="{ on: notif.jenis.includes(j.kode) }"
              type="button"
              role="switch"
              :aria-checked="notif.jenis.includes(j.kode)"
              :aria-label="j.label"
              @click="toggleJenis(j.kode)"
            />
          </div>
        </template>
      </div>
    </section>

    <section aria-labelledby="h-tampil">
      <h2 id="h-tampil" class="group-h">Tampilan</h2>
      <div class="menu-list">
        <div class="srow">
          <span class="lead-i"><AppIcon name="moon" /></span>
          <p>Tema<small>Ikuti sistem, terang, atau gelap</small></p>
        </div>
        <div class="srow">
          <div class="seg seg-full" role="group" aria-label="Tema">
            <button
              v-for="t in TEMA"
              :key="t.value"
              type="button"
              :aria-pressed="tampilan.theme === t.value"
              @click="setTheme(t.value)"
              >{{ t.label }}</button
            >
          </div>
        </div>
        <div class="srow">
          <span class="lead-i"><AppIcon name="type" /></span>
          <p
            >Ukuran teks<small
              >Mengikuti pengaturan sistem, dapat diperbesar di sini</small
            ></p
          >
        </div>
        <div class="srow">
          <div class="seg seg-full" role="group" aria-label="Ukuran teks">
            <button
              v-for="t in UKURAN"
              :key="t.value"
              type="button"
              :aria-pressed="tampilan.text === t.value"
              @click="setText(t.value)"
              >{{ t.label }}</button
            >
          </div>
        </div>
      </div>
    </section>

    <section aria-labelledby="h-link">
      <h2 id="h-link" class="group-h">Tautan terkait</h2>
      <div class="menu-list">
        <a
          v-for="l in RELATED_LINKS"
          :key="l.host"
          class="srow"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="lead-i"><AppIcon name="globe" /></span>
          <p>{{ l.nama }}<small>{{ l.host }}</small></p>
          <AppIcon name="external-link" size="sm" />
          <span class="sr">(dibuka di tab baru)</span>
        </a>
      </div>
    </section>

    <p class="muted version"
      >JDIH DPRD Kota Singkawang · versi {{ APP_VERSION }}</p
    >
  </div>

  <NotificationSheet v-model="sheetOpen" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import NotificationSheet from '@/components/NotificationSheet.vue'
import { APP_VERSION } from '@/config/env.js'
import { RELATED_LINKS } from '@/config/hosts.js'
import { getHalamanList } from '@/services/api.js'
import {
  JENIS_NOTIFIKASI,
  matikan,
  notificationSupport,
  ubahJenis,
  useNotifications
} from '@/services/notifications.js'
import { useAppearance } from '@/composables/useAppearance.js'
import { useResource } from '@/composables/useResource.js'

const TEMA = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' }
]
const UKURAN = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Besar' },
  { value: 'xlarge', label: 'Sangat besar' }
]

useMeta({ title: 'Info' })

const { state: tampilan, setTheme, setText } = useAppearance()
const { state: notif } = useNotifications()
const dukungan = computed(() => notificationSupport())
const sheetOpen = ref(false)

const {
  data: daftar,
  error: listError,
  reload: reloadList
} = useResource(signal => getHalamanList({ signal }), {
  cacheKey: 'halaman:daftar',
  ttlMs: 10 * 60 * 1000
})

function toggleNotif() {
  if (notif.aktif) matikan()
  else sheetOpen.value = true
}

function toggleJenis(kode) {
  const next = notif.jenis.includes(kode)
    ? notif.jenis.filter(k => k !== kode)
    : [...notif.jenis, kode]
  // Minimal satu jenis: bila habis, notifikasi dimatikan.
  if (next.length === 0) matikan()
  else ubahJenis(next)
}
</script>
