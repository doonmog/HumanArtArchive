<template>
  <div class="relative w-full max-w-md">
    <form @submit.prevent="handleSearch" class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search artwork..."
        class="w-full px-4 py-2.5 pr-12 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none border-0 rounded-full placeholder-gray-400 transition-colors"
        @keyup.enter="handleSearch"
      />
      <button
        type="submit"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        @click="handleSearch"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'

const searchQuery = ref('')

const handleSearch = () => {
  navigateTo(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
}
</script>