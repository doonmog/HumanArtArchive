<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <ArtworkDisplay 
        :artwork-id="artworkId" 
        :image-id="imageId"
        ref="artworkDisplayRef"
      >
        <template #error-action>
          <button @click="navigateTo('/')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            Back to Home
          </button>
        </template>
      </ArtworkDisplay>
    </div>
  </div>
</template>

<script setup>
import Header from '../components/header.vue'
import ArtworkDisplay from '../components/artwork_display.vue'

const route = useRoute()
const artworkId = computed(() => route.query.id)
const imageId = computed(() => route.query.image_id)
const artworkDisplayRef = ref(null)

useHead({
  title: computed(() => {
    const artwork = artworkDisplayRef.value?.artwork
    if (artwork) {
      return `${artwork.title}${artwork.artist ? ` by ${artwork.artist}` : ''}`
    }
    return 'Artwork Details'
  })
})
</script>