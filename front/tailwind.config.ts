import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  // Use JIT mode for faster builds
  mode: 'jit',
  // Optimize content scanning
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  // Optimize build performance
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true
  },
  // Disable unused variants
  variants: {
    extend: {}
  }
}
