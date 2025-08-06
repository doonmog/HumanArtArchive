<template>
  <div class="relative">
    <div class="mb-8">
      <h1 v-if="tagInfo" class="text-4xl font-bold text-black mb-2">
        {{ tagInfo.name }}
      </h1>
      <h1 v-else class="text-3xl font-bold text-black mb-2">
        Search Results
      </h1>
      <p v-if="tagInfo && tagInfo.description" class="text-lg text-black mb-4">
        {{ tagInfo.description }}
      </p>
      <p v-if="query" class="text-gray-600">
        Showing results for: <span class="font-medium">"{{ query }}"</span>
      </p>
    </div>

    <!-- Admin selection controls -->
    <div v-if="isAdmin && artworks.length > 0" class="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isSomeSelected && !isAllSelected"
              @change="toggleSelectAll"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-700">
              {{ selectedCount === 0 ? 'Select All Visible' : 
                 isAllSelected ? 'Deselect All' : 
                 `Selected ${selectedCount} of ${totalSelectableCount}` }}
            </span>
          </label>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="selectedCount > 0" class="text-sm text-gray-600">
            {{ selectedImages.size }} image{{ selectedImages.size !== 1 ? 's' : '' }} selected
            from {{ selectedArtworks.size }} artwork{{ selectedArtworks.size !== 1 ? 's' : '' }}
          </span>
          <button
            v-if="selectedCount > 0"
            @click="openEditSidebar"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Selected
          </button>
        </div>
      </div>
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
        :key="`${artwork.artwork_id}-${artwork.image_id || 'no-image'}`"
        class="artwork-card bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden relative group"
        :class="{ 'ring-2 ring-blue-500': isAdmin && selectedImages.has(artwork.image_id) }"
      >
        <!-- Selection checkbox for admin -->
        <div v-if="isAdmin" class="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            :checked="artwork.image_id ? selectedImages.has(artwork.image_id) : selectedArtworks.has(artwork.artwork_id)"
            @change="toggleSelection(artwork)"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <NuxtLink
          :to="getArtworkLink(artwork)"
          class="block cursor-pointer hover:scale-105 transition-transform duration-200"
        >
        <div class="aspect-square bg-gray-100 dark:bg-gray-700 relative">
          <nuxt-img
            v-if="artwork.has_image && artwork.image_id"
            :src="`/api/image-by-id/${artwork.image_id}`"
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
          
          <div class="artwork-info absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <h3 class="font-semibold text-white text-sm mb-1 line-clamp-2">
              {{ artwork.title }}
            </h3>
            <p v-if="artwork.artist" class="text-gray-200 text-xs mb-1">
              {{ artwork.artist }}
            </p>
            <p v-if="artwork.year" class="text-gray-300 text-xs">
              {{ artwork.year }}
            </p>
          </div>
        </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Pagination Info -->
    <div v-if="pagination" class="mt-8 text-center">
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Showing {{ artworks.length }} of {{ pagination.totalItems }} artwork{{ pagination.totalItems !== 1 ? 's' : '' }}
        (Page {{ pagination.currentPage }} of {{ pagination.totalPages }})
      </p>
    </div>

    <!-- Pagination Controls -->
    <div v-if="pagination && pagination.totalPages > 1" class="mt-6 flex justify-center items-center space-x-2">
      <!-- Previous Button -->
      <button
        @click="prevPage"
        :disabled="!pagination.hasPrevPage"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <!-- Page Numbers -->
      <div class="flex space-x-1">
        <!-- First page -->
        <button
          v-if="pagination.currentPage > 3"
          @click="goToPage(1)"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          1
        </button>
        <span v-if="pagination.currentPage > 4" class="px-2 py-2 text-gray-500">...</span>

        <!-- Pages around current page -->
        <button
          v-for="page in getVisiblePages()"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md',
            page === pagination.currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>

        <!-- Last page -->
        <span v-if="pagination.currentPage < pagination.totalPages - 3" class="px-2 py-2 text-gray-500">...</span>
        <button
          v-if="pagination.currentPage < pagination.totalPages - 2"
          @click="goToPage(pagination.totalPages)"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {{ pagination.totalPages }}
        </button>
      </div>

      <!-- Next Button -->
      <button
        @click="nextPage"
        :disabled="!pagination.hasNextPage"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>

    <!-- Edit Sidebar -->
    <div v-if="isAdmin && showEditSidebar" class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Bulk Edit Tags
          </h2>
          <button
            @click="closeEditSidebar"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <p class="text-sm text-gray-600">
            Adding tags to {{ selectedImages.size }} image{{ selectedImages.size !== 1 ? 's' : '' }}
            from {{ selectedArtworks.size }} artwork{{ selectedArtworks.size !== 1 ? 's' : '' }}
          </p>
        </div>

        <BulkAddTags
          :artwork-ids="Array.from(selectedArtworks)"
          :image-ids="Array.from(selectedImages)"
          @tags-applied="onBulkTagsApplied"
        />
      </div>
    </div>

    <!-- Sidebar overlay -->
    <div
      v-if="isAdmin && showEditSidebar"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeEditSidebar"
    ></div>
  </div>
