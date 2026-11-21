#!/usr/bin/env bash
# Merender api/db/grants.sql (templat) menjadi SQL siap jalan di stdout. Untuk PRODUKSI;
# api/scripts/load-db.mjs hanya untuk database uji dan menolak nama database selain test/tmp/dev.
#
# Nilai dibaca dari variabel lingkungan (sandi tidak muncul di daftar argumen proses):
#   DB_NAME          nama database JDIH
#   DB_RO_USER       nama akun, mis. jdih_ro
#   DB_RO_HOST       pola host akun = subnet baota_net, mis. 172.19.%  (lihat api/README.md)
#   DB_RO_PASSWORD   sandi akun: huruf/angka/_/- minimal 16 karakter (mis. openssl rand -hex 24)
#
# Contoh (jalankan oleh pengelola database; sandi root MySQL tidak lewat berkas ini):
#   read -rs -p 'Sandi akun API: ' DB_RO_PASSWORD; export DB_RO_PASSWORD; echo
#   DB_NAME=db_jdih DB_RO_USER=jdih_ro DB_RO_HOST='172.19.%' bash deploy/render-grants.sh \
#     | docker exec -i -e MYSQL_PWD mysql_server mysql -uroot
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tpl="${GRANTS_TEMPLATE:-$here/../api/db/grants.sql}"

die() { echo "render-grants: $*" >&2; exit 1; }

: "${DB_NAME:?isi DB_NAME}" "${DB_RO_USER:?isi DB_RO_USER}" "${DB_RO_HOST:?isi DB_RO_HOST}" "${DB_RO_PASSWORD:?isi DB_RO_PASSWORD}"
[[ -r "$tpl" ]] || die "templat tidak terbaca: $tpl"

[[ "$DB_NAME" =~ ^[A-Za-z0-9_]{1,64}$ ]]    || die "DB_NAME hanya huruf/angka/_ (maks 64)"
[[ "$DB_RO_USER" =~ ^[A-Za-z0-9_]{1,32}$ ]] || die "DB_RO_USER hanya huruf/angka/_ (maks 32)"
[[ "$DB_RO_PASSWORD" =~ ^[A-Za-z0-9_-]{16,128}$ ]] \
  || die "DB_RO_PASSWORD harus 16-128 karakter huruf/angka/_/- (mis. openssl rand -hex 24)"

# Host akun: localhost, satu IP, atau pola subnet seperti 172.19.% atau 172.19.0.%.
# Ditolak: "%" (semua host), awalan "%", dan pola tanpa oktet depan, karena itu membuka akun ke
# luar subnet baota_net.
[[ "$DB_RO_HOST" == "localhost" || "$DB_RO_HOST" =~ ^[0-9]{1,3}(\.([0-9]{1,3}|%)){0,3}$ ]] \
  || die "DB_RO_HOST harus berupa subnet seperti 172.19.% (bukan % atau nama bebas)"
[[ "$DB_RO_HOST" == "localhost" || "$DB_RO_HOST" =~ ^[0-9]{1,3}\. ]] \
  || die "DB_RO_HOST harus diawali satu oktet angka, mis. 172.%"

DB_NAME="$DB_NAME" DB_RO_USER="$DB_RO_USER" DB_RO_HOST="$DB_RO_HOST" DB_RO_PASSWORD="$DB_RO_PASSWORD" \
awk '
  {
    gsub(/\{\{DB\}\}/, ENVIRON["DB_NAME"])
    gsub(/\{\{USER\}\}/, ENVIRON["DB_RO_USER"])
    gsub(/\{\{HOST\}\}/, ENVIRON["DB_RO_HOST"])
    gsub(/\{\{PASSWORD\}\}/, ENVIRON["DB_RO_PASSWORD"])
    print
  }
' "$tpl"
