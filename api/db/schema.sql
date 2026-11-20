-- Skema JDIH DPRD Kota Singkawang (HANYA STRUKTUR; tanpa data dan tanpa VIEW lama).
-- Diekstrak dari dump asli (MySQL 8.4). Jangan tambahkan INSERT ke berkas ini.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `_new_konfigurasi_frontend` (
  `id` int NOT NULL AUTO_INCREMENT,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `header1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `header2` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `struktur_organisasi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `footer_bawah` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `youtube` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `abstrak` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `subjek` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ambil dari database subjek',
  `tahun` smallint DEFAULT NULL,
  `singkatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isi_abstrak_1` text COLLATE utf8mb4_unicode_ci,
  `isi_abstrak_2` text COLLATE utf8mb4_unicode_ci,
  `isi_abstrak_3` text COLLATE utf8mb4_unicode_ci,
  `catatan_1` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `catatan_2` text COLLATE utf8mb4_unicode_ci,
  `catatan_3` text COLLATE utf8mb4_unicode_ci,
  `catatan_4` text COLLATE utf8mb4_unicode_ci,
  `catatan_5` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `agenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_trail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uri` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `response` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_assignment` (
  `item_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`item_name`,`user_id`),
  KEY `idx-auth_assignment-user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_item` (
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` smallint NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `rule_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` blob,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  PRIMARY KEY (`name`),
  KEY `idx-auth_item-type` (`type`),
  KEY `rule_name` (`rule_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_item_child` (
  `parent` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `child` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`parent`,`child`),
  KEY `child` (`child`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_rule` (
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` blob,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bahasa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `berita` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bidang_hukum` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `integrasi` int DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `buku_tamu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_tamu` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institusi_tamu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_masuk` date DEFAULT NULL,
  `anggota` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keperluan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `catatan_verifikasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dokumen_id` int NOT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `circulation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int DEFAULT NULL,
  `member` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `item_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_pinjam` date DEFAULT NULL,
  `tanggal_kembali` date DEFAULT NULL,
  `status` int DEFAULT NULL,
  `denda` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status_peminjaman` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `daerah` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9532 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dasar_hukum` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isi` text COLLATE utf8mb4_unicode_ci,
  `dokumen` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_lampiran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `judul_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fulltext` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `akses_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dokumen_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pembatasan_lampiran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT '1',
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_dokumen` (`id_dokumen`),
  KEY `judul_lampiran` (`judul_lampiran`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_pengarang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `nama_pengarang` int DEFAULT NULL,
  `tipe_pengarang` int DEFAULT NULL,
  `jenis_pengarang` int DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_dokumen` (`id_dokumen`),
  KEY `idjp_fk` (`jenis_pengarang`),
  KEY `idtp_fk` (`tipe_pengarang`),
  KEY `nama_pengarang` (`nama_pengarang`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `status_peraturan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_dokumen_target` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_status_peraturan` text COLLATE utf8mb4_unicode_ci,
  `tanggal_perubahan` datetime DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_dokumen` (`id_dokumen`),
  KEY `id_dokumen_target` (`id_dokumen_target`)
) ENGINE=InnoDB AUTO_INCREMENT=40240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_subyek` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `subyek` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_subyek` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_subyek` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_dokumen` (`id_dokumen`),
  KEY `subyek` (`subyek`)
) ENGINE=InnoDB AUTO_INCREMENT=77608 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `denda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_detail_peminjaman` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tunai` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_denda` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_denda` date DEFAULT NULL,
  `member_id` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `detail_peminjaman` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_peminjaman` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_buku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tgl_pinjam` date DEFAULT NULL,
  `tgl_kembali` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jumlah_perpanjangan` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `detail_reservasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_reservasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_buku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tgl_reservasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipe_dokumen` int DEFAULT NULL,
  `judul` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `teu` text COLLATE utf8mb4_unicode_ci,
  `nomor_peraturan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_panggil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dokumen_type_id` int DEFAULT NULL COMMENT 'penambahan baru',
  `bentuk_peraturan` text COLLATE utf8mb4_unicode_ci,
  `jenis_peraturan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '-',
  `singkatan_jenis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '-',
  `cetakan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_terbit` text COLLATE utf8mb4_unicode_ci,
  `penerbit` text COLLATE utf8mb4_unicode_ci,
  `tanggal_penetapan` date DEFAULT NULL,
  `deskripsi_fisik` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sumber` text COLLATE utf8mb4_unicode_ci,
  `isbn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bahasa` text COLLATE utf8mb4_unicode_ci,
  `bidang_hukum` text COLLATE utf8mb4_unicode_ci,
  `nomor_induk_buku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `singkatan_bentuk` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe_koleksi_nomor_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pola_nomor_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jumlah_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kala_terbit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tahun_terbit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_dibacakan` date DEFAULT NULL,
  `pernyataan_tanggung_jawab` text COLLATE utf8mb4_unicode_ci,
  `edisi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gmd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul_seri` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `klasifikasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `info_detil_spesifik` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `abstrak` text COLLATE utf8mb4_unicode_ci,
  `gambar_sampul` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sembunyikan_di_opac` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `promosikan_ke_beranda` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Ya',
  `status_terakhir` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Berlaku',
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `inisiatif` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pemrakarsa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_pengundangan` date DEFAULT NULL,
  `daerah` int DEFAULT NULL,
  `penandatanganan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lembaga_peradilan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pemohon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `termohon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_perkara` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_klasifikasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amar_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `berkekuatan_hukum_tetap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urusan_pemerintahan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_status_peraturan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hit_see` int DEFAULT NULL,
  `hit_download` int DEFAULT NULL,
  `sumber_perolehan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_publish` int DEFAULT '0',
  `subjek_data` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'slug',
  PRIMARY KEY (`id`),
  KEY `judul` (`judul`(255)),
  KEY `nomor_peraturan` (`nomor_peraturan`),
  KEY `tahun_terbit` (`tahun_terbit`),
  KEY `tipe_dokumen` (`tipe_dokumen`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document_terkait` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `id_dokumen_terkait` int DEFAULT NULL,
  `document_terkait` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_docter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_docter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `second_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `singkatan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_group_label` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_document_type_slug` (`slug`),
  KEY `name` (`name`),
  KEY `parent_id` (`parent_id`),
  KEY `second_id` (`second_id`),
  KEY `idx_document_group_label` (`document_group_label`)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `download_counter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identifier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT '1',
  `_created_by` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `eksemplar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `kode_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_panggil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_inventaris` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lokasi_rak` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe_lokasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_pemesanan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tgl_pemesanan` date DEFAULT NULL,
  `tgl_penerimaan` date DEFAULT NULL,
  `agen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sumber_perolehan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faktur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tgl_faktur` date DEFAULT NULL,
  `harga` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `barcode_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_dokumen` (`id_dokumen`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `footer_link` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#',
  `icon_class` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `open_in_new_tab` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx-footer_link-section_id` (`section_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `footer_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nav',
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `frontend_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_konfig` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isi_konfig` text COLLATE utf8mb4_unicode_ci,
  `default` text COLLATE utf8mb4_unicode_ci,
  `jenis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gmd` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gmd_` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hasil_uji_materi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `hasil_uji_materi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_hasum` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_hasum` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hit_counter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identifier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT '1',
  `_created_by` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inisialisasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_inisialisasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gmd` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipe_koleksi` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lokasi` int DEFAULT NULL,
  `lokasi_rak` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `klasifikasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_dimulai` date DEFAULT NULL,
  `tanggal_berakhir` date DEFAULT NULL,
  `status` int DEFAULT NULL,
  `pelaksana` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `integrasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `_created_by` int DEFAULT NULL,
  `_updated_by` int DEFAULT NULL,
  `_created_time` datetime NOT NULL,
  `_updated_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `call_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coll_type_id` int DEFAULT NULL,
  `item_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inventory_code` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `supplier_id` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_no` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_id` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `item_status_id` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` int DEFAULT '0',
  `invoice` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `_created_by` int DEFAULT NULL,
  `_updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `gmd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_code` (`item_code`),
  KEY `biblio_id_idx` (`id_dokumen`),
  KEY `item_references_idx` (`coll_type_id`,`location_id`,`item_status_id`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jenis_pengarang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orders` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kabupaten` (
  `id` char(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `id_kab` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `regencies_province_id_index` (`province_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kala_terbit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kategori` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kecamatan` (
  `id` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `regency_id` char(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `id_kec` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `districts_id_index` (`regency_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `klasifikasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_pustakawan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `controller` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dokumen_id` int DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `aksi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_user` (
  `id_log_user` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `waktu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_user` int DEFAULT NULL,
  PRIMARY KEY (`id_log_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lokasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `makna_logo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image` text COLLATE utf8mb4_unicode_ci,
  `isi` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `master_kepuasan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keterangan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  `member_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `member_type_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_address` text COLLATE utf8mb4_unicode_ci,
  `member_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personal_id_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inst_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_image` text COLLATE utf8mb4_unicode_ci,
  `member_ktp` text COLLATE utf8mb4_unicode_ci,
  `member_since_date` date DEFAULT NULL,
  `register_date` date DEFAULT NULL,
  `expire_date` date DEFAULT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `auth_key` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `member_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama tipe Member',
  `loan_limit` int NOT NULL COMMENT 'jumlah_maksimal_peminjaman',
  `loan_periode` int NOT NULL COMMENT 'lama_maksimal_peminjaman',
  `enable_reserve` int NOT NULL DEFAULT '0' COMMENT 'status aktif/tidak',
  `reserve_limit` int NOT NULL DEFAULT '0' COMMENT 'jumlah_maksimal_reservasi',
  `member_periode` int NOT NULL COMMENT 'masa_berlaku_member',
  `reborrow_limit` int NOT NULL COMMENT 'maksimal perpanjangan',
  `fine_each_day` int NOT NULL COMMENT 'denda_perhari',
  `grace_periode` int DEFAULT '0' COMMENT 'toleransi_keterlambatan',
  `input_date` date NOT NULL,
  `last_update` date DEFAULT NULL,
  `id_tipe_koleksi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_tipe_gmd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_type_name` (`member_type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `menu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent` int DEFAULT NULL,
  `route` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` int DEFAULT NULL,
  `data` blob,
  PRIMARY KEY (`id`),
  KEY `parent` (`parent`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migration` (
  `version` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
  `apply_time` int DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `notif` (
  `id_notifikasi` int NOT NULL AUTO_INCREMENT,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waktu` time DEFAULT NULL,
  `id_terkait` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT '0',
  `notif_to` int DEFAULT NULL,
  PRIMARY KEY (`id_notifikasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pcounter_save` (
  `save_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `save_value` int unsigned NOT NULL,
  PRIMARY KEY (`save_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pcounter_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_ip` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_time` int unsigned NOT NULL,
  `creation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `peminjaman` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `penerbit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pengarang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `peraturan_terkait` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `peraturan_terkait` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_perter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_perter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pola_eksemplar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pattern` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suffix` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `length` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=390 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `previleges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_previleges` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordering` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uri` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  `ket` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flagsub` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `provinsi` (
  `id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `putusan_terkait` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int NOT NULL,
  `putusan_terkait` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kasasi_puter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banding_puter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pertama_puter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `urutan` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rekaman_aktif` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inisialisasi` int DEFAULT NULL,
  `id_eksemplar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  `aktif` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `report` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jalan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `provinsi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode_pos` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `telepon` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `faksimili` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_utama` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sop_pengolahan_jdih` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_biro` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip_biro` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pangkat_biro` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `klasifikasi_pendidikan_biro` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_sub` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip_sub` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pangkat_sub` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `klasifikasi_pendidikan_sub` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_jfu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip_jfu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pangkat_jfu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `klasifikasi_pendidikan_jfu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `undang_undang` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_pemerintah_pengganti_uu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_pemerintah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_presiden` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_menteri` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_daerah_provinsi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_daerah_kabupaten` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_daerah_kota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_gubernur` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_bupati` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peraturan_walikota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `buku_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jurnal_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hasil_penelitian_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hasil_pengkajian_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `naskah_akademis` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `rancangan_peraturan_daerah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `keputusan_pengadilan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `yurispundensi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `artikel_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kliping_koran_berita_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `lain_lain` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_pedoman` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_pedoman_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_iventarisasi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_iventarisasi_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_katalogisasi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_katalogisasi_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_abstrak` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_abstrak_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_indeks` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_indeks_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_majalah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_majalah_jumlah` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_katalogisasi_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sudah_katalogisasi_jumlah_hukum` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruang_kerja` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruang_koleksi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruang_baca` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `meja_baca` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kursi_baca` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `komputer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanner` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `koneksi_internet` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `mesin_fotocopy` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `writer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `telepon_sarana` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fak` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `lain` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `telah_otomasi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `memiliki_permasalahan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `memiliki_situs` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `melakukan_pemutaakhiran` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `web_dikelola` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_bimtek` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_bimtek` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_bimtek` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_sos` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_sos` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_sos` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_mon` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_mon` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_mon` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_koor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_koor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_koor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_rakor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_rakor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_rakor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_kons` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_kons` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_kons` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_mengikuti` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_mengikuti` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_mengikuti` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_kerja` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_kerja` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_kerja` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_kerjasama` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_kerjasama` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_kerjasama` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_kegiatan_mitra` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `jml_peserta_mitra` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ket_mitra` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_prov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_prov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_prov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_kab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_kab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_kab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_kota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_kota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_kota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_dewprov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_dewprov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_dewprov` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_dewpkab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_dewpkab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_dewpkab` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_negri` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_negri` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_negri` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pengelola_jdih_swasta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_jdih_swasta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_integrasi_swasta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `otomasi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `permasalahan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `situs_jdih` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pemutakhiran` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `web_yg_dikelola` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `_created_by` int NOT NULL,
  `_updated_by` int NOT NULL,
  `_created_time` datetime NOT NULL,
  `_updated_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role` (
  `id_role` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_previleges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_previleges` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1987 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `saran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saran` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `schema_migration` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sejarah` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isi` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_opname` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_inventarisasi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmd` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_koleksi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lokasi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lokasi_rak` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `klasifikasi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stok_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_dibuat` datetime NOT NULL,
  `tanggal_selesai` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  `updated_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_opname_eksemplar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode_eksemplar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `dokumen_id` int NOT NULL,
  `tahun` smallint NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_opname_monografi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dokumen` int DEFAULT NULL,
  `tahun` smallint DEFAULT NULL,
  `jumlah_eksemplar` int DEFAULT NULL,
  `jumlah_scan` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_opname_tahun` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tahun` smallint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_search_result` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_stock_opname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomor_panggil_doc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_by` int NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `struktur_organisasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `survey_kepuasan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tingkat_kepuasan` int DEFAULT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `isi` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sysparam` (
  `id` int NOT NULL AUTO_INCREMENT,
  `groups` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `long_value` text COLLATE utf8mb4_unicode_ci,
  `order_param` int DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tempat_penetapan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `integrasi` int DEFAULT '1',
  `_created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `_created_time` datetime DEFAULT NULL,
  `_updated_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6761 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tipe_kata_kunci` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orders` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tipe_koleksi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tipe_pengarang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orders` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `update_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version_from` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_to` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `backup_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx-update_log-status` (`status`),
  KEY `idx-update_log-version_to` (`version_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `urusan_pemerintahan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_key` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` smallint NOT NULL DEFAULT '10',
  `suspended_until` datetime DEFAULT NULL,
  `created_at` int NOT NULL,
  `updated_at` int NOT NULL,
  `picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'avatar.png',
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `password_reset_token` (`password_reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_key` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` smallint NOT NULL DEFAULT '10',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `password_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_member_profile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `member_type_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_address` text COLLATE utf8mb4_unicode_ci,
  `member_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personal_id_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inst_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_image` text COLLATE utf8mb4_unicode_ci,
  `member_since_date` date DEFAULT NULL,
  `register_date` date DEFAULT NULL,
  `expire_date` date DEFAULT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `visi_misi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visi_misi` text COLLATE utf8mb4_unicode_ci,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `visitor_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visitor_fingerprint` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_cookie_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visit_date` date NOT NULL,
  `visit_time` datetime NOT NULL,
  `is_unique` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visitor_log_fingerprint_date` (`visitor_fingerprint`,`visit_date`),
  KEY `idx_visitor_log_document_date` (`document_id`,`visit_date`),
  KEY `idx_visitor_log_visit_time` (`visit_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4973 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `visitor_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stat_type` enum('daily','weekly','monthly','yearly','all_time') COLLATE utf8mb4_unicode_ci NOT NULL,
  `stat_date` date NOT NULL,
  `document_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_visits` int unsigned NOT NULL DEFAULT '0',
  `unique_visits` int unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_visitor_stats_type_date_doc` (`stat_type`,`stat_date`,`document_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
