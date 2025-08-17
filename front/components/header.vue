<script setup lang="ts">
import { filename } from 'pathe/utils'

const glob = import.meta.glob('@/assets/*.png', { eager: true })
const images = Object.fromEntries(
  Object.entries(glob).map(([key, value]) => [filename(key), value.default])
)
</script>

<template>
  <header class="w-full p-4 bg-white shadow-sm">
    <div class="container mx-auto">
      <!-- Desktop layout (single row) - only visible at md breakpoint and above -->
      <nav class="hidden md:flex md:flex-row md:items-center md:justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-gray-600">
          <img :src="images['logo']" width="48" height="48" alt="Human Art Archive Logo" />
          Human Art Archive
        </NuxtLink>
        
        <div class="mx-4 flex-grow max-w-md">
          <Search />
        </div>
        
        <div class="flex gap-4">
          <NuxtLink to="/search?q=version%3Aprimary" class="text-gray-600 hover:text-gray-800">
            View all art
          </NuxtLink>
          <NuxtLink to="/help" class="text-gray-600 hover:text-gray-800">
            Help
          </NuxtLink>
          <NuxtLink to="/advanced" class="text-gray-600 hover:text-gray-800">
            Advanced Search
          </NuxtLink>
          <NuxtLink to="/about" class="text-gray-600 hover:text-gray-800">
            About
          </NuxtLink>
        </div>
      </nav>
      
      <!-- Mobile layout (three rows) - only visible below md breakpoint -->
      <nav class="flex flex-col md:hidden gap-4">
        <!-- First row: Logo and title -->
        <div class="flex items-center justify-center">
          <NuxtLink to="/" class="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-gray-600">
            <img :src="images['logo']" width="48" height="48" alt="Human Art Archive Logo" />
            Human Art Archive
          </NuxtLink>
        </div>
        
        <!-- Second row: Search bar -->
        <div class="w-full">
          <Search />
        </div>
        
        <!-- Third row: Navigation links -->
        <div class="flex flex-wrap gap-3 justify-center">
          <NuxtLink to="/search?q=version%3Aprimary" class="text-gray-600 hover:text-gray-800 px-2 py-1">
            View all art
          </NuxtLink>
          <NuxtLink to="/help" class="text-gray-600 hover:text-gray-800 px-2 py-1">
            Help
          </NuxtLink>
          <NuxtLink to="/advanced" class="text-gray-600 hover:text-gray-800 px-2 py-1">
            Advanced Search
          </NuxtLink>
          <NuxtLink to="/about" class="text-gray-600 hover:text-gray-800 px-2 py-1">
            About
          </NuxtLink>
        </div>
      </nav>
    </div>
  </header>
</template>