
<script setup>
import Search from '../components/search.vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4">
    <h1 class="text-5xl font-bold text-gray-800 mb-8 text-center">
      Human Art Archive
    </h1>
    <div class="flex justify-center w-full">
      <Search />
    </div>
    
    <div class="mt-8 flex gap-6">
      <NuxtLink 
        to="/search?q=" 
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