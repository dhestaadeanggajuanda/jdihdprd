// Rute aplikasi. Parameter rute divalidasi di definisi rute: nilai yang tidak
// cocok jatuh ke halaman 404 (OWASP A01/A03). meta.bar: main | title | back.
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'beranda',
        component: () => import('@/pages/IndexPage.vue'),
        meta: {
          bar: 'main',
          nav: 'beranda',
          title: 'JDIH DPRD Kota Singkawang'
        }
      },
      {
        path: 'dokumen',
        name: 'dokumen',
        component: () => import('@/pages/DokumenPage.vue'),
        meta: {
          bar: 'title',
          barTitle: 'Dokumen',
          nav: 'dokumen',
          title: 'Dokumen'
        }
      },
      {
        path: 'dokumen/:id(\\d{1,10})',
        name: 'dokumen-detail',
        component: () => import('@/pages/DokumenDetailPage.vue'),
        meta: {
          bar: 'back',
          barTitle: 'Detail dokumen',
          back: '/dokumen',
          nav: 'dokumen',
          title: 'Detail dokumen'
        }
      },
      {
        path: 'pembentukan-puu/:kategori([a-z0-9-]{1,120})?',
        name: 'puu',
        component: () => import('@/pages/PuuPage.vue'),
        meta: {
          bar: 'title',
          barTitle: 'Pembentukan PUU',
          nav: 'puu',
          app: 'dokumen',
          title: 'Pembentukan PUU'
        }
      },
      {
        path: 'berita',
        name: 'berita',
        component: () => import('@/pages/BeritaPage.vue'),
        meta: {
          bar: 'title',
          barTitle: 'Berita',
          nav: 'berita',
          title: 'Berita'
        }
      },
      {
        path: 'statistik',
        name: 'statistik',
        component: () => import('@/pages/StatistikPage.vue'),
        meta: {
          bar: 'title',
          barTitle: 'Statistik',
          nav: 'statistik',
          title: 'Statistik'
        }
      },
      {
        path: 'profil/:slug([a-z0-9-]{1,120})?',
        name: 'profil',
        component: () => import('@/pages/ProfilPage.vue'),
        meta: {
          bar: 'back',
          barTitle: 'Profil',
          back: '/info',
          nav: 'profil',
          app: 'profil',
          title: 'Profil'
        }
      },
      // Tautan lama (/tentang) tetap bekerja: pengalihan di dalam SPA ke /profil.
      {
        path: 'tentang/:slug([a-z0-9-]{1,120})?',
        redirect: to => ({
          path: to.params.slug ? `/profil/${to.params.slug}` : '/profil',
          query: to.query,
          hash: to.hash
        })
      },
      // Hub Profil untuk layar sempit: halaman instansi, kebijakan, notifikasi,
      // tampilan, dan tautan terkait. Alamat /info dipertahankan.
      {
        path: 'info',
        name: 'info',
        component: () => import('@/pages/InfoPage.vue'),
        meta: {
          bar: 'title',
          barTitle: 'Profil',
          nav: 'profil',
          app: 'profil',
          title: 'Profil'
        }
      },
      {
        path: 'kebijakan-privasi',
        name: 'kebijakan-privasi',
        component: () => import('@/pages/KebijakanPrivasiPage.vue'),
        meta: {
          bar: 'back',
          barTitle: 'Kebijakan Privasi',
          back: '/info',
          nav: 'profil',
          app: 'profil',
          title: 'Kebijakan Privasi'
        }
      },
      {
        path: 'kebijakan-cookie',
        name: 'kebijakan-cookie',
        component: () => import('@/pages/KebijakanCookiePage.vue'),
        meta: {
          bar: 'back',
          barTitle: 'Kebijakan Cookie',
          back: '/info',
          nav: 'profil',
          app: 'profil',
          title: 'Kebijakan Cookie'
        }
      },
      // Selalu terakhir: halaman tidak ditemukan tetap berada di dalam layout.
      {
        path: ':catchAll(.*)*',
        name: 'tidak-ditemukan',
        component: () => import('@/pages/ErrorNotFound.vue'),
        meta: { bar: 'main', nav: '', title: 'Halaman tidak ditemukan' }
      }
    ]
  }
]

export default routes
