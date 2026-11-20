-- Data SINTETIS untuk uji integrasi. Bukan dokumen DPRD nyata.
-- Mengikuti konvensi skema JDIH: tipe_dokumen 1 peraturan, 2 monografi, 3 artikel, 4 putusan;
-- relasi ganda arah pada data_status; lampiran berupa nama berkas atau URL penuh.

INSERT INTO document_type (id, second_id, parent_id, name, singkatan, document_group_label, slug) VALUES
 (76, '2:76', 2, 'NASKAH AKADEMIK KEMENKUM', 'NASKAH AKADEMIK KEMENKUM', 'legislation_formation', 'naskah-akademik-kemenkum'),
 (77, '2:77', 2, 'NASKAH AKADEMIK', 'NASKAH AKADEMIK', 'legislation_formation', 'naskah-akademik'),
 (84, '1:84', 2, 'RANCANGAN PERATURAN PERUNDANG-UNDANGAN', 'RANCANGAN', 'legislation_formation', 'rancangan-puu'),
 (151, '2:148', 2, 'PROGRAM PENYUSUNAN PUU', 'PROGRAM PENYUSUNAN PUU', 'legislation_formation', 'program-penyusunan-puu'),
 (57, '1:57', 1, 'PERATURAN DAERAH KOTA', 'PERATURAN DAERAH KOTA', NULL, NULL);

