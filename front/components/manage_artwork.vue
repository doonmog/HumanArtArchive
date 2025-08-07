<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
    <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center">
      <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
      Admin: Artwork Management
    </h3>
    
    <!-- Edit Artwork Section -->
    <div class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Edit Artwork Details</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Artist Name</label>
          <input 
            v-model="editForm.artistName" 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter artist name"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Artwork Name</label>
          <input 
            v-model="editForm.artworkName" 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter artwork name"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input 
            v-model.number="editForm.year" 
            type="number" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter year"
          />
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          v-model="editForm.description" 
          rows="3" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter artwork description"
        ></textarea>
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="updateArtwork" 
          :disabled="updating"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="updating">Updating...</span>
          <span v-else>Update Artwork</span>
        </button>
        
        <button 
          @click="resetForm" 
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>
    </div>
    
    <!-- Image Management Section -->
    <div class="mb-6" v-if="artwork?.images && artwork.images.length > 0">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Manage Images</h4>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="image in artwork.images" 
          :key="image.image_id"
          class="border border-gray-200 rounded-lg p-3 bg-white"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900">Image #{{ image.display_order }}</span>
            <span class="text-xs text-gray-500">{{ formatFileSize(image.filesize) }}</span>
          </div>
          
          <div class="text-xs text-gray-600 mb-3">
            Filename: {{ image.resolution || 'Unknown filename' }}
          </div>
          
          <button 
            @click="deleteImage(image.image_id, image.display_order)" 
            :disabled="deletingImage === image.image_id"
            class="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="deletingImage === image.image_id">Deleting...</span>
            <span v-else>Delete Image</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Artwork Section -->
    <div class="border-t border-red-200 pt-6">
      <h4 class="text-sm font-medium text-red-800 mb-3">Danger Zone</h4>
      
      <div class="bg-red-100 border border-red-300 rounded-md p-4">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="flex-1">
            <h5 class="text-sm font-medium text-red-800 mb-1">Delete Entire Artwork</h5>
            <p class="text-sm text-red-700 mb-3">
              This will permanently delete the artwork and all associated images. This action cannot be undone.
            </p>
            
            <div class="flex items-center gap-3">
              <label class="flex items-center">
                <input 
                  v-model="confirmDelete" 
                  type="checkbox" 
                  class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-red-700">I understand this action is permanent</span>
              </label>
              
              <button 
                @click="deleteArtwork" 
                :disabled="!confirmDelete || deletingArtwork"
                class="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="deletingArtwork">Deleting...</span>
                <span v-else>Delete Artwork</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  artwork: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['artwork-updated', 'artwork-deleted', 'image-deleted'])

const editForm = ref({
  artistName: '',
  artworkName: '',
  year: null,
  description: ''
})

const updating = ref(false)
const deletingImage = ref(null)
const deletingArtwork = ref(false)
const confirmDelete = ref(false)

// Initialize form with current artwork data
watch(() => props.artwork, (newArtwork) => {
  if (newArtwork) {
    editForm.value = {
      artistName: newArtwork.artist || '',
      artworkName: newArtwork.title || '',
      year: newArtwork.year || null,
      description: newArtwork.description || ''
    }
  }
}, { immediate: true })

const resetForm = () => {
  if (props.artwork) {
    editForm.value = {
      artistName: props.artwork.artist || '',
      artworkName: props.artwork.title || '',
      year: props.artwork.year || null,
      description: props.artwork.description || ''
    }
  }
}

const updateArtwork = async () => {
  if (!props.artwork || updating.value) return
  
  const token = useCookie('admin-token')
  if (!token.value) {
    await navigateTo('/login')
    return
  }
  
  try {
    updating.value = true
    
    await $fetch(`/api/admin/artwork/${props.artwork.artwork_id}`, {
      method: 'PUT',
      body: {
        artistName: editForm.value.artistName,
        artworkName: editForm.value.artworkName,
        year: editForm.value.year,
        description: editForm.value.description
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    emit('artwork-updated')
    
  } catch (err) {
    console.error('Error updating artwork:', err)
    alert('Failed to update artwork. Please try again.')
  } finally {
    updating.value = false
  }
}

const deleteImage = async (imageId, displayOrder) => {
  if (!imageId || deletingImage.value) return
  
  if (!confirm(`Are you sure you want to delete Image #${displayOrder}? This action cannot be undone.`)) {
    return
  }
  
  const token = useCookie('admin-token')
  if (!token.value) {
    await navigateTo('/login')
    return
  }
  
  try {
    deletingImage.value = imageId
    
    await $fetch(`/api/admin/image/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    emit('image-deleted', imageId)
    
  } catch (err) {
    console.error('Error deleting image:', err)
    alert('Failed to delete image. Please try again.')
  } finally {
    deletingImage.value = null
  }
}

const deleteArtwork = async () => {
  if (!props.artwork || !confirmDelete.value || deletingArtwork.value) return
  
  const artworkName = props.artwork.title || 'Untitled'
  const finalConfirm = confirm(`Are you absolutely sure you want to delete "${artworkName}" and all its images? This action cannot be undone.`)
  
  if (!finalConfirm) {
    return
  }
  
  const token = useCookie('admin-token')
  if (!token.value) {
    await navigateTo('/login')
    return
  }
  
  try {
    deletingArtwork.value = true
    
    await $fetch(`/api/admin/artwork/${props.artwork.artwork_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    emit('artwork-deleted')
    
    // Navigate back to admin overview after successful deletion
    await navigateTo('/admin/overview')
    
  } catch (err) {
    console.error('Error deleting artwork:', err)
    alert('Failed to delete artwork. Please try again.')
  } finally {
    deletingArtwork.value = false
    confirmDelete.value = false
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size'
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
</script>