</template>

<script setup>
import BulkAddTags from './bulk_add_tags.vue'

const props = defineProps({
  query: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

// Multi-select state for admin
const selectedArtworks = ref(new Set())
const selectedImages = ref(new Set())
const showEditSidebar = ref(false)

const searchResults = ref(null)
const pending = ref(false)
const error = ref(null)
const tagInfo = ref(null)
const currentPage = ref(1)
const itemsPerPage = 60

const fetchResults = async (searchQuery, page = 1) => {
  try {
    pending.value = true
    error.value = null
    tagInfo.value = null
    
    const response = await $fetch('/api/art', {
      query: { 
        q: searchQuery,
        page: page,
        limit: itemsPerPage
      }
    })
    searchResults.value = response
    currentPage.value = page
    
    // Check if this is a single tag search
    if (searchQuery && !searchQuery.includes(' ') && !searchQuery.includes(':') && !searchQuery.includes('-')) {
      try {
        const tagResponse = await $fetch(`/api/tag-by-name/${encodeURIComponent(searchQuery)}`)
        tagInfo.value = tagResponse.tag
      } catch (tagErr) {
        console.error('Error fetching tag info:', tagErr)
      }
    }
  } catch (err) {
    error.value = err
    searchResults.value = null
  } finally {
    pending.value = false
  }
}

const refresh = () => {
  currentPage.value = 1
  fetchResults(props.query, 1)
}

const artworks = computed(() => searchResults.value?.artworks || [])
const pagination = computed(() => searchResults.value?.pagination || null)

const getArtworkLink = (artwork) => {
  const baseUrl = props.isAdmin ? '/admin/artwork' : '/artwork'
  const params = new URLSearchParams()
  params.set('id', artwork.artwork_id)
  if (artwork.image_id) {
    params.set('image_id', artwork.image_id)
  }
  return `${baseUrl}?${params.toString()}`
}

// Multi-select computed properties
const totalSelectableCount = computed(() => {
  return artworks.value.length
})

const selectedCount = computed(() => {
  return selectedImages.value.size
})

const isAllSelected = computed(() => {
  return artworks.value.length > 0 && 
    artworks.value.every(artwork => {
      return artwork.image_id ? selectedImages.value.has(artwork.image_id) : false
    })
})

const isSomeSelected = computed(() => {
  return selectedCount.value > 0 && !isAllSelected.value
})

// Multi-select methods
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Clear all selections
    selectedArtworks.value.clear()
    selectedImages.value.clear()
  } else {
    // Select all images and their artworks
    artworks.value.forEach(artwork => {
      if (artwork.artwork_id && !selectedArtworks.value.has(artwork.artwork_id)) {
        selectedArtworks.value.add(artwork.artwork_id)
      }
      if (artwork.image_id && !selectedImages.value.has(artwork.image_id)) {
        selectedImages.value.add(artwork.image_id)
      }
    })
  }
}

const toggleSelection = (artwork) => {
  // Toggle image selection
  if (artwork.image_id) {
    if (selectedImages.value.has(artwork.image_id)) {
      selectedImages.value.delete(artwork.image_id)
      
      // Check if this was the last image from this artwork
      const hasMoreImagesFromArtwork = artworks.value.some(item => 
        item.artwork_id === artwork.artwork_id && 
        item.image_id !== artwork.image_id && 
        selectedImages.value.has(item.image_id)
      )
      
      // If no more images from this artwork are selected, remove artwork from selection
      if (!hasMoreImagesFromArtwork) {
        selectedArtworks.value.delete(artwork.artwork_id)
      }
    } else {
      selectedImages.value.add(artwork.image_id)
      selectedArtworks.value.add(artwork.artwork_id)
    }
  }
}

const openEditSidebar = () => {
  showEditSidebar.value = true
}

const closeEditSidebar = () => {
  showEditSidebar.value = false
}

const onBulkTagsApplied = () => {
  // Clear selections and close sidebar after successful bulk tag application
  selectedArtworks.value.clear()
  selectedImages.value.clear()
  closeEditSidebar()
  // Optionally refresh results to show updated tags
  fetchResults(props.query, currentPage.value)
}

// Pagination navigation functions
const goToPage = (page) => {
  if (page >= 1 && page <= (pagination.value?.totalPages || 1)) {
    // Clear selections when changing pages
    selectedArtworks.value.clear()
    selectedImages.value.clear()
    fetchResults(props.query, page)
  }
}

const nextPage = () => {
  if (pagination.value?.hasNextPage) {
    goToPage(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (pagination.value?.hasPrevPage) {
    goToPage(currentPage.value - 1)
  }
}

const getVisiblePages = () => {
  if (!pagination.value) return []
  
  const current = pagination.value.currentPage
  const total = pagination.value.totalPages
  const pages = []
  
  // Show current page and 1-2 pages on each side
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
}

// Watch for query changes
watch(() => props.query, (newQuery) => {
  // Clear selections when query changes
  selectedArtworks.value.clear()
  selectedImages.value.clear()
  currentPage.value = 1
  fetchResults(newQuery, 1)
}, { immediate: true })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>