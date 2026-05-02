export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Minimalist Photography Blog',
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
  }
})
