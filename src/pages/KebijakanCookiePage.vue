<template>
  <PolicyLayout
    judul="Kebijakan Cookie"
    lead="Apa yang disimpan di perangkat Anda saat memakai situs web dan aplikasi JDIH DPRD Kota Singkawang."
    kebijakan="cookie"
    :toc="TOC"
    :daftar="daftar"
    :asisten="adaAsisten"
  >
    <template #ringkas>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Situs dan aplikasi ini tidak memasang cookie.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Tidak ada cookie pelacak, iklan, atau analitik, baik dari kami maupun
          pihak ketiga.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Hanya pilihan Anda sendiri (tampilan, aksesibilitas, dan notifikasi)
          disimpan di perangkat Anda, dan tidak pernah dikirim ke server.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Karena itu tidak ada spanduk persetujuan: tidak ada yang perlu Anda
          terima atau tolak.</span
        >
      </li>
    </template>

    <h2 id="s1">1. Cookie dan penyimpanan lokal</h2>
    <p
      >Cookie adalah berkas kecil yang dikirim server, disimpan peramban, lalu
      dikirim kembali pada setiap permintaan. Penyimpanan lokal mirip, tetapi
      isinya hanya tinggal di perangkat Anda dan tidak ikut terkirim ke
      server.</p
    >

    <h2 id="s2">2. Yang disimpan di perangkat Anda</h2>
    <p><b>Cookie: tidak ada.</b> Penyimpanan lokal: tiga entri berikut.</p>
    <div class="tbl-wrap">
      <table class="tbl">
        <caption class="sr">Data yang disimpan di perangkat Anda</caption>
        <thead>
          <tr>
            <th scope="col">Nama</th>
            <th scope="col">Isi dan fungsi</th>
            <th scope="col">Jenis</th>
            <th scope="col">Lama simpan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in ENTRI" :key="e.nama">
            <th scope="row" data-l="Nama">
              <code>{{ e.nama }}</code>
            </th>
            <td data-l="Isi dan fungsi">{{ e.isi }}</td>
            <td data-l="Jenis">Penyimpanan lokal, pihak pertama</td>
            <td data-l="Lama simpan">Sampai Anda menghapusnya</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p
      >Peramban Anda juga menyimpan berkas situs (skrip, gambar, huruf) di cache
      agar halaman cepat dimuat. Itu pengaturan peramban dan bukan
      cookie.<template v-if="adaAsisten">
        Percakapan dengan Asisten AI tidak disimpan di perangkat Anda: ia hilang
        saat halaman ditutup.</template
      ></p
    >

    <h2 id="s3">3. Mengapa tanpa spanduk persetujuan</h2>
    <p
      >Ketiga entri hanya berisi pilihan yang Anda atur sendiri, tidak memuat
      data pribadi, dan tidak dikirim ke server. Tidak ada cookie opsional yang
      bisa Anda terima atau tolak, jadi spanduk persetujuan tidak diperlukan.</p
    >
    <p
      >Bila suatu saat kami menambah layanan yang memakai cookie atau pihak
      ketiga, halaman ini diperbarui dan persetujuan Anda diminta lebih dulu.</p
    >

    <h2 id="s4">4. Pihak ketiga</h2>
    <p
      >Berita dimuat dari Media Center Kota Singkawang tanpa cookie dari kami.
      Bila Anda membuka artikel di situs Media Center, JDIH Nasional, BPHN, atau
      situs lain, kebijakan cookie situs itulah yang berlaku.</p
    >

    <h2 id="s5">5. Mengelola data tersimpan</h2>
    <p>Anda dapat menghapus ketiga entri kapan saja.</p>
    <div class="manage">
      <button class="btn btn-outline" type="button" @click="hapus">
        <AppIcon name="trash" />Hapus data tersimpan
      </button>
      <p
        >Tema dan ukuran teks kembali ke bawaan, pilihan aksesibilitas dan
        notifikasi dimatikan. Tidak memengaruhi apa pun di server.</p
      >
    </div>
    <p
      >Cara lain: hapus data situs ini lewat pengaturan peramban, atau di
      aplikasi Android lewat pengaturan penyimpanan aplikasi pada perangkat
      Anda. Pertanyaan dapat disampaikan kepada
      <PolicyFill
        :value="KEBIJAKAN.kontak"
        hint="unit pengelola dan kontak"
      />.</p
    >
  </PolicyLayout>
</template>

<script setup>
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import PolicyFill from '@/components/PolicyFill.vue'
import PolicyLayout from '@/components/PolicyLayout.vue'
import { KEBIJAKAN } from '@/config/env.js'
import { ASISTEN_AKTIF } from '@/config/fitur.js'
import { useProfilDaftar } from '@/composables/useProfilDaftar.js'
import { useToast } from '@/composables/useToast.js'
import { hapusDataTersimpan } from '@/services/dataTersimpan.js'

const TOC = [
  { id: 's1', label: 'Cookie dan penyimpanan lokal' },
  { id: 's2', label: 'Yang disimpan di perangkat Anda' },
  { id: 's3', label: 'Mengapa tanpa spanduk persetujuan' },
  { id: 's4', label: 'Pihak ketiga' },
  { id: 's5', label: 'Mengelola data tersimpan' }
]

// Daftar ini harus sama dengan STORAGE_KEYS di services/dataTersimpan.js.
const ENTRI = [
  {
    nama: 'jdih:tampilan',
    isi: 'Pilihan tema (sistem, terang, gelap) dan ukuran teks.'
  },
  {
    nama: 'jdih:aksesibilitas',
    isi: 'Pilihan aksesibilitas di situs web: kontras tinggi, jarak teks, garis bawah tautan, hentikan animasi, skala abu-abu, dan kursor besar. Tidak ada di aplikasi Android.'
  },
  {
    nama: 'jdih:notifikasi',
    isi: 'Apakah notifikasi peraturan baru diaktifkan dan jenis peraturan yang dipilih.'
  }
]

const adaAsisten = ASISTEN_AKTIF
const { daftar } = useProfilDaftar()
const { show } = useToast()

useMeta({ title: 'Kebijakan Cookie' })

async function hapus() {
  await hapusDataTersimpan()
  show('Data tersimpan dihapus. Pilihan kembali ke bawaan.')
}
</script>
