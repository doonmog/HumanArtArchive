<template>
  <div class="relative">
    <div class="mb-8">
      <h1 v-if="tagInfoList && tagInfoList.length > 0" class="text-4xl font-bold text-black mb-2">
        {{ tagInfoList[0].name }}
      </h1>
      <h1 v-else class="text-3xl font-bold text-black mb-2">
        Search Results
      </h1>
      <div v-if="tagInfoList && tagInfoList.length > 0" class="space-y-4">
        <div v-for="(tag, index) in tagInfoList" :key="tag.tag_id" class="text-lg text-black">
          <div v-if="tagInfoList.length > 1" class="font-medium">{{ tag.full_tag_name }}:</div>
          <p>{{ tag.description }}</p>
        </div>
      </div>
      <p v-if="query" class="text-gray-600">
        Showing results for: <span class="font-medium">"{{ query }}"</span>
      </p>
    </div>

    <!-- View Toggle -->
    <ViewToggle 
      v-if="artworks.length > 0"
      v-model:view-mode="viewMode"
    />

    <!-- Admin selection controls -->
    <AdminSelectionControls
      :is-admin="isAdmin"
      :total-artworks="artworks.length"
      :selected-count="selectedCount"
      :selected-images-count="selectedImages.size"
      :selected-artworks-count="selectedArtworks.size"
      :total-selectable-count="totalSelectableCount"
      :is-all-selected="isAllSelected"
      :is-some-selected="isSomeSelected"
      v-model:select-entire-artwork="selectEntireArtwork"
      :items-per-page="itemsPerPage"
      :available-page-sizes="availablePageSizes"
      @toggle-select-all="toggleSelectAll"
      @open-edit-sidebar="openEditSidebar"
      @page-size-change="onPageSizeChange"
    />

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

    <!-- Exact Matches Section -->
    <div v-if="artworks.length > 0" class="mb-8">
      <div class="flex items-center space-x-4 mb-6">
        <hr class="flex-grow border-t border-gray-300" />
        <h2 class="text-xl font-semibold text-gray-700">{{ isExactMatch ? 'Exactly matched your search' : 'Best matches for your search' }}</h2>
        <hr class="flex-grow border-t border-gray-300" />
      </div>
      
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" :class="gridClasses">
        <ArtworkCard
          v-for="artwork in artworks"
          :key="`${artwork.artwork_id}-${artwork.image_id || 'no-image'}`"
          :artwork="artwork"
          :is-admin="isAdmin"
          :is-selected="selectedImages.has(artwork.image_id)"
          :view-mode="viewMode"
          :image-size="500"
          @toggle-selection="toggleSelection"
          @confirm-navigation="confirmArtworkNavigation"
        />
      </div>
      
      <!-- Dynamic Masonry View -->
      <div v-else ref="masonryContainer" class="dynamic-masonry-container">
        <div 
          v-for="(column, columnIndex) in masonryColumns" 
          :key="columnIndex"
          class="masonry-column"
        >
          <ArtworkCard
            v-for="artwork in column"
            :key="`${artwork.artwork_id}-${artwork.image_id || 'no-image'}`"
            :artwork="artwork"
            :is-admin="isAdmin"
            :is-selected="selectedImages.has(artwork.image_id)"
            :view-mode="viewMode"
            :image-size="800"
            @toggle-selection="toggleSelection"
            @confirm-navigation="confirmArtworkNavigation"
          />
        </div>
      </div>
    </div>

    <!-- Partial Matches Section -->
    <div v-if="hasPartialMatches" class="mt-12 mb-8">
      <div class="flex items-center space-x-4">
        <hr class="flex-grow border-t border-gray-300" />
        <h2 class="text-xl font-semibold text-gray-700">Partial Matches (Matches some but not all searched tags, showing closest matches first)</h2>
        <hr class="flex-grow border-t border-gray-300" />
      </div>
      
      <!-- Grid View for Partial Matches -->
      <div v-if="viewMode === 'grid'" :class="gridClasses" class="mt-6">
        <ArtworkCard
          v-for="artwork in partialMatchesArtworks"
          :key="`${artwork.artwork_id}-${artwork.image_id || 'no-image'}-partial`"
          :artwork="artwork"
          :is-admin="isAdmin"
          :is-selected="selectedImages.has(artwork.image_id)"
          :view-mode="viewMode"
          :image-size="500"
          @toggle-selection="toggleSelection"
          @confirm-navigation="confirmArtworkNavigation"
        />
      </div>
      
      <!-- Dynamic Masonry View for Partial Matches -->
      <div v-else class="dynamic-masonry-container mt-6">
        <div 
          v-for="(column, columnIndex) in partialMatchesColumns" 
          :key="`partial-${columnIndex}`"
          class="masonry-column"
        >
          <ArtworkCard
            v-for="artwork in column"
            :key="`${artwork.artwork_id}-${artwork.image_id || 'no-image'}-partial`"
            :artwork="artwork"
            :is-admin="isAdmin"
            :is-selected="selectedImages.has(artwork.image_id)"
            :view-mode="viewMode"
            :image-size="800"
            @toggle-selection="toggleSelection"
            @confirm-navigation="confirmArtworkNavigation"
          />
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <PaginationControls
      v-if="pagination"
      :pagination="pagination"
      :current-items-count="artworks.length"
      @go-to-page="goToPage"
      @next-page="nextPage"
      @prev-page="prevPage"
    />

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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BulkAddTags from './bulk_add_tags.vue'
import ArtworkCard from './artwork_card.vue'
import PaginationControls from './pagination_controls.vue'
import AdminSelectionControls from './admin_selection_controls.vue'
import ViewToggle from './view_toggle.vue'

