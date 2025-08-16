<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">Tag Manager</h1>
          
          <!-- Loading state -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          
          <!-- Error state -->
          <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline"> {{ error }}</span>
          </div>
          
          <!-- Content -->
          <div v-else>
            <!-- Create new category section -->
            <div class="mb-8 bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold mb-4">Create New Tag Group</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select v-model="newGroup.categoryId" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="" disabled>Select a category</option>
                    <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">
                      {{ category.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input type="text" v-model="newGroup.name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter group name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" v-model="newGroup.description" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter description (optional)" />
                </div>
              </div>
              <div class="mt-4">
                <button @click="createTagGroup" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" :disabled="!newGroup.categoryId || !newGroup.name || creatingGroup">
                  <span v-if="creatingGroup">Creating...</span>
                  <span v-else>Create Tag Group</span>
                </button>
              </div>
            </div>
            
            <!-- Create new tag section -->
            <div class="mb-8 bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold mb-4">Create New Tag</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tag Group</label>
                  <select v-model="newTag.groupId" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="" disabled>Select a tag group</option>
                    <optgroup v-for="category in categories" :key="category.categoryId" :label="category.name">
                      <option v-for="group in category.groups" :key="group.groupId" :value="group.groupId">
                        {{ group.name }}
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                  <input type="text" v-model="newTag.name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter tag name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" v-model="newTag.description" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter description (optional)" />
                </div>
              </div>
              <div class="mt-4">
                <button @click="createTag" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" :disabled="!newTag.groupId || !newTag.name || creatingTag">
                  <span v-if="creatingTag">Creating...</span>
                  <span v-else>Create Tag</span>
                </button>
              </div>
            </div>
            
            <!-- Tag browser -->
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold mb-4">Browse and Edit Tags</h2>
              
              <div v-for="category in categories" :key="category.categoryId" class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">{{ category.name }}</h3>
                <p v-if="category.description" class="text-sm text-gray-500 mb-2">{{ category.description }}</p>
                
                <div v-for="group in category.groups" :key="group.groupId" class="ml-4 mb-4 border-l-2 border-gray-200 pl-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <!-- Edit group form -->
                      <div v-if="editingGroupId === group.groupId" class="space-y-3">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                          <input 
                            v-model="editingGroupName" 
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Enter group name"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            v-model="editingGroupDescription" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Enter group description"
                            rows="2"
                          ></textarea>
                        </div>
                        <div class="flex space-x-2">
                          <button 
                            @click="saveGroupChanges(group.groupId)" 
                            class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            :disabled="!editingGroupName.trim()"
                          >
                            Save
                          </button>
                          <button 
                            @click="cancelEditingGroup" 
                            class="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      <!-- Display group info -->
                      <div v-else>
                        <h4 class="text-md font-medium text-gray-800">{{ group.name }}</h4>
                        <p v-if="group.description" class="text-sm text-gray-500 mt-1">{{ group.description }}</p>
                        <p v-else class="text-sm text-gray-400 italic mt-1">No description</p>
                      </div>
                    </div>
                    
                    <!-- Group action buttons -->
                    <div v-if="editingGroupId !== group.groupId" class="flex space-x-2">
                      <button 
                        @click="startEditingGroup(group)" 
                        class="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        @click="deleteGroup(group)" 
                        class="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div class="mt-2">
                    <div v-for="tag in group.tags" :key="tag.tagId" class="ml-4 mb-2">
                      <!-- Edit tag form -->
                      <div v-if="editingTagId === tag.tagId" class="space-y-2">
                        <div>
                          <label class="block text-sm font-medium text-gray-600 mb-1">Tag Name</label>
                          <input 
                            v-model="editingTagName" 
                            type="text"
                            class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Enter tag name"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-600 mb-1">Description</label>
                          <textarea 
                            v-model="editingTagDescription" 
                            class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Enter tag description"
                            rows="2"
                          ></textarea>
                        </div>
                        <div class="flex space-x-2">
                          <button 
                            @click="saveTagChanges(tag.tagId)" 
                            class="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                            :disabled="!editingTagName.trim()"
                          >
                            Save
                          </button>
                          <button 
                            @click="cancelEditingTag" 
                            class="px-2 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      <!-- Display tag info -->
                      <div v-else class="flex items-center justify-between">
                        <div>
                          <span class="text-sm font-medium text-gray-700">{{ tag.name }}</span>
                          <p v-if="tag.description" class="text-xs text-gray-500">{{ tag.description }}</p>
                          <p v-else class="text-xs text-gray-400 italic">No description</p>
                        </div>
                        <div class="flex space-x-2">
                          <button 
                            @click="startEditingTag(tag)" 
                            class="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                          <button 
                            @click="deleteTag(tag)" 
                            class="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth'
})

const loading = ref(true)
const error = ref(null)
const categories = ref([])

// New tag group form
const newGroup = ref({
  categoryId: '',
  name: '',
  description: ''
})
const creatingGroup = ref(false)

// New tag form
const newTag = ref({
  groupId: '',
  name: '',
  description: ''
})
const creatingTag = ref(false)

// Editing state
const editingGroupId = ref(null)
const editingGroupName = ref('')
const editingGroupDescription = ref('')
const editingTagId = ref(null)
const editingTagDescription = ref('')
const editingTagName = ref('')

