-- Akun database untuk API: HANYA SELECT, hanya pada tabel yang dibaca API.
-- Tidak ada akses ke tabel akun/anggota/log (user, member, auth_*, visitor_log, dll).
-- Ganti {{DB}}, {{USER}}, {{HOST}}, dan {{PASSWORD}} (dibuat oleh pengelola database;
-- jangan simpan sandi di repo). scripts/load-db.mjs --grants merender templat ini untuk uji.
--
-- PRODUKSI (aaPanel/Baota, MySQL di container mysql_server): render dengan deploy/render-grants.sh
-- lalu alirkan ke `docker exec -i -e MYSQL_PWD mysql_server mysql -uroot` (lihat api/README.md,
-- bagian Docker). {{HOST}} = subnet jaringan baota_net, mis. '172.19.%' (bukan '%'). scripts/load-db.mjs
-- tidak boleh dipakai di produksi.

CREATE USER IF NOT EXISTS '{{USER}}'@'{{HOST}}' IDENTIFIED BY '{{PASSWORD}}';
-- Akun yang sudah ada tidak diubah oleh CREATE USER IF NOT EXISTS; ALTER USER memastikan
-- sandi akhirnya sama dengan yang diberikan (idempoten, aman dijalankan ulang).
ALTER USER '{{USER}}'@'{{HOST}}' IDENTIFIED BY '{{PASSWORD}}';

GRANT SELECT ON `{{DB}}`.`document`          TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`data_lampiran`     TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`data_status`       TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`data_subyek`       TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`data_pengarang`    TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`pengarang`         TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`tipe_pengarang`    TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`jenis_pengarang`   TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`document_type`     TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`frontend_config`   TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`hit_counter`       TO '{{USER}}'@'{{HOST}}';
GRANT SELECT ON `{{DB}}`.`download_counter`  TO '{{USER}}'@'{{HOST}}';

-- Penghitung dilihat/diunduh (document.hit_see, hit_download) hanya DIBACA oleh API.
-- Menaikkannya dari aplikasi baru butuh GRANT UPDATE terbatas pada dua kolom itu
-- (keputusan pemilik belum diambil): GRANT UPDATE (hit_see, hit_download) ON `{{DB}}`.`document` ...
