<template>
  <div v-if="isAdmin && totalArtworks > 0" class="mb-6 p-4 bg-gray-50 rounded-lg border">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected && !isAllSelected"
            @change="$emit('toggle-select-all')"
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
          {{ selectedImagesCount }} image{{ selectedImagesCount !== 1 ? 's' : '' }} selected
          from {{ selectedArtworksCount }} artwork{{ selectedArtworksCount !== 1 ? 's' : '' }}
        </span>
        <button
          v-if="selectedCount > 0"
          @click="$emit('open-edit-sidebar')"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit Selected
        </button>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="selectEntireArtwork"
          @change="$emit('update:select-entire-artwork', $event.target.checked)"
          class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">
          Select each image of artwork
        </span>
      </label>
      
      <div class="flex items-center">
        <label for="items-per-page" class="mr-2 text-sm font-medium text-gray-700">Items per page:</label>
        <select
          id="items-per-page"
          :value="itemsPerPage"
          @change="$emit('page-size-change', parseInt($event.target.value))"
          class="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
        >
          <option v-for="size in availablePageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false
  },
  totalArtworks: {
    type: Number,
    default: 0
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  selectedImagesCount: {
    type: Number,
    default: 0
  },
  selectedArtworksCount: {
    type: Number,
    default: 0
  },
  totalSelectableCount: {
    type: Number,
    default: 0
  },
  isAllSelected: {
    type: Boolean,
    default: false
  },
  isSomeSelected: {
    type: Boolean,
    default: false
  },
  selectEntireArtwork: {
    type: Boolean,
    default: false
  },
  itemsPerPage: {
    type: Number,
    default: 60
  },
  availablePageSizes: {
    type: Array,
    default: () => [60, 120, 180, 240]
  }
})

const emit = defineEmits([
  'toggle-select-all',
  'open-edit-sidebar',
  'update:select-entire-artwork',
  'page-size-change'
])
</script>