// Fetch all tags on mount
onMounted(async () => {
  try {
    const token = useCookie('admin-token')
    const response = await $fetch('/api/tags', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    categories.value = response.categories
    loading.value = false
  } catch (err) {
    console.error('Failed to fetch tags:', err)
    error.value = 'Failed to load tags. Please try again later.'
    loading.value = false
  }
})

// Create a new tag group
async function createTagGroup() {
  if (!newGroup.value.categoryId || !newGroup.value.name) return
  
  creatingGroup.value = true
  try {
    const token = useCookie('admin-token')
    const response = await $fetch('/api/admin/manage-tags/create-tag-group', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: {
        categoryId: newGroup.value.categoryId,
        name: newGroup.value.name,
        description: newGroup.value.description
      }
    })
    
    // Add the new group to the UI
    const category = categories.value.find(c => c.categoryId === newGroup.value.categoryId)
    if (category) {
      category.groups.push(response.group)
    }
    
    // Reset form
    newGroup.value = {
      categoryId: '',
      name: '',
      description: ''
    }
    
  } catch (err) {
    console.error('Failed to create tag group:', err)
    error.value = 'Failed to create tag group. Please try again.'
  } finally {
    creatingGroup.value = false
  }
}

// Create a new tag
async function createTag() {
  if (!newTag.value.groupId || !newTag.value.name) return
  
  creatingTag.value = true
  try {
    const token = useCookie('admin-token')
    const response = await $fetch('/api/admin/manage-tags/create-tag', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: {
        groupId: newTag.value.groupId,
        name: newTag.value.name,
        description: newTag.value.description
      }
    })
    
    // Add the new tag to the UI
    for (const category of categories.value) {
      const group = category.groups.find(g => g.groupId === newTag.value.groupId)
      if (group) {
        group.tags.push(response.tag)
        break
      }
    }
    
    // Reset form
    newTag.value = {
      groupId: '',
      name: '',
      description: ''
    }
    
  } catch (err) {
    console.error('Failed to create tag:', err)
    error.value = 'Failed to create tag. Please try again.'
  } finally {
    creatingTag.value = false
  }
}

// Start editing a group
function startEditingGroup(group) {
  editingGroupId.value = group.groupId
  editingGroupName.value = group.name || ''
  editingGroupDescription.value = group.description || ''
}

// Cancel editing group
function cancelEditingGroup() {
  editingGroupId.value = null
  editingGroupName.value = ''
  editingGroupDescription.value = ''
}

// Save group changes
async function saveGroupChanges(groupId) {
  if (!editingGroupName.value.trim()) return
  
  try {
    const token = useCookie('admin-token')
    await $fetch(`/api/admin/manage-tags/update-tag-group/${groupId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: {
        name: editingGroupName.value,
        description: editingGroupDescription.value
      }
    })
    
    // Update the UI
    for (const category of categories.value) {
      const group = category.groups.find(g => g.groupId === groupId)
      if (group) {
        group.name = editingGroupName.value
        group.description = editingGroupDescription.value
        break
      }
    }
    
    // Reset editing state
    cancelEditingGroup()
    
  } catch (err) {
    console.error('Failed to update tag group:', err)
    if (err.data?.message) {
      error.value = err.data.message
    } else {
      error.value = 'Failed to update tag group. Please try again.'
    }
  }
}

// Delete tag group
async function deleteGroup(group) {
  if (!confirm(`Are you sure you want to delete the tag group "${group.name}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    const token = useCookie('admin-token')
    await $fetch(`/api/admin/manage-tags/delete-tag-group/${group.groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    // Remove from UI
    for (const category of categories.value) {
      const groupIndex = category.groups.findIndex(g => g.groupId === group.groupId)
      if (groupIndex !== -1) {
        category.groups.splice(groupIndex, 1)
        break
      }
    }
    
  } catch (err) {
    console.error('Failed to delete tag group:', err)
    if (err.data?.message) {
      error.value = err.data.message
    } else {
      error.value = 'Failed to delete tag group. Please try again.'
    }
  }
}

// Start editing a tag
function startEditingTag(tag) {
  editingTagId.value = tag.tagId
  editingTagName.value = tag.name || ''
  editingTagDescription.value = tag.description || ''
}

// Cancel editing tag
function cancelEditingTag() {
  editingTagId.value = null
  editingTagDescription.value = ''
  editingTagName.value = ''
}

// Save tag changes
async function saveTagChanges(tagId) {
  if (!editingTagName.value.trim()) return
  
  try {
    const token = useCookie('admin-token')
    await $fetch(`/api/admin/manage-tags/update-tag/${tagId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: {
        name: editingTagName.value,
        description: editingTagDescription.value
      }
    })
    
    // Update the UI
    for (const category of categories.value) {
      for (const group of category.groups) {
        const tag = group.tags.find(t => t.tagId === tagId)
        if (tag) {
          tag.name = editingTagName.value
          tag.description = editingTagDescription.value
          break
        }
      }
    }
    
    // Reset editing state
    cancelEditingTag()
    
  } catch (err) {
    console.error('Failed to update tag:', err)
    if (err.data?.message) {
      error.value = err.data.message
    } else {
      error.value = 'Failed to update tag. Please try again.'
    }
  }
}

// Delete tag
async function deleteTag(tag) {
  if (!confirm(`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    const token = useCookie('admin-token')
    await $fetch(`/api/admin/manage-tags/delete-tag/${tag.tagId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    // Remove from UI
    for (const category of categories.value) {
      for (const group of category.groups) {
        const tagIndex = group.tags.findIndex(t => t.tagId === tag.tagId)
        if (tagIndex !== -1) {
          group.tags.splice(tagIndex, 1)
          return
        }
      }
    }
    
  } catch (err) {
    console.error('Failed to delete tag:', err)
    if (err.data?.message) {
      error.value = err.data.message
    } else {
      error.value = 'Failed to delete tag. Please try again.'
    }
  }
}
</script>