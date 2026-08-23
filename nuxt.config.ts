import { getBlogSourceEntries } from './content/blog-source'

const blogRoutes = getBlogSourceEntries()
  .filter(entry => entry.status !== 'draft')
  .map(entry => entry.route)

const rssRoutes = ['/rss/en.xml', '/rss/zh-tw.xml']

export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/i18n'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  css: [
    '@fontsource-variable/inter/wght.css',
    '@fontsource-variable/noto-sans-tc/wght.css',
    'leaflet/dist/leaflet.css',
    'leaflet.markercluster/dist/MarkerCluster.css',
    '~/assets/css/main.css'
  ],
  nitro: {
    prerender: {
      routes: [...blogRoutes, ...rssRoutes]
    }
  },
  app: {
    head: {
      title: 'Wayne Jin',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.svg' },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Wayne Jin — Photography Stories',
          href: 'https://waynelens.dev/rss/en.xml'
        },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Wayne Jin — 攝影故事',
          href: 'https://waynelens.dev/rss/zh-tw.xml'
        }
      ],
      meta: [
        { name: 'description', content: 'A narrative-driven photography blog built with Nuxt.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  content: {
    build: {
      markdown: {
        toc: {
          depth: 3,
          searchDepth: 3
        }
      }
    }
  },
  i18n: {
    defaultLocale: 'zh-TW',
    strategy: 'no_prefix',
    lazy: true,
    langDir: 'locales',
    locales: [
      { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
