<script setup lang="ts">
import Search from '../components/search.vue'
import { filename } from 'pathe/utils'
const glob = import.meta.glob('@/assets/*.png', { eager: true })
const images = Object.fromEntries(
  Object.entries(glob).map(([key, value]) => [filename(key), value.default])
)
</script>
<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4">
    <img :src="images['logo']" width="200" height="200" alt="Human Art Archive Logo" class="mb-8" />
    <h1 class="text-5xl font-bold text-gray-800 mb-8 text-center">
      Human Art Archive
    </h1>
    <div class="flex justify-center w-full">
      <Search />
    </div>
    
    <div class="mt-8 flex gap-6">
      <NuxtLink 
        to="/search?q=version%3Aprimary" 
        class="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        View all art
      </NuxtLink>
      <NuxtLink 
        to="/help" 
        class="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        Help
      </NuxtLink>
      <NuxtLink 
        to="/advanced" 
        class="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        Advanced Search
      </NuxtLink>
      <NuxtLink 
        to="/about" 
        class="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        About
      </NuxtLink>
    </div>
    
  </div>
</template>
<style scoped>
</style>