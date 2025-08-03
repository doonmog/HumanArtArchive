<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Search Results
      </h1>
      <p v-if="query" class="text-gray-600 dark:text-gray-400">
        Showing results for: <span class="font-medium">"{{ query }}"</span>
      </p>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-12">
      <svg class="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Search Error
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        {{ error.message || 'An error occurred while searching' }}
      </p>
      <button @click="refresh()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        Try Again
      </button>
    </div>

    <div v-else-if="artworks && artworks.length === 0" class="text-center py-12">
      <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Results Found
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Try adjusting your search terms or browse all artwork.
      </p>
      <button @click="navigateTo('/')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        Back to Home
      </button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <div
        v-for="artwork in artworks"
        :key="artwork.artwork_id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
      >
        <div class="aspect-square bg-gray-100 dark:bg-gray-700 relative">
          <nuxt-img
            v-if="artwork.has_image"
            :src="`/api/image/${artwork.artwork_id}`"
            :alt="artwork.title"
            provider="backend"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
            {{ artwork.title }}
          </h3>
          <p v-if="artwork.artist" class="text-gray-600 dark:text-gray-400 text-xs mb-1">
            {{ artwork.artist }}
          </p>
          <p v-if="artwork.year" class="text-gray-500 dark:text-gray-500 text-xs">
            {{ artwork.year }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="artworks && artworks.length > 0" class="mt-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">
        Found {{ artworks.length }} artwork{{ artworks.length !== 1 ? 's' : '' }}
      </p>
    </div>
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'
const route = useRoute()
const query = computed(() => route.query.q || '')

const searchResults = ref(null)
const pending = ref(false)
const error = ref(null)

const fetchResults = async (searchQuery) => {
  
  try {
    pending.value = true
    error.value = null
    const response = await $fetch('/api/art', {
      query: { q: searchQuery }
    })
    searchResults.value = response
  } catch (err) {
    error.value = err
    searchResults.value = null
  } finally {
    pending.value = false
  }
}

const refresh = () => fetchResults(query.value)

const artworks = computed(() => searchResults.value?.artworks || [])

// Initial fetch
await fetchResults(query.value)

// Watch for query changes
watch(query, (newQuery) => {
  fetchResults(newQuery)
}, { immediate: false })

useHead({
  title: query.value ? `Search: ${query.value}` : 'Search Results'
})


</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
