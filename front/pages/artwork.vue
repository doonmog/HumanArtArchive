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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Image section -->
          <div class="space-y-4">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <nuxt-img
                v-if="artwork.has_image"
                :src="`/api/image/${artwork.artwork_id}`"
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
          </div>

          <!-- Details section -->
          <div class="space-y-6">
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
            <div v-if="artwork.tags && artwork.tags.length > 0" class="space-y-3">
              <h3 class="text-lg font-semibold text-black">Tags</h3>
              <div class="space-y-2">
                <template v-for="group in groupedTags" :key="group.name">
                  <div v-if="group.tags.length > 0">
                    <h4 v-if="group.name" class="text-sm font-medium text-black mb-1">
                      {{ group.name }}
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="tag in group.tags"
                        :key="tag.tag_name"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ tag.tag_name }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'

const route = useRoute()
const artworkId = computed(() => route.query.id)

const artwork = ref(null)
const pending = ref(false)
const error = ref(null)

const fetchArtwork = async (id) => {
  if (!id) {
    error.value = { message: 'No artwork ID provided' }
    return
  }

  try {
    pending.value = true
    error.value = null
    const response = await $fetch(`/api/artwork/${id}`)
    artwork.value = response.artwork
  } catch (err) {
    error.value = err.data || err
    artwork.value = null
  } finally {
    pending.value = false
  }
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
await fetchArtwork(artworkId.value)

// Watch for ID changes
watch(artworkId, (newId) => {
  fetchArtwork(newId)
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