INSERT INTO document
 (id, tipe_dokumen, judul, nomor_peraturan, dokumen_type_id, jenis_peraturan, singkatan_jenis, tanggal_penetapan,
  tanggal_pengundangan, tahun_terbit, status, is_publish, sembunyikan_di_opac, promosikan_ke_beranda, pemrakarsa,
  tempat_terbit, bahasa, sumber, bidang_hukum, hit_see, hit_download, created_at) VALUES
 (1, 1, 'Pengelolaan Barang Milik Daerah', '3', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2023-03-14', '2023-03-15', '2023', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', 'Singkawang', 'Indonesia', 'LD 2023 (3)', 'Hukum Administrasi Negara', 40, 12, '2023-03-20 08:00:00'),
 (2, 1, 'Retribusi Pelayanan Pasar', '7', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2019-08-21', '2019-08-22', '2019', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', 'Singkawang', 'Indonesia', 'LD 2019 (7)', 'Hukum Administrasi Negara', 128, 54, '2019-08-25 08:00:00'),
 (3, 1, 'Perubahan atas Peraturan Daerah Nomor 7 Tahun 2019 tentang Retribusi Pelayanan Pasar', '5', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2022-07-12', '2022-07-13', '2022', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', 'Singkawang', 'Indonesia', 'LD 2022 (5)', NULL, 10, 2, '2022-07-20 08:00:00'),
 (4, 1, 'Pajak Reklame', '2', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2012-01-19', NULL, '2012', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', NULL, NULL, NULL, NULL, 5, 1, '2012-01-25 08:00:00'),
 (5, 1, 'Pajak Daerah', '6', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2021-03-30', NULL, '2021', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', NULL, NULL, NULL, NULL, 9, 3, '2021-04-02 08:00:00'),
 (6, 1, 'Tata Cara Pemberian Insentif dan Kemudahan Penanaman Modal', '12', NULL, 'PERATURAN WALIKOTA', 'PERWALI', '2023-02-02', NULL, '2023', 'Berlaku', 1, NULL, 'Ya', 'Wali Kota Singkawang', NULL, NULL, NULL, NULL, 3, 0, '2023-02-05 08:00:00'),
 (7, 1, 'Tata Tertib Dewan Perwakilan Rakyat Daerah Kota Singkawang', '1', NULL, 'PERATURAN DPRD KOTA', '-', '2022-02-09', NULL, '2022', 'Berlaku', 1, NULL, 'Ya', 'DPRD Kota Singkawang', NULL, NULL, NULL, NULL, 7, 2, '2022-02-12 08:00:00'),
 (8, 1, 'Program Pembentukan Peraturan Daerah Tahun 2025', '8', NULL, 'KEPUTUSAN DPRD', '-', '2024-11-04', NULL, '2024', 'Berlaku', 1, NULL, 'Tidak', 'DPRD Kota Singkawang', NULL, NULL, NULL, NULL, 1, 0, '2024-11-06 08:00:00'),
 (9, 1, 'Retribusi Pasar', '4', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2011-04-04', NULL, '2011', 'Tidak Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', NULL, NULL, NULL, NULL, 2, 0, '2011-04-10 08:00:00'),
 (10, 1, 'Rancangan yang belum terbit', '9', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2024-12-01', NULL, '2024', 'Berlaku', 0, NULL, 'Ya', NULL, NULL, NULL, NULL, NULL, 0, 0, '2024-12-02 08:00:00'),
 (11, 1, 'Disembunyikan dari OPAC', '10', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2024-12-02', NULL, '2024', 'Berlaku', 1, 'Ya', 'Ya', NULL, NULL, NULL, NULL, NULL, 0, 0, '2024-12-03 08:00:00'),
 (12, 1, 'PENGELOLAAN SAMPAH RUMAH TANGGA', '1', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2024-05-01', NULL, '2024', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', NULL, NULL, NULL, NULL, 4, 1, '2024-05-05 08:00:00'),
 (13, 2, 'Kajian Hukum Daerah', NULL, NULL, 'BUKU HUKUM', 'BUKU HUKUM', NULL, NULL, '2024', 'Berlaku', 1, NULL, 'Ya', NULL, NULL, NULL, NULL, NULL, 2, 4, '2024-06-01 08:00:00'),
 (14, 3, 'Opini Hukum Pasar', NULL, NULL, 'MAJALAH HUKUM', '-', '2024-01-01', NULL, '2024', 'Berlaku', 1, NULL, 'Ya', NULL, NULL, NULL, NULL, NULL, 2, 2, '2024-06-02 08:00:00'),
 (15, 4, 'Perkara perdata', '1/A/2024/PT.TUN.JKT', NULL, 'PUTUSAN MAHKAMAH AGUNG', 'PUTUSAN MAHKAMAH AGUNG', '2024-01-01', NULL, '2024', 'Berlaku', 1, NULL, 'Ya', NULL, NULL, NULL, NULL, NULL, 2, 2, '2024-06-03 08:00:00'),
 (16, 2, 'Naskah Akademik Raperda Pajak', NULL, 77, 'NASKAH AKADEMIK', 'NASKAH AKADEMIK', NULL, NULL, '2024', 'Berlaku', 1, NULL, 'Ya', NULL, NULL, NULL, NULL, NULL, 1, 0, '2024-06-04 08:00:00'),
 (17, 1, 'Retribusi 100% _aman_ \\ uji', '20', 57, 'PERATURAN DAERAH KOTA', 'PERDA', '2024-07-01', NULL, '2024', 'Berlaku', 1, NULL, 'Ya', 'Pemerintah Kota Singkawang', NULL, NULL, NULL, NULL, 0, 0, '2024-07-02 08:00:00');

INSERT INTO data_lampiran (id, id_dokumen, judul_lampiran, url_lampiran, akses_lampiran, pembatasan_lampiran, status, urutan) VALUES
 (1, 1, 'Perda 3 Tahun 2023', 'perda-3-2023.pdf', NULL, NULL, 1, NULL),
 (2, 2, 'Perda 7 Tahun 2019', 'perda-7-2019.pdf', NULL, NULL, 1, 1),
 (3, 2, 'Abstrak Perda 7 Tahun 2019', 'abstrak-perda-7-2019.pdf', 'Terbuka', '-', 1, 2),
 (4, 3, 'Perda 5 Tahun 2022', 'https://bphn.jdihn.go.id/common/dokumen/perda5.pdf', NULL, NULL, 1, NULL),
 (5, 4, 'Perda 2 Tahun 2012', 'http://localhost/ildis/common/dokumen/perda2-2012.pdf', NULL, NULL, 1, NULL),
 (6, 6, 'Perwali 12 Tahun 2023', 'perwali-12-2023.pdf', 'Tertutup', NULL, 1, NULL),
 (7, 7, 'Host tidak diizinkan', 'https://evil.example.com/x.pdf', NULL, NULL, 1, NULL),
 (8, 8, 'Mencoba keluar folder', '../../etc/passwd', NULL, NULL, 1, NULL),
 (9, 9, 'Lampiran nonaktif', 'perda-4-2011.pdf', NULL, NULL, 0, NULL),
 (10, 10, 'Dokumen belum terbit', 'draf.pdf', NULL, NULL, 1, NULL),
 (11, 5, 'Dibatasi pembatasan', 'perda-6-2021.pdf', NULL, 'Hanya untuk internal', 1, NULL);

-- Relasi dua arah, seperti pada data nasional. Baris ke-9 menunjuk dokumen yang belum terbit (tidak boleh bocor).
INSERT INTO data_status (id, id_dokumen, status_peraturan, id_dokumen_target, catatan_status_peraturan, tanggal_perubahan, urutan) VALUES
 (1, 2, 'diubah', '3', NULL, '2022-07-12 00:00:00', 1),
 (2, 3, 'mengubah', '2', NULL, '2022-07-12 00:00:00', 1),
 (3, 2, 'mencabut', '9', NULL, NULL, 2),
 (4, 9, 'dicabut', '2', NULL, NULL, 1),
 (5, 4, 'dicabut', '5', NULL, '2021-03-30 00:00:00', 1),
 (6, 5, 'mencabut', '4', NULL, NULL, 1),
 (7, 1, '-', '', NULL, NULL, 1),
 (8, 1, 'diubah', '99999', NULL, NULL, 2),
 (9, 1, 'mengubah', '10', NULL, NULL, 3);

INSERT INTO data_subyek (id, id_dokumen, subyek, tipe_subyek, jenis_subyek) VALUES
 (1, 2, 'RETRIBUSI', 'x', 'x'), (2, 2, 'PASAR', 'x', 'x'), (3, 2, 'PELAYANAN PUBLIK', 'x', 'x'),
 (4, 1, 'ASET DAERAH', 'x', 'x'), (5, 4, 'PAJAK', 'x', 'x');

INSERT INTO pengarang (id, name) VALUES (1, 'Kota Singkawang'), (2, 'Dewan Perwakilan Rakyat Daerah Kota Singkawang');
INSERT INTO tipe_pengarang (id, name, status) VALUES (1, 'Nama Badan', '1');
INSERT INTO jenis_pengarang (id, name, status) VALUES (1, 'Badan', '1');
INSERT INTO data_pengarang (id, id_dokumen, nama_pengarang, tipe_pengarang, jenis_pengarang) VALUES
 (1, 2, 1, 1, 1), (2, 2, 2, 1, 1);

INSERT INTO frontend_config (id, nama_konfig, isi_konfig, jenis) VALUES
 (1, 'sekilas-sejarah', '<h4>Sekilas Sejarah</h4><p>Contoh sejarah.</p>', 'tentang-kami'),
 (2, 'dasar-hukum', '<ol><li>UU Nomor 14 Tahun 2008</li></ol><script>window.__xss=1</script><img src=x onerror=alert(1)>', 'tentang-kami'),
 (3, 'visi', '<p>Contoh visi.</p>', 'tentang-kami'),
 (4, 'misi', '<ol><li>Contoh misi.</li></ol>', 'tentang-kami'),
 (5, 'timpengelola', '<p>SK tim.</p>', 'tentang-kami'),
 (6, 'strukturjdih', 'struktur.png', 'tentang-kami'),
 (7, 'strukturbaghukum', '', 'tentang-kami'),
 (8, 'sop', 'sop.pdf', 'tentang-kami'),
 (9, 'instansi', 'JDIH DPRD KOTA SINGKAWANG', 'index');

INSERT INTO hit_counter (document_id, identifier, status, _created_time) VALUES
 ('2', 'a', 1, UTC_TIMESTAMP()), ('2', 'b', 1, UTC_TIMESTAMP() - INTERVAL 2 DAY), ('1', 'c', 1, UTC_TIMESTAMP() - INTERVAL 10 DAY),
 ('1', 'd', 1, UTC_TIMESTAMP() - INTERVAL 60 DAY), ('1', 'e', 1, UTC_TIMESTAMP() - INTERVAL 90 DAY);
INSERT INTO download_counter (document_id, identifier, status, _created_time) VALUES
 ('2', 'a', 1, UTC_TIMESTAMP() - INTERVAL 1 DAY), ('2', 'b', 1, UTC_TIMESTAMP() - INTERVAL 45 DAY);
