<template>
  <div class="bulk-tag-manager">
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-700 mb-2">Add Tags to Multiple Artworks</h3>
      
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span class="ml-2 text-gray-600">Loading tags...</span>
      </div>
      
      <!-- Error state -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
      
      <!-- Success message -->
      <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
        <p class="text-sm text-green-700">{{ successMessage }}</p>
      </div>

      <!-- Tag selection form -->
      <div v-if="!loading && categories.length > 0">
        <!-- Category and tag selection -->
        <div class="space-y-4">
          <!-- Category selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              v-model="selectedCategoryId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="onCategoryChange"
            >
              <option value="">Select a category</option>
              <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <!-- Group selection -->
          <div v-if="selectedCategoryId">
            <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select 
              v-model="selectedGroupId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="onGroupChange"
            >
              <option value="">Select a group</option>
              <option v-for="group in groups" :key="group.groupId" :value="group.groupId">
                {{ group.name }}
              </option>
            </select>
            
            <!-- Create new group option -->
            <div v-if="selectedCategoryId" class="mt-2">
              <button 
                type="button"
                @click="showCreateGroupForm = !showCreateGroupForm"
                class="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                {{ showCreateGroupForm ? 'Cancel' : '+ Create New Group' }}
              </button>
            </div>
            
            <!-- Create new group form -->
            <div v-if="showCreateGroupForm" class="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Create New Tag Group</h4>
              <div class="space-y-2">
                <input 
                  v-model="newGroupName" 
                  type="text" 
                  placeholder="Group name" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <textarea 
                  v-model="newGroupDescription" 
                  rows="2" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                  placeholder="Group description (optional)"
                ></textarea>
                <div class="flex space-x-2">
                  <button 
                    @click="createNewGroup"
                    :disabled="!newGroupName.trim() || creatingGroup"
                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ creatingGroup ? 'Creating...' : 'Create' }}
                  </button>
                  <button 
                    @click="showCreateGroupForm = false; newGroupName = ''; newGroupDescription = ''"
                    class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tag selection -->
          <div v-if="selectedGroupId && availableTags.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              <div v-for="tag in availableTags" :key="tag.tagId" class="flex items-center py-1">
                <input 
                  :id="`tag-${tag.tagId}`"
                  v-model="selectedTagIds" 
                  :value="tag.tagId" 
                  type="checkbox" 
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label :for="`tag-${tag.tagId}`" class="ml-2 text-sm text-gray-700">
                  {{ tag.name }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Custom tag input -->
          <div v-if="selectedGroupId">
            <label class="block text-sm font-medium text-gray-700 mb-1">Add Custom Tag</label>
            <div class="flex space-x-2">
              <input 
                v-model="newTagName" 
                type="text" 
                placeholder="Tag name" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                @keyup.enter="addCustomTag"
              />
              <button 
                @click="addCustomTag"
                :disabled="!newTagName.trim()"
                class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        <!-- Selected tags display -->
        <div v-if="selectedTags.length > 0" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Selected Tags</label>
          <div class="flex flex-wrap gap-2">
            <div v-for="tag in selectedTags" :key="tag.id" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <span>{{ tag.name }}</span>
              <button 
                @click="removeTag(tag.id)"
                class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 8 8">
                  <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Apply tags button -->
        <div class="mt-6">
          <button 
            @click="applyTags"
            :disabled="selectedTags.length === 0 || submitting"
            class="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {{ submitting ? 'Applying Tags...' : `Apply Tags to ${artworkIds.length} Artwork${artworkIds.length !== 1 ? 's' : ''}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  artworkIds: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tags-applied'])

// State
const loading = ref(true)
const error = ref('')
const successMessage = ref('')
const submitting = ref(false)

// Categories and tags
const categories = ref([])
const groups = ref([])
const availableTags = ref([])
const selectedCategoryId = ref('')
const selectedGroupId = ref('')
const selectedTagIds = ref([])
const selectedTags = ref([])

// New group creation
const showCreateGroupForm = ref(false)
const newGroupName = ref('')
const newGroupDescription = ref('')
const creatingGroup = ref(false)

// Custom tag
const newTagName = ref('')

// Auth
const token = useCookie('admin-token') // Use admin-token instead of auth-token for admin endpoints

const fetchTags = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('Fetching tags')
    // Use the public tags endpoint which doesn't require admin authentication
    const response = await $fetch('/api/tags')
    
    console.log('Tag response received:', response)
    if (!response || !response.categories) {
      console.error('Invalid response format:', response)
      error.value = 'Invalid response format from server'
      return
    }
    
    categories.value = response.categories || []
  } catch (err) {
    console.error('Error fetching tags:', err)
    error.value = 'Failed to load tag categories'
  } finally {
    loading.value = false
  }
}

