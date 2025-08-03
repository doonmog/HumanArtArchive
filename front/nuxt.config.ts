// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/tailwindcss'],
  image: {
    providers: {
      backend: {
        name: 'backend',
        provider: '~/providers/backend.ts'
      }
    }
  },
  routeRules: {
    '/api/**': { proxy: 'http://back:3001/**' }
  }
})