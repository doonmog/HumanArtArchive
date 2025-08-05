<template>
  <div>
    <Header />
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Advanced Search</h1>
      
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 gap-8">
        <!-- Categories and Tag Groups -->
        <div v-for="category in categories" :key="category.categoryId" class="border rounded-lg p-4 bg-white shadow-sm">
          <h2 class="text-xl font-semibold mb-4">{{ category.name }}</h2>
          <p v-if="category.description" class="text-gray-600 mb-4">{{ category.description }}</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="group in category.groups" :key="group.groupId" class="border rounded p-3">
              <!-- Tag Group Dropdown -->
              <div @click="toggleGroup(group.groupId)" class="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <div>
                  <h3 class="font-medium">{{ group.name }}</h3>
                  <p v-if="group.description" class="text-sm text-gray-500">{{ group.description }}</p>
                </div>
                <div class="text-gray-500">
                  <span v-if="selectedTagsCount(group)" class="mr-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {{ selectedTagsCount(group) }} selected
                  </span>
                  <svg :class="[openGroups.includes(group.groupId) ? 'transform rotate-180' : '', 'w-5 h-5 transition-transform']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <!-- Tags List (Collapsible) -->
              <div v-show="openGroups.includes(group.groupId)" class="pl-4 mt-2 space-y-2 transition-all duration-200">
                <div v-if="group.tags.length === 0" class="text-gray-500 text-sm italic">No tags in this group</div>
                
                <div v-else class="flex flex-wrap gap-2">
                  <div v-for="tag in group.tags" :key="tag.tagId" class="flex items-center">
                    <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input 
                        type="checkbox" 
                        :value="tag.tagId" 
                        v-model="selectedTags"
                        class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      >
                      <span class="text-sm">{{ tag.name }}</span>
                    </label>
                  </div>
                </div>
                

              </div>
            </div>
          </div>
        </div>
        
        <!-- Search Button -->
        <div class="flex justify-center mt-6">
          <button 
            @click="handleSearch" 
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            :disabled="selectedTags.length === 0"
          >
            Search with Selected Tags
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'

// State variables
const categories = ref([])
const selectedTags = ref([])
const openGroups = ref([])
const loading = ref(true)

// Fetch all categories, tag groups, and tags
onMounted(async () => {
  try {
    const response = await fetch('/api/tags')
    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }
    const data = await response.json()
    categories.value = data.categories || []
    
    // All tag groups are closed by default
    // No need to push any group IDs to openGroups
  } catch (error) {
    console.error('Error fetching tags:', error)
  } finally {
    loading.value = false
  }
})

// Toggle a tag group's open/closed state
const toggleGroup = (groupId) => {
  const index = openGroups.value.indexOf(groupId)
  if (index === -1) {
    openGroups.value.push(groupId)
  } else {
    openGroups.value.splice(index, 1)
  }
}

// Count selected tags in a group
const selectedTagsCount = (group) => {
  if (!group || !group.tags) return 0
  return group.tags.filter(tag => selectedTags.value.includes(tag.tagId)).length
}

// Select all tags in a group
const selectAllInGroup = (group) => {
  if (!group || !group.tags) return
  
  group.tags.forEach(tag => {
    if (!selectedTags.value.includes(tag.tagId)) {
      selectedTags.value.push(tag.tagId)
    }
  })
}

// Deselect all tags in a group
const deselectAllInGroup = (group) => {
  if (!group || !group.tags) return
  
  selectedTags.value = selectedTags.value.filter(tagId => 
    !group.tags.some(tag => tag.tagId === tagId)
  )
}

// Handle search with selected tags
const handleSearch = async () => {
  if (selectedTags.value.length === 0) return
  
  // Get tag names for selected tag IDs
  const selectedTagNames = []
  categories.value.forEach(category => {
    category.groups.forEach(group => {
      group.tags.forEach(tag => {
        if (selectedTags.value.includes(tag.tagId)) {
          selectedTagNames.push(tag.name)
        }
      })
    })
  })
  
  // Build search query string (similar to search.vue)
  const queryString = selectedTagNames.join(' ')
  navigateTo(`/search?q=${encodeURIComponent(queryString)}`)
}
</script>