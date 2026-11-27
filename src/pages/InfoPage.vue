<template>
  <div class="wrap narrow">
    <div class="pagehead vh-compact">
      <h1>Profil</h1>
      <p
        >Profil instansi, kebijakan, notifikasi, tampilan, dan tautan
        terkait.</p
      >
    </div>

    <section aria-labelledby="h-profil">
      <h2 id="h-profil" class="group-h">Profil instansi</h2>
      <div class="menu-list">
        <ErrorState
          v-if="listError && !daftarData"
          :error="listError"
          @retry="reloadList"
        />
        <template v-else>
          <NavLink
            v-for="p in daftar"
            :key="p.slug"
            class="srow"
            :to="`/profil/${p.slug}`"
          >
            <p>{{ p.grup ? `${p.grup}: ${p.judul}` : p.judul }}</p>
            <AppIcon name="chevron-right" />
          </NavLink>
          <div v-if="!daftarData" class="srow" aria-hidden="true"
            ><span class="shimmer srow-sk"
          /></div>
        </template>
      </div>
    </section>

    <section aria-labelledby="h-kebijakan">
      <h2 id="h-kebijakan" class="group-h">Kebijakan</h2>
      <div class="menu-list">
        <NavLink class="srow" to="/kebijakan-privasi">
          <span class="lead-i"><AppIcon name="shield" /></span>
          <p>Privasi<small>Data yang diproses dan hak Anda</small></p>
          <AppIcon name="chevron-right" />
        </NavLink>
        <NavLink class="srow" to="/kebijakan-cookie">
          <span class="lead-i"><AppIcon name="cookie" /></span>
          <p>Cookie<small>Yang disimpan di perangkat Anda</small></p>
          <AppIcon name="chevron-right" />
        </NavLink>
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

    <section id="tampilan" aria-labelledby="h-tampil">
      <h2 id="h-tampil" class="group-h">Tampilan</h2>
      <div class="menu-list">
        <!-- Di web, baris di bawah 1024 px; dari 1024 px pilihan yang sama ada di
             panel aksesibilitas (satu baris pembuka). Di Android tema dan ukuran
             teks selalu tampil di sini dan tidak ada pilihan aksesibilitas. -->
        <div class="srow" :class="{ 'below-lg': !native }">
          <span class="lead-i"><AppIcon name="moon" /></span>
          <p>Tema<small>Ikuti sistem, terang, atau gelap</small></p>
        </div>
        <div class="srow" :class="{ 'below-lg': !native }">
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
        <div class="srow" :class="{ 'below-lg': !native }">
          <span class="lead-i"><AppIcon name="type" /></span>
          <p
            >Ukuran teks<small
              >Mengikuti pengaturan sistem, dapat diperbesar di sini</small
            ></p
          >
        </div>
        <div class="srow" :class="{ 'below-lg': !native }">
          <div class="seg seg-full" role="group" aria-label="Ukuran teks">
            <button
              v-for="t in UKURAN_TEKS"
              :key="t.value"
              type="button"
              :aria-pressed="tampilan.text === t.value"
              @click="setText(t.value)"
              >{{ t.label }}</button
            >
          </div>
        </div>

        <template v-if="!native">
          <div class="srow below-lg">
            <span class="lead-i"><AppIcon name="accessibility" /></span>
            <p
              >Aksesibilitas<small
                >Pilihan tambahan agar mudah dibaca. Disimpan di perangkat
                ini.</small
              ></p
            >
          </div>
          <button
            v-for="o in PILIHAN_A11Y"
            :key="o.flag"
            type="button"
            class="srow srow-sw below-lg"
            :class="{ 'fine-only': o.halus }"
            role="switch"
            :aria-checked="a11y[o.flag]"
            @click="toggleA11y(o.flag)"
          >
            <p>{{ o.label }}<small>{{ o.petunjuk }}</small></p>
            <span
              class="switch"
              :class="{ on: a11y[o.flag] }"
              aria-hidden="true"
            />
          </button>
          <div class="srow below-lg">
            <button
              type="button"
              class="btn btn-outline btn-block"
              @click="reset"
            >
              <AppIcon name="reset" />Atur ulang semua
            </button>
          </div>
          <button
            type="button"
            class="srow srow-open only-lg"
            @click="bukaPanel"
          >
            <span class="lead-i"><AppIcon name="accessibility" /></span>
            <p
              >Aksesibilitas dan tampilan<small
                >Buka panel: tema, ukuran teks, kontras, dan lainnya</small
              ></p
            >
            <AppIcon name="chevron-right" />
          </button>
        </template>
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
import { useMeta, Platform } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import NavLink from '@/components/NavLink.vue'
import NotificationSheet from '@/components/NotificationSheet.vue'
import { APP_VERSION } from '@/config/env.js'
import { RELATED_LINKS } from '@/config/hosts.js'
import { PILIHAN_A11Y, TEMA, UKURAN_TEKS } from '@/config/aksesibilitas.js'
import {
  JENIS_NOTIFIKASI,
  matikan,
  notificationSupport,
  ubahJenis,
  useNotifications
} from '@/services/notifications.js'
import { useA11yPanel } from '@/composables/useA11yPanel.js'
import { useAppearance } from '@/composables/useAppearance.js'
import { useProfilDaftar } from '@/composables/useProfilDaftar.js'

useMeta({ title: 'Profil' })

// Aplikasi Android memakai pengaturan aksesibilitas sistem: tanpa widget dan
// tanpa pilihan aksesibilitas di sini.
const native = Platform.is.capacitor

const {
  state: tampilan,
  a11y,
  setTheme,
  setText,
  toggleA11y,
  reset
} = useAppearance()
const { show: tampilkanPanel } = useA11yPanel()
const { state: notif } = useNotifications()
const dukungan = computed(() => notificationSupport())
const sheetOpen = ref(false)

const {
  data: daftarData,
  daftar,
  error: listError,
  reload: reloadList
} = useProfilDaftar()

function bukaPanel(event) {
  tampilkanPanel(event.currentTarget)
}

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