const onCategoryChange = () => {
  selectedGroupId.value = ''
  selectedTagIds.value = []
  selectedTags.value = []
  
  if (selectedCategoryId.value) {
    const category = categories.value.find(c => c.categoryId === selectedCategoryId.value)
    groups.value = category ? category.groups : []
  } else {
    groups.value = []
  }
}

const onGroupChange = () => {
  selectedTagIds.value = []
  selectedTags.value = []
  
  if (selectedGroupId.value) {
    const group = groups.value.find(g => g.groupId === selectedGroupId.value)
    availableTags.value = group ? group.tags : []
  } else {
    availableTags.value = []
  }
}

const createNewGroup = async () => {
  if (!newGroupName.value.trim() || !selectedCategoryId.value) return
  
  try {
    creatingGroup.value = true
    error.value = ''
    
    console.log('Creating new tag group with token:', token.value ? 'Token exists' : 'No token')
    
    const response = await $fetch('/api/admin/create-tag-group', {
      method: 'POST',
      body: {
        name: newGroupName.value.trim(),
        description: newGroupDescription.value.trim(),
        categoryId: selectedCategoryId.value
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    console.log('Tag group creation response:', response)
    
    // Add new group to the groups list
    groups.value.push(response.group)
    
    // Select the new group
    selectedGroupId.value = response.group.groupId
    onGroupChange()
    
    // Clear form
    showCreateGroupForm.value = false
    newGroupName.value = ''
    newGroupDescription.value = ''
    
  } catch (err) {
    console.error('Error creating group:', err)
    if (err.response) {
      console.error('Response status:', err.response.status)
      console.error('Response data:', err.response._data)
    }
    error.value = err.data?.message || `Failed to create group: ${err.message || 'Unknown error'}`
  } finally {
    creatingGroup.value = false
  }
}

const addCustomTag = () => {
  if (!newTagName.value.trim() || !selectedGroupId.value) return
  
  const newTag = {
    id: `new-${Date.now()}`,
    name: newTagName.value.trim(),
    groupId: selectedGroupId.value,
    isCustom: true
  }
  
  selectedTags.value.push(newTag)
  newTagName.value = ''
}

const removeTag = (tagId) => {
  selectedTags.value = selectedTags.value.filter(tag => tag.id !== tagId)
  
  if (!tagId.toString().startsWith('new-')) {
    selectedTagIds.value = selectedTagIds.value.filter(id => id !== tagId)
  }
}

const updateSelectedTags = () => {
  const existingTags = []
  
  for (const tagId of selectedTagIds.value) {
    const category = categories.value.find(c => 
      c.groups.some(g => g.tags.some(t => t.tagId === tagId))
    )
    
    if (category) {
      const group = category.groups.find(g => g.tags.some(t => t.tagId === tagId))
      if (group) {
        const tag = group.tags.find(t => t.tagId === tagId)
        if (tag) {
          existingTags.push({
            id: tag.tagId,
            name: tag.name,
            groupId: group.groupId
          })
        }
      }
    }
  }
  
  const customTags = selectedTags.value.filter(tag => tag.isCustom)
  selectedTags.value = [...existingTags, ...customTags]
}

const applyTags = async () => {
  if (selectedTags.value.length === 0 || props.artworkIds.length === 0) return
  
  submitting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const tagsToApply = selectedTags.value.map(tag => {
      if (tag.isCustom) {
        return {
          name: tag.name,
          groupId: tag.groupId
        }
      } else {
        return {
          tagId: tag.id
        }
      }
    })
    
    const response = await $fetch('/api/admin/bulk-update-tags', {
      method: 'POST',
      body: {
        artworkIds: props.artworkIds,
        tags: tagsToApply
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    successMessage.value = response.message || `Tags applied successfully to ${props.artworkIds.length} artwork${props.artworkIds.length !== 1 ? 's' : ''}`
    
    emit('tags-applied', {
      tags: selectedTags.value,
      artworkIds: props.artworkIds
    })
    
    // Clear selections
    selectedTags.value = []
    selectedTagIds.value = []
    
  } catch (err) {
    console.error('Error applying bulk tags:', err)
    error.value = err.data?.message || 'Failed to apply tags'
  } finally {
    submitting.value = false
  }
}

// Watch for changes in selectedTagIds
watch(selectedTagIds, () => {
  updateSelectedTags()
})

// Initialize
onMounted(async () => {
  await fetchTags()
})
</script>

<style scoped>
.bulk-tag-manager {
  /* Add any specific styles if needed */
}
</style>
