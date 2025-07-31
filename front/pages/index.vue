
<script setup>
import { ref } from 'vue'

const title = ref('Human Art Archive')
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-6xl font-bold">Human Art Archive</h1>
    <NuxtLink to="/test" class="mt-8 text-xl text-blue-500 hover:underline">Go to Test Page</NuxtLink>
  </div>
</template>

<style scoped>

</style>