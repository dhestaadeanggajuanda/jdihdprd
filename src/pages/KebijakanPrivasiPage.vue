<template>
  <PolicyLayout
    judul="Kebijakan Privasi"
    lead="Data apa yang diproses saat Anda memakai JDIH DPRD Kota Singkawang (situs web dan aplikasi Android), untuk apa, dan apa hak Anda."
    kebijakan="privasi"
    :toc="TOC"
    :daftar="daftar"
    :asisten="adaAsisten"
  >
    <template #ringkas>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Tanpa akun dan tanpa formulir: kami tidak meminta nama, email, atau
          nomor telepon.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Tanpa pelacak, iklan, dan analitik perilaku.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span v-if="adaAsisten"
          >Yang tercatat hanya data teknis permintaan di log server untuk
          keamanan dan pemeliharaan, serta pertanyaan yang Anda ketik ke Asisten
          AI (tanpa identitas).</span
        ><span v-else
          >Yang tercatat hanya data teknis permintaan di log server untuk
          keamanan dan pemeliharaan.</span
        >
      </li>
      <li>
        <AppIcon name="check-circle" size="sm" /><span
          >Berita dimuat dari Media Center Kota Singkawang, sehingga server
          mereka melihat alamat IP Anda.<template v-if="adaWhatsapp">
            Tombol WhatsApp membuka WhatsApp (Meta) hanya saat Anda
            menekannya.</template
          ></span
        >
      </li>
    </template>

    <h2 id="s1">1. Siapa kami</h2>
    <p
      >JDIH DPRD Kota Singkawang dikelola oleh DPRD Kota Singkawang sebagai
      bagian dari Jaringan Dokumentasi dan Informasi Hukum Nasional. Pertanyaan
      tentang kebijakan ini dapat disampaikan kepada
      <PolicyFill
        :value="KEBIJAKAN.kontak"
        hint="unit pengelola dan kontak"
      />.</p
    >

    <h2 id="s2">2. Data yang kami proses</h2>
    <p
      >Anda tidak perlu membuat akun, mengisi formulir, atau memberikan data
      pribadi untuk mencari, membaca, dan mengunduh dokumen.</p
    >
    <p
      >Saat Anda memakai layanan ini, server dapat mencatat data teknis
      permintaan, misalnya alamat IP, waktu, halaman atau berkas yang diminta,
      dan jenis peramban. Kata kunci yang Anda ketik di kolom pencarian dikirim
      ke server sebagai bagian dari permintaan, jadi ikut tercatat. Catatan ini
      disimpan paling lama <PolicyFill :value="KEBIJAKAN.simpanLog" />.</p
    >
    <p
      ><b>Pilihan di perangkat Anda.</b> Pilihan tampilan, aksesibilitas, dan
      notifikasi disimpan di perangkat Anda sendiri dan tidak dikirim ke server.
      Rinciannya ada di
      <NavLink to="/kebijakan-cookie">Kebijakan Cookie</NavLink>.</p
    >

    <h2 id="s3">3. Untuk apa data dipakai</h2>
    <p
      >Untuk menjalankan pencarian dan unduhan, menjaga keamanan dan
      ketersediaan layanan (misalnya mendeteksi penyalahgunaan), dan memperbaiki
      gangguan. Data ini tidak dipakai untuk iklan, tidak dijual, dan tidak
      dipakai untuk menyusun profil perilaku.</p
    >

    <h2 id="s4">4. Pihak ketiga</h2>
    <p
      ><b>Media Center Kota Singkawang.</b> Daftar berita dan gambarnya dimuat
      langsung dari mediacenter.singkawangkota.go.id. Karena itu server Media
      Center menerima alamat IP Anda. Pada permintaan itu kami tidak mengirim
      cookie maupun alamat halaman asal.</p
    >
    <p
      ><b>Tautan keluar.</b> JDIH Nasional, BPHN, dan situs lain di luar layanan
      ini memakai kebijakan mereka sendiri.</p
    >
    <p
      ><b>Notifikasi.</b> Notifikasi peraturan baru di aplikasi Android bersifat
      pilihan dan belum aktif pada versi ini. Bila nanti diaktifkan, layanan
      pengiriman yang dipakai disebut di halaman ini dan baru berjalan setelah
      Anda mengaktifkannya sendiri.</p
    >
    <p v-if="adaAsisten"
      ><b>Asisten AI.</b> Pertanyaan yang Anda ketik ke Asisten JDIH diproses
      oleh model AI di
      <PolicyFill :value="KEBIJAKAN.asistenLokasi" hint="lokasi pemrosesan" />.
      Pertanyaan dan jawabannya dicatat tanpa identitas (alamat IP hanya
      disimpan dalam bentuk sandi satu arah) paling lama
      <PolicyFill :value="KEBIJAKAN.asistenSimpan" />. Jangan menuliskan data
      pribadi pada pertanyaan Anda. Jawaban dihasilkan otomatis dan bukan
      nasihat hukum resmi.</p
    >
    <p v-if="adaWhatsapp"
      ><b>WhatsApp.</b> Tombol WhatsApp hanya membuka percakapan di aplikasi
      atau situs WhatsApp (Meta) saat Anda menekannya. Kami tidak memuat skrip
      WhatsApp, dan pesan awal (termasuk judul dokumen yang sedang Anda lihat)
      baru terkirim bila Anda menekan kirim. Sejak itu kebijakan WhatsApp yang
      berlaku.</p
    >

    <h2 id="s5">5. Aplikasi Android</h2>
    <p
      >Aplikasi hanya meminta izin akses internet (izin notifikasi baru diminta
      bila Anda mengaktifkannya). Aplikasi tidak mengakses kontak, lokasi,
      kamera, atau mikrofon, mematikan pencadangan otomatis, dan hanya
      berkomunikasi lewat HTTPS.</p
    >

    <h2 id="s6">6. Keamanan</h2>
    <p
      >Layanan ini hanya membaca data: tidak ada fitur untuk mengirim atau
      mengubah data dokumen. Seluruh komunikasi memakai HTTPS dan permintaan
      dikirim tanpa cookie atau kredensial. Tidak ada sistem yang sepenuhnya
      kebal; bila Anda menemukan celah, mohon laporkan lewat kontak pada bagian
      1.</p
    >

    <h2 id="s7">7. Hak Anda dan perubahan kebijakan</h2>
    <p
      >Menurut Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data
      Pribadi, Anda berhak meminta informasi, mengakses, memperbaiki, dan
      menghapus data pribadi Anda, menarik persetujuan, serta mengajukan
      keberatan. Karena layanan ini tidak menyimpan data yang terhubung dengan
      akun, permintaan semacam itu menyangkut catatan teknis di log server.
      Sampaikan lewat kontak pada bagian 1.</p
    >
    <p
      >Perubahan kebijakan diumumkan di halaman ini beserta tanggal
      pembaruannya.</p
    >
  </PolicyLayout>
</template>

<script setup>
import { useMeta } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import NavLink from '@/components/NavLink.vue'
import PolicyFill from '@/components/PolicyFill.vue'
import PolicyLayout from '@/components/PolicyLayout.vue'
import { KEBIJAKAN } from '@/config/env.js'
import { ASISTEN_AKTIF, WHATSAPP_AKTIF } from '@/config/fitur.js'
import { useProfilDaftar } from '@/composables/useProfilDaftar.js'

const TOC = [
  { id: 's1', label: 'Siapa kami' },
  { id: 's2', label: 'Data yang kami proses' },
  { id: 's3', label: 'Untuk apa data dipakai' },
  { id: 's4', label: 'Pihak ketiga' },
  { id: 's5', label: 'Aplikasi Android' },
  { id: 's6', label: 'Keamanan' },
  { id: 's7', label: 'Hak Anda dan perubahan kebijakan' }
]

// Butir Asisten AI dan WhatsApp hanya terbit bila fiturnya benar-benar aktif.
const adaAsisten = ASISTEN_AKTIF
const adaWhatsapp = WHATSAPP_AKTIF

const { daftar } = useProfilDaftar()

useMeta({ title: 'Kebijakan Privasi' })
</script>
