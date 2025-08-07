<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <SearchResults :query="query" :page="currentPage" :is-admin="false" />
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'
import SearchResults from '../components/search_results.vue'

const route = useRoute()
const query = computed(() => route.query.q || '')
const currentPage = computed(() => {
  const page = parseInt(route.query.page) || 1
  return Math.max(1, page) // Ensure page is at least 1
})

useHead({
  title: query.value 
    ? currentPage.value > 1 
      ? `Search: ${query.value} (Page ${currentPage.value})` 
      : `Search: ${query.value}`
    : 'Search Results'
})
</script>


