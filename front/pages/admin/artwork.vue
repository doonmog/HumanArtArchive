<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <ArtworkDisplay 
        :artwork-id="artworkId" 
        :image-id="imageId"
        ref="artworkDisplayRef"
        @image-selected="handleImageSelected"
      >
        <template #error-action>
          <button @click="navigateTo('/admin/overview')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            Back to Admin
          </button>
        </template>
        
        <template #additional-content>
          <!-- Admin Tag Management Section -->
          <div class="border-t pt-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin: Tag Management
              </h3>
              
              <!-- Current Tags Display -->
              <div v-if="artwork?.tags && artwork.tags.length > 0" class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Current Tags</h4>
                <div class="flex flex-wrap gap-2">
                  <div 
                    v-for="tag in artwork.tags" 
                    :key="tag.tag_id"
                    class="inline-flex items-center bg-white border border-gray-300 rounded-md px-2.5 py-1 text-sm"
                  >
                    <span class="mr-1.5">{{ tag.tag_name }}</span>
                    <button 
                      @click="removeTag(tag.tag_id)" 
                      class="text-gray-500 hover:text-red-500 focus:outline-none"
                      :disabled="removingTag"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Add Tags Component -->
              <AddTags 
                :artwork-id="artwork?.artwork_id"
                :images="imageOptions"
                @tags-applied="onTagsApplied"
              />
            </div>
          </div>
          
          <!-- Admin Artwork Management Section -->
          <ManageArtwork 
            v-if="artwork"
            :artwork="artwork"
            @artwork-updated="onArtworkUpdated"
            @artwork-deleted="onArtworkDeleted"
            @image-deleted="onImageDeleted"
          />
        </template>
      </ArtworkDisplay>
    </div>
  </div>
</template>

<script setup>
import Header from '../../components/header.vue'
import ArtworkDisplay from '../../components/artwork_display.vue'
import AddTags from '../../components/add_tags.vue'
import ManageArtwork from '../../components/manage_artwork.vue'

definePageMeta({
  middleware: 'admin-auth'
})

const route = useRoute()
const artworkId = computed(() => route.query.id)
const imageId = computed(() => route.query.image_id)
const artworkDisplayRef = ref(null)
const removingTag = ref(false)
const currentImage = ref(null)

const artwork = computed(() => artworkDisplayRef.value?.artwork)

const imageOptions = computed(() => {
  if (!artwork.value?.images) return []
  
  return artwork.value.images.map(image => ({
    id: image.image_id,
    name: `Image #${image.display_order}`,
    order: image.display_order
  }))
})

const handleImageSelected = (image) => {
  currentImage.value = image
}

const removeTag = async (tagId) => {
  if (!artwork.value || removingTag.value) return
  
  const token = useCookie('admin-token')
  if (!token.value) {
    await navigateTo('/login')
    return
  }
  
  try {
    removingTag.value = true
    
    await $fetch('/api/admin/remove-tag', {
      method: 'POST',
      body: {
        artworkId: artwork.value.artwork_id,
        tagId: tagId,
        imageId: currentImage.value?.image_id || artworkDisplayRef.value?.currentImage?.image_id
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    // Refresh artwork data to show updated tags
    await artworkDisplayRef.value.fetchArtwork(artworkId.value, currentImage.value?.image_id)
    
  } catch (err) {
    console.error('Error removing tag:', err)
    // You could add a toast notification here
  } finally {
    removingTag.value = false
  }
}

const onTagsApplied = async () => {
  // Refresh artwork data to show newly added tags
  await artworkDisplayRef.value.fetchArtwork(artworkId.value, currentImage.value?.image_id || artworkDisplayRef.value?.currentImage?.image_id)
}

const onArtworkUpdated = async () => {
  // Refresh artwork data to show updated details
  await artworkDisplayRef.value.fetchArtwork(artworkId.value, currentImage.value?.image_id || artworkDisplayRef.value?.currentImage?.image_id)
}

const onArtworkDeleted = () => {
  // Navigation is handled by the component itself
  console.log('Artwork deleted, navigating to admin overview')
}

const onImageDeleted = async (imageId) => {
  // Refresh artwork data to remove deleted image
  await artworkDisplayRef.value.fetchArtwork(artworkId.value, currentImage.value?.image_id || artworkDisplayRef.value?.currentImage?.image_id)
  
  // If the deleted image was the currently selected one, clear the selection
  if (currentImage.value?.image_id === imageId) {
    currentImage.value = null
  }
}

useHead({
  title: computed(() => {
    if (artwork.value) {
      return `Admin: ${artwork.value.title}${artwork.value.artist ? ` by ${artwork.value.artist}` : ''}`
    }
    return 'Admin: Artwork Details'
  })
})
</script>

<style scoped>
.prose {
  max-width: none;
}
</style>