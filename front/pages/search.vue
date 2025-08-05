<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <SearchResults :query="query" :is-admin="false" />
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'
import SearchResults from '../components/search_results.vue'

const route = useRoute()
const query = computed(() => route.query.q || '')

useHead({
  title: query.value ? `Search: ${query.value}` : 'Search Results'
})
</script>


