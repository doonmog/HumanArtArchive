// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  modules: ['@nuxt/image', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],
  routeRules: {
    '/api/**': { proxy: 'http://back:3001/**' }
  },
  build: {
    transpile: ['@nuxt/ui'],
    // Optimize build process
    analyze: process.env.ANALYZE === 'true'
  },
  experimental: {
    payloadExtraction: true,
    asyncContext: true
  },
  // Optimize Nuxt UI - using only what we need
  ui: {},
  // Optimize Nitro for production
  nitro: {
    minify: true,
    compressPublicAssets: true
  },
  // Optimize Vite
  vite: {
    build: {
      cssMinify: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production'
        }
      }
    }
  }
})