<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <SearchResults :query="query" :page="currentPage" :is-admin="isAdmin" />
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

// Check if user is admin
const isAdmin = ref(false)

onMounted(async () => {
  try {
    const token = useCookie('admin-token')
    if (token.value) {
      const response = await $fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      if (response.username) {
        isAdmin.value = true
      }
    }
  } catch (error) {
    // Not an admin or token invalid, isAdmin remains false
    isAdmin.value = false
  }
})

useHead({
  title: query.value 
    ? currentPage.value > 1 
      ? `Search: ${query.value} (Page ${currentPage.value})` 
      : `Search: ${query.value}`
    : 'Search Results'
})
</script>


