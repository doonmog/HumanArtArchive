<template>
  <div
    class="artwork-card bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden relative group"
    :class="{ 
      'ring-2 ring-blue-500': isAdmin && isSelected,
      'break-inside-avoid mb-6': viewMode === 'dynamic'
    }"
  >
    <!-- Selection checkbox for admin -->
    <div v-if="isAdmin" class="absolute top-3 left-3 z-10">
      <input
        type="checkbox"
        :checked="isSelected"
        @change="$emit('toggle-selection', artwork)"
        class="h-8 w-8 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
    </div>

    <NuxtLink
      :to="artworkLink"
      @click.prevent="$emit('confirm-navigation', $event, artworkLink)"
      class="block cursor-pointer hover:scale-105 transition-transform duration-200"
    >
      <div 
        class="bg-gray-100 dark:bg-gray-700 relative"
        :class="viewMode === 'grid' ? 'aspect-square' : 'w-full'"
      >
        <nuxt-img
          v-if="artwork.has_image && artwork.image_id"
          :src="`/api/thumbnail/${artwork.image_id}?size=${imageSize}`"
          :alt="artwork.title"
          provider="backend"
          :class="viewMode === 'grid' ? 'w-full h-full object-cover' : 'w-full h-auto'"
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
</template>

<script setup>
const props = defineProps({
  artwork: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'dynamic'].includes(value)
  },
  imageSize: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['toggle-selection', 'confirm-navigation'])

const artworkLink = computed(() => {
  const baseUrl = props.isAdmin ? '/admin/artwork' : '/artwork'
  const params = new URLSearchParams()
  params.set('id', props.artwork.artwork_id)
  if (props.artwork.image_id) {
    params.set('image_id', props.artwork.image_id)
  }
  return `${baseUrl}?${params.toString()}`
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
