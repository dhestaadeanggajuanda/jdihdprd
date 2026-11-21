# Image API JDIH DPRD Kota Singkawang (Node + Fastify, baca-saja).
# Konteks build = folder api/ (lihat deploy/docker-compose.yml).
#
# Yang sengaja TIDAK masuk image: test/, db/ (skema dan seed), scripts/load-db.mjs (alat uji yang
# menulis ke database), README, berkas .env. Lihat .dockerignore.

ARG NODE_IMAGE=node:24-alpine

# --- Tahap 1: pasang dependensi produksi saja --------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: tidak ada skrip pasca-pasang dari paket pihak ketiga yang dijalankan saat build
# (tidak ada modul native pada dependensi API ini).
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
 && npm cache clean --force

# --- Tahap 2: image akhir -----------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app

# Kode dimiliki root dan hanya terbaca oleh pengguna `node`: proses tidak bisa mengubah kodenya.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Pengguna tanpa hak istimewa (uid 1000). Compose dapat menimpanya dengan `user:` bila berkas
# dokumen hanya terbaca oleh uid tertentu.
USER node
EXPOSE 3000

# /health memanggil SELECT 1 ke database: sehat = API hidup DAN database terjangkau.
# Memakai fetch bawaan Node (tidak ada curl/wget di image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

# Tanpa `npm start`: node menjadi proses utama sehingga SIGTERM dari `docker stop` sampai ke
# aplikasi (yang menutup server dan kolam koneksi dengan rapi).
CMD ["node", "src/index.js"]
