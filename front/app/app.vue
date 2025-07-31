<script setup>
import { ref } from 'vue'

const artworks = ref([])
const artworkTags = ref({})
const error = ref('')
const loading = ref(false)
const loadingTags = ref(false)

async function fetchArtworks() {
  loading.value = true
  error.value = ''
  artworks.value = []
  artworkTags.value = {}
  
  try {
    const response = await fetch('/api/artworks')
    const responseText = await response.text()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`)
    }
    
    if (!responseText.trim()) {
      throw new Error('Empty response from server')
    }
    
    try {
      const data = JSON.parse(responseText)
      artworks.value = data
      
      // Fetch tags for each artwork
      await fetchAllTags()
    } catch (jsonError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`)
    }
  } catch (e) {
    console.error('Fetch error:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function fetchAllTags() {
  loadingTags.value = true
  
  try {
    for (const artwork of artworks.value) {
      await fetchTagsForArtwork(artwork.artwork_id)
    }
  } catch (e) {
    console.error('Error fetching tags:', e)
  } finally {
    loadingTags.value = false
  }
}

async function fetchTagsForArtwork(artworkId) {
  try {
    const response = await fetch(`/api/tags/${artworkId}`)
    const data = await response.json()
    
    if (response.ok) {
      artworkTags.value[artworkId] = data.tags || []
    }
  } catch (e) {
    console.error(`Error fetching tags for artwork ${artworkId}:`, e)
    artworkTags.value[artworkId] = []
  }
}

function handleImageError(event) {
  console.error('Failed to load image:', event.target.src)
  event.target.style.display = 'none'
}
</script>

<template>
  <div style="font-family: sans-serif; padding: 2rem;">
    <h1>Human Art Archive</h1>
    <p>Click the button to fetch artworks from the backend.</p>
    
    <button 
      @click="fetchArtworks" 
      :disabled="loading"
      style="padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;"
    >
      {{ loading ? 'Loading...' : 'Fetch Artworks' }}
    </button>
    
    <div v-if="error" style="margin-top: 1rem; padding: 1rem; background-color: #ffe0e0; border: 1px solid #c0a0a0;">
      <strong>Error:</strong> {{ error }}
    </div>
    
    <div v-if="artworks.length > 0" style="margin-top: 2rem;">
      <h2>Artworks ({{ artworks.length }})</h2>
      <div style="display: grid; gap: 2rem; margin-top: 1rem;">
        <div 
          v-for="artwork in artworks" 
          :key="artwork.artwork_id"
          style="padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; display: flex; gap: 1.5rem;"
        >
          <div v-if="artwork.has_image" style="flex-shrink: 0;">
            <img 
              :src="`/api/image/${artwork.artwork_id}`" 
              :alt="artwork.title || 'Untitled'"
              style="width: 200px; height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;"
              @error="handleImageError"
            />
          </div>
          <div style="flex: 1;">
            <h3 style="margin-top: 0;">{{ artwork.title || 'Untitled' }}</h3>
            <p><strong>Artist:</strong> {{ artwork.artist || 'Unknown' }}</p>
            <p v-if="artwork.year"><strong>Year:</strong> {{ artwork.year }}</p>
            <p v-if="artwork.description" style="margin-top: 1rem; line-height: 1.5;"><strong>Description:</strong> {{ artwork.description }}</p>
            
            <!-- Tags Section -->
            <div v-if="artworkTags[artwork.artwork_id]" style="margin-top: 1rem;">
              <h4 style="margin-bottom: 0.5rem; color: #333;">Tags:</h4>
              <div v-if="loadingTags" style="color: #666; font-style: italic;">Loading tags...</div>
              <div v-else-if="artworkTags[artwork.artwork_id].length === 0" style="color: #666; font-style: italic;">No tags found</div>
              <div v-else style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                <div 
                  v-for="tag in artworkTags[artwork.artwork_id]" 
                  :key="`${tag.category}-${tag.tag_group}-${tag.tag}`"
                  style="display: inline-block; padding: 0.25rem 0.5rem; background-color: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 4px; font-size: 0.875rem;"
                  :title="tag.tag_description"
                >
                  <span style="font-weight: bold; color: #4338ca;">{{ tag.category }}</span> >
                  <span style="color: #6366f1;">{{ tag.tag_group }}</span> >
                  <span style="color: #1e40af;">{{ tag.tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="!loading && !error" style="margin-top: 2rem; color: #666;">
      <p>No artworks loaded yet. Click "Fetch Artworks" to load data.</p>
    </div>
  </div>
</template>
