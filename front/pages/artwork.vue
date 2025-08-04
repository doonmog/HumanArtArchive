<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <!-- Loading state -->
      <div v-if="pending" class="flex justify-center items-center py-12">
        <svg class="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-gray-600">Loading artwork...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-12">
        <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-black mb-2">
          Artwork Not Found
        </h2>
        <p class="text-gray-600 mb-4">
          {{ error.message || 'The requested artwork could not be found' }}
        </p>
        <button @click="navigateTo('/')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          Back to Home
        </button>
      </div>

      <!-- Artwork details -->
      <div v-else-if="artwork" class="max-w-6xl mx-auto">
        <!-- Back button -->
        <div class="mb-6">
          <button @click="$router.back()" class="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div class="flex flex-col gap-8">
          <!-- Image section -->
          <div class="space-y-4 max-w-4xl mx-auto w-full">
            <div class="bg-gray-100 rounded-lg overflow-hidden">
              <nuxt-img
                v-if="currentImage && currentImage.has_image"
                :src="`/api/image-by-id/${currentImage.image_id}`"
                :alt="artwork.title"
                provider="backend"
                class="w-full h-full object-contain"
                loading="eager"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <!-- Alternative versions -->
            <div v-if="artwork.images && artwork.images.length > 1" class="space-y-3">
              <h3 class="text-lg font-semibold text-black">Alternative Versions</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div 
                  v-for="image in artwork.images" 
                  :key="image.image_id"
                  class="relative cursor-pointer group"
                  @click="selectImage(image)"
                >
                  <div class="bg-gray-100 rounded-lg overflow-hidden aspect-square" :class="{
                    'ring-2 ring-blue-500': currentImage && currentImage.image_id === image.image_id
                  }">
                    <nuxt-img
                      v-if="image.has_image"
                      :src="`/api/image-by-id/${image.image_id}`"
                      :alt="`${artwork.title} - Version ${image.display_order}`"
                      provider="backend"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                  <div class="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                    {{ image.display_order }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Details section -->
          <div class="space-y-6 max-w-4xl mx-auto w-full">
            <!-- Title and basic info -->
            <div>
              <h1 class="text-3xl font-bold text-black mb-2">
                {{ artwork.title }}
              </h1>
              <div class="space-y-1">
                <p v-if="artwork.artist" class="text-xl text-black">
                  by {{ artwork.artist }}
                </p>
                <p v-if="artwork.year" class="text-lg text-black">
                  {{ artwork.year }}
                </p>
              </div>
            </div>

            <!-- Description -->
            <div v-if="artwork.description" class="prose max-w-none">
              <h3 class="text-lg font-semibold text-black mb-2">Description</h3>
              <p class="text-black leading-relaxed">
                {{ artwork.description }}
              </p>
            </div>

            <!-- Tags -->
            <ArtworkTags v-if="artwork.tags && artwork.tags.length > 0" :tags="artwork.tags" />


          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'
import ArtworkTags from '../components/artwork_tags.vue'

const route = useRoute()
const artworkId = computed(() => route.query.id)
const imageId = computed(() => route.query.image_id)

const artwork = ref(null)
const pending = ref(false)
const error = ref(null)
const currentImage = ref(null)

const fetchArtwork = async (id, imageId = null) => {
  if (!id) {
    error.value = { message: 'No artwork ID provided' }
    return
  }

  try {
    pending.value = true
    error.value = null
    
    let url = `/api/artwork/${id}`
    if (imageId) {
      url += `?image_id=${imageId}`
    }
    
    const response = await $fetch(url)
    artwork.value = response.artwork
    
    // Set the current image based on the response or default to first
    if (artwork.value.images && artwork.value.images.length > 0) {
      if (imageId) {
        currentImage.value = artwork.value.images.find(img => img.image_id === imageId) || artwork.value.images[0]
      } else {
        currentImage.value = artwork.value.images[0]
      }
    }
  } catch (err) {
    error.value = err.data || err
    artwork.value = null
    currentImage.value = null
  } finally {
    pending.value = false
  }
}

const selectImage = async (image) => {
  currentImage.value = image
  // Fetch tags for the selected image
  await fetchArtwork(artworkId.value, image.image_id)
}

const groupedTags = computed(() => {
  if (!artwork.value?.tags) return []
  
  const groups = new Map()
  
  artwork.value.tags.forEach(tag => {
    const groupName = tag.group_name || 'Other'
    if (!groups.has(groupName)) {
      groups.set(groupName, { name: groupName === 'Other' ? null : groupName, tags: [] })
    }
    groups.get(groupName).tags.push(tag)
  })
  
  return Array.from(groups.values()).sort((a, b) => {
    if (!a.name) return 1
    if (!b.name) return -1
    return a.name.localeCompare(b.name)
  })
})

// Initial fetch
await fetchArtwork(artworkId.value, imageId.value)

// Watch for ID changes
watch([artworkId, imageId], ([newId, newImageId]) => {
  fetchArtwork(newId, newImageId)
}, { immediate: false })

useHead({
  title: computed(() => {
    if (artwork.value) {
      return `${artwork.value.title}${artwork.value.artist ? ` by ${artwork.value.artist}` : ''}`
    }
    return 'Artwork Details'
  })
})
</script>

<style scoped>
.prose {
  max-width: none;
}
</style>