const props = defineProps({
  query: {
    type: String,
    default: ''
  },
  page: {
    type: Number,
    default: 1
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

// View mode state
const viewMode = ref('grid')

// Multi-select state for admin
const selectedArtworks = ref(new Set())
const selectedImages = ref(new Set())
const selectEntireArtwork = ref(false)
const showEditSidebar = ref(false)

const searchResults = ref(null)
const pending = ref(false)
const error = ref(null)
const tagInfoList = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(60)
const availablePageSizes = [60, 120, 180, 240]

const fetchResults = async (searchQuery, page = 1) => {
  try {
    pending.value = true
    error.value = null
    tagInfoList.value = []
    
    const response = await $fetch('/api/art', {
      query: { 
        q: searchQuery,
        page: page,
        limit: itemsPerPage.value
      }
    })
    searchResults.value = response
    currentPage.value = page
    
    // Check if this is a tag search that should show a description
    const extractTagForDescription = (q) => {
      if (!q) return null;
      
      // Clean the query by removing quotes
      const cleanQuery = q.trim().replace(/^"(.*)"$/, '$1').trim();
      
      // Case 1: Simple tag like "black"
      if (!/[:()]/g.test(cleanQuery) && !/\b(AND|OR)\b/i.test(cleanQuery)) {
        return cleanQuery;
      }
      
      // Case 2: Compound tag like "hair-black"
      if (/^[a-zA-Z]+-[a-zA-Z]+$/.test(cleanQuery)) {
        // For compound tags like "hair-black", extract the second part ("black")
        const parts = cleanQuery.split('-');
        if (parts.length === 2) {
          return parts[1];
        }
      }
      
      // Case 3: Query with only "version:primary" and a tag
      const versionPrimaryRegex = /^version:primary\s+([a-zA-Z-]+)$|^([a-zA-Z-]+)\s+version:primary$/i;
      const versionMatch = cleanQuery.match(versionPrimaryRegex);
      if (versionMatch) {
        // Return the tag part (either group 1 or 2 will have the tag)
        const tag = versionMatch[1] || versionMatch[2];
        
        // If it's a compound tag, extract the second part
        if (tag && tag.includes('-')) {
          const parts = tag.split('-');
          if (parts.length === 2) {
            return parts[1];
          }
        }
        
        return tag;
      }
      
      return null;
    };

    const tagForDescription = extractTagForDescription(searchQuery);
    if (tagForDescription) {
      try {
        const tagResponse = await $fetch(`/api/tag-by-name/${encodeURIComponent(tagForDescription)}`)
        // The API now returns an array of tags instead of a single tag
        if (tagResponse.tags && tagResponse.tags.length > 0) {
          tagInfoList.value = tagResponse.tags
        }
      } catch (tagErr) {
        // This is expected if the tag doesn't exist, so we don't need to log it.
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

// Separate exact matches from partial matches
const artworks = computed(() => {
  const allArtworks = searchResults.value?.artworks || []
  
  // If no artworks, return empty array
  if (allArtworks.length === 0) {
    wasMovedFromPartialMatches.value = false
    return []
  }
  
  // If no match_score property, return all artworks as is
  if (allArtworks[0].match_score === undefined) {
    wasMovedFromPartialMatches.value = false
    return allArtworks
  }
  
  // Get the highest match score (exact matches)
  const maxScore = Math.max(...allArtworks.map(a => a.match_score))
  
  // Separate exact and partial matches
  const exactMatches = allArtworks.filter(a => a.match_score === maxScore)
  const partialMatches = allArtworks.filter(a => a.match_score < maxScore)
  
  // Store the partial matches separately for display purposes
  partialMatchesArtworks.value = partialMatches
  
  // If there are only partial matches (no exact matches), move them to exact matches section
  if (exactMatches.length === 0 && partialMatches.length > 0) {
    // Get the highest score among partial matches
    const highestPartialScore = Math.max(...partialMatches.map(a => a.match_score))
    
    // Move the highest scoring partial matches to exact matches
    const highestPartialMatches = partialMatches.filter(a => a.match_score === highestPartialScore)
    const remainingPartialMatches = partialMatches.filter(a => a.match_score < highestPartialScore)
    
    // Update the partial matches array
    partialMatchesArtworks.value = remainingPartialMatches
    
    // Set flag that we're showing partial matches as best results
    wasMovedFromPartialMatches.value = true
    
    // Return the highest scoring partial matches as "exact" matches
    return highestPartialMatches
  }
  
  // We have true exact matches
  wasMovedFromPartialMatches.value = false
  
  // Return exact matches
  return exactMatches
})

const partialMatchesArtworks = ref([])
const wasMovedFromPartialMatches = ref(false)
const hasPartialMatches = computed(() => partialMatchesArtworks.value.length > 0)
const pagination = computed(() => searchResults.value?.pagination || null)

// Grid classes for different view modes
const gridClasses = computed(() => {
  if (viewMode.value === 'dynamic') {
    return 'dynamic-masonry-grid'
  }
  return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
})

// Determine if we have true exact matches or just showing best partial matches
const isExactMatch = computed(() => {
  const allArtworks = searchResults.value?.artworks || []
  
  // If no match_score property, assume they're all exact matches
  if (allArtworks.length === 0 || allArtworks[0].match_score === undefined) {
    return true
  }
  
  // If we're showing results from the artworks.value computed property,
  // check if they were originally exact matches or just the best partial matches
  return artworks.value.length > 0 && artworks.value[0].match_score === Math.max(...allArtworks.map(a => a.match_score)) && !wasMovedFromPartialMatches
})

const getArtworkLink = (artwork) => {
  const baseUrl = props.isAdmin ? '/admin/artwork' : '/artwork'
  const params = new URLSearchParams()
  params.set('id', artwork.artwork_id)
  if (artwork.image_id) {
    params.set('image_id', artwork.image_id)
  }
  return `${baseUrl}?${params.toString()}`
}

const confirmArtworkNavigation = (event, path) => {
  if (selectedImages.value.size > 0) {
    if (window.confirm('You have selected artworks. Are you sure you want to leave this page?')) {
      router.push(path)
    }
  } else {
    router.push(path)
  }
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
  if (!artwork || !artwork.image_id) return

  const isSelected = selectedImages.value.has(artwork.image_id)

  if (selectEntireArtwork.value) {
    // Select/deselect all images for the given artwork_id
    artworks.value.forEach(item => {
      if (item.artwork_id === artwork.artwork_id && item.image_id) {
        if (isSelected) {
          selectedImages.value.delete(item.image_id)
        } else {
          selectedImages.value.add(item.image_id)
        }
      }
    })

    // Update artwork selection
    if (isSelected) {
      selectedArtworks.value.delete(artwork.artwork_id)
    } else {
      selectedArtworks.value.add(artwork.artwork_id)
    }

  } else {
    // Original behavior: toggle single image
    if (isSelected) {
      selectedImages.value.delete(artwork.image_id)
      
      // Check if this was the last image from this artwork on the current page
      const hasMoreImagesFromArtwork = artworks.value.some(item => 
        item.artwork_id === artwork.artwork_id && 
        selectedImages.value.has(item.image_id)
      )
      
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

const onPageSizeChange = (newSize) => {
  itemsPerPage.value = newSize
  
  // Save the selected page size to localStorage for persistence
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('artArchivePageSize', newSize.toString())
  }
  
  // Reset to page 1 and refetch with new page size
  currentPage.value = 1
  fetchResults(props.query, 1)
  
  // Update URL to page 1
  const query = { ...route.query }
  delete query.page
  router.push({ query })
}

const router = useRouter()
const route = useRoute()

// Pagination navigation functions
const goToPage = (page) => {
  if (page >= 1 && page <= (pagination.value?.totalPages || 1)) {
    // Clear selections when changing pages
    selectedArtworks.value.clear()
    selectedImages.value.clear()
    
    // Update URL with new page number
    const query = { ...route.query, page: page > 1 ? page.toString() : undefined }
    
    // Remove page parameter if it's page 1 for cleaner URLs
    if (page === 1 && query.page) {
      delete query.page
    }
    
    // Update the URL
    router.push({ query })
    
    // Only fetch if the page prop hasn't been updated yet
    // (the watcher will handle it otherwise)
    if (props.page !== page) {
      fetchResults(props.query, page)
    }
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


// Watch for query changes
watch(() => props.query, (newQuery, oldQuery) => {
  // Only reset page if the query actually changed (not just on mount)
  if (oldQuery !== undefined && newQuery !== oldQuery) {
    // Clear selections when query changes
    selectedArtworks.value.clear()
    selectedImages.value.clear()
    currentPage.value = 1
    fetchResults(newQuery, 1)
  }
})

// Watch for page prop changes from URL
watch(() => props.page, (newPage) => {
  if (newPage !== currentPage.value) {
    currentPage.value = newPage
    fetchResults(props.query, newPage)
  }
}, { immediate: true })

// Initial fetch on mount
onMounted(() => {
  fetchResults(props.query, props.page)
})

// Navigation prevention when artworks are selected
const beforeUnloadHandler = (event) => {
  if (selectedImages.value.size > 0) {
    const message = 'You have selected artworks. Are you sure you want to leave this page?'
    event.preventDefault()
    event.returnValue = message
    return message
  }
}

// Add navigation prevention for browser back/forward and page refreshes
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
  
  // Load saved page size from localStorage if available
  if (typeof localStorage !== 'undefined') {
    const savedPageSize = localStorage.getItem('artArchivePageSize')
    if (savedPageSize && availablePageSizes.includes(parseInt(savedPageSize))) {
      itemsPerPage.value = parseInt(savedPageSize)
    }
    
    // Load saved view mode from localStorage if available
    const savedViewMode = localStorage.getItem('artArchiveViewMode')
    if (savedViewMode && ['grid', 'dynamic'].includes(savedViewMode)) {
      viewMode.value = savedViewMode
    }
  }
})

// Masonry layout state
const masonryContainer = ref(null)
const masonryColumns = ref([])
const partialMatchesColumns = ref([])
const masonryColumnCount = ref(0) // Start with 0 to indicate not calculated yet
const masonryInitialized = ref(false)

// Watch for view mode changes and persist to localStorage
watch(viewMode, (newMode) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('artArchiveViewMode', newMode)
  }
  
  // Initialize masonry when switching to dynamic view
  if (newMode === 'dynamic') {
    nextTick(() => {
      initializeMasonry()
    })
  }
})

// Initialize masonry layout
const initializeMasonry = () => {
  if (!masonryContainer.value || viewMode.value !== 'dynamic') return
  
  // Calculate column count based on container width to match grid view breakpoints
  const containerWidth = masonryContainer.value.offsetWidth
  let newColumnCount
  
  // Match Tailwind CSS grid breakpoints
  if (containerWidth < 640) { // sm
    newColumnCount = 1
  } else if (containerWidth < 768) { // md
    newColumnCount = 2
  } else if (containerWidth < 1024) { // lg
    newColumnCount = 3
  } else if (containerWidth < 1280) { // xl
    newColumnCount = 4
  } else { // 2xl and above
    newColumnCount = 5
  }
  
  // If container width is 0 (which can happen at initial load with zoom),
  // use a fallback column count based on window width
  if (containerWidth === 0 && typeof window !== 'undefined') {
    const windowWidth = window.innerWidth
    if (windowWidth < 640) {
      newColumnCount = 1
    } else if (windowWidth < 768) {
      newColumnCount = 2
    } else if (windowWidth < 1024) {
      newColumnCount = 3
    } else if (windowWidth < 1280) {
      newColumnCount = 4
    } else {
      newColumnCount = 5
    }
  }
  
  // Ensure we always have at least 1 column
  newColumnCount = Math.max(1, newColumnCount || 1)
  
  if (newColumnCount !== masonryColumnCount.value) {
    masonryColumnCount.value = newColumnCount
    // Reinitialize columns and redistribute artworks
    redistributeArtworks()
  }
  
  // Mark masonry as initialized
  masonryInitialized.value = true
}

// Redistribute artworks when column count changes
const redistributeArtworks = () => {
  // Initialize empty columns
  masonryColumns.value = Array(masonryColumnCount.value).fill().map(() => [])
  partialMatchesColumns.value = Array(masonryColumnCount.value).fill().map(() => [])
  
  // Redistribute artworks
  artworks.value.forEach((artwork, index) => {
    addToMasonry(artwork, index)
  })
  
  // Redistribute partial matches
  partialMatchesArtworks.value.forEach((artwork, index) => {
    addToPartialMasonry(artwork, index)
  })
}

// Add artwork to shortest column (bottom placement)
const addToMasonry = (artwork, index) => {
  if (viewMode.value !== 'dynamic' || masonryColumns.value.length === 0) return
  
  // Find the shortest column
  const columnHeights = masonryColumns.value.map(col => col.length)
  const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
  
  // Add artwork to the shortest column
  masonryColumns.value[shortestColumnIndex].push({ ...artwork, originalIndex: index })
}

// Populate masonry columns when artworks change
watch([artworks, partialMatchesArtworks, viewMode], () => {
  if (viewMode.value === 'dynamic') {
    // Use the redistribute function to ensure proper column count
    redistributeArtworks()
  }
}, { immediate: true })

// Add partial match artwork to shortest column
const addToPartialMasonry = (artwork, index) => {
  if (viewMode.value !== 'dynamic' || partialMatchesColumns.value.length === 0) return
  
  // Find the shortest column
  const columnHeights = partialMatchesColumns.value.map(col => col.length)
  const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
  
  // Add artwork to the shortest column
  partialMatchesColumns.value[shortestColumnIndex].push({ ...artwork, originalIndex: index })
}

// Handle window resize for responsive masonry with debouncing
let resizeTimeout = null
const handleResize = () => {
  if (viewMode.value === 'dynamic') {
    // Debounce resize events to prevent excessive recalculations
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    resizeTimeout = setTimeout(() => {
      initializeMasonry()
    }, 150)
  }
}

// Add resize listener
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
  window.addEventListener('resize', handleResize)
  
  // Load saved page size from localStorage if available
  if (typeof localStorage !== 'undefined') {
    const savedPageSize = localStorage.getItem('artArchivePageSize')
    if (savedPageSize && availablePageSizes.includes(parseInt(savedPageSize))) {
      itemsPerPage.value = parseInt(savedPageSize)
    }
    
    // Load saved view mode from localStorage if available
    const savedViewMode = localStorage.getItem('artArchiveViewMode')
    if (savedViewMode && ['grid', 'dynamic'].includes(savedViewMode)) {
      viewMode.value = savedViewMode
    }
  }
  
  // Initialize masonry if starting in dynamic view
  // Use immediate initialization to prevent layout jumps
  if (viewMode.value === 'dynamic') {
    // Initialize immediately to get column count before first render
    initializeMasonry()
    
    // Also initialize after nextTick to ensure container is properly sized
    nextTick(() => {
      initializeMasonry()
      
      // Add a small delay to handle zoom states that might affect layout
      setTimeout(() => {
        initializeMasonry()
      }, 50)
    })
    
    // Add a longer delay initialization to handle slow-loading pages or zoom changes
    setTimeout(() => {
      initializeMasonry()
    }, 300)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  window.removeEventListener('resize', handleResize)
})

// Add navigation prevention for internal Nuxt navigation
const confirmNavigation = (to, from, next) => {
  if (selectedImages.value.size > 0) {
    if (window.confirm('You have selected artworks. Are you sure you want to leave this page?')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
}

onMounted(() => {
  router.beforeEach(confirmNavigation)
})

onBeforeUnmount(() => {
  // Remove the navigation guard when component is unmounted
  const routerInstance = router
  const guardIndex = routerInstance.beforeHooks.indexOf(confirmNavigation)
  if (guardIndex >= 0) {
    routerInstance.beforeHooks.splice(guardIndex, 1)
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dynamic-masonry-container {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .dynamic-masonry-container {
    gap: 1rem;
  }
  
  .masonry-column {
    gap: 1rem;
  }
}
</style>