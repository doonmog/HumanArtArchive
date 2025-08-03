<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Upload Artwork</h1>
        
        <form @submit.prevent="uploadArtwork" class="space-y-6">
          <div>
            <label for="artworkName" class="block text-sm font-medium text-gray-700 mb-2">
              Artwork Name *
            </label>
            <input
              id="artworkName"
              v-model="form.artworkName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter artwork name"
            />
          </div>

          <div>
            <label for="artistName" class="block text-sm font-medium text-gray-700 mb-2">
              Artist Name
            </label>
            <input
              id="artistName"
              v-model="form.artistName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter artist name (optional)"
            />
          </div>

          <div>
            <label for="year" class="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              id="year"
              v-model="form.year"
              type="number"
              min="1"
              max="2024"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter year (optional)"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter artwork description (optional)"
            ></textarea>
          </div>

          <div>
            <label for="image" class="block text-sm font-medium text-gray-700 mb-2">
              Image *
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <div v-if="!selectedFile" class="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div v-else class="mx-auto h-12 w-12 text-green-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M9 12l2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="flex text-sm text-gray-600">
                  <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>{{ selectedFile ? 'Change file' : 'Upload a file' }}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      class="sr-only"
                      accept="image/*"
                      required
                      @change="handleFileSelect"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">
                  {{ selectedFile ? selectedFile.name : 'PNG, JPG, GIF up to 10MB' }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Upload Error
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Success!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  {{ success }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="resetForm"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
            <button
              type="submit"
              :disabled="uploading || !form.artworkName || !selectedFile"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploading ? 'Uploading...' : 'Upload Artwork' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth'
})

const form = ref({
  artworkName: '',
  artistName: '',
  year: '',
  description: ''
})

const selectedFile = ref(null)
const uploading = ref(false)
const error = ref('')
const success = ref('')

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'File size must be less than 10MB'
      return
    }
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select an image file'
      return
    }
    selectedFile.value = file
    error.value = ''
  }
}

const uploadArtwork = async () => {
  if (!form.value.artworkName || !selectedFile.value) {
    error.value = 'Artwork name and image are required'
    return
  }

  uploading.value = true
  error.value = ''
  success.value = ''

  try {
    const token = useCookie('admin-token')
    
    const formData = new FormData()
    formData.append('artworkName', form.value.artworkName)
    formData.append('artistName', form.value.artistName)
    formData.append('year', form.value.year)
    formData.append('description', form.value.description)
    formData.append('image', selectedFile.value)

    const response = await $fetch('/api/admin/upload-artwork', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    success.value = response.message
    resetForm()
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err.data?.message || 'Failed to upload artwork'
  } finally {
    uploading.value = false
  }
}

const resetForm = () => {
  form.value = {
    artworkName: '',
    artistName: '',
    year: '',
    description: ''
  }
  selectedFile.value = null
  error.value = ''
  success.value = ''
  
  const fileInput = document.getElementById('file-upload')
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>