<template>
  <div class="tag-manager">
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-700 mb-2">Add Tags to Artwork</h3>
      
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
        <!-- Apply to all images toggle -->
        <div class="flex items-center mb-4">
          <input 
            id="applyToAll" 
            v-model="applyToAllImages" 
            type="checkbox" 
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="applyToAll" class="ml-2 text-sm text-gray-700">
            Apply tags to all images in this artwork
          </label>
        </div>
        
        <!-- Image selection (when not applying to all) -->
        <div v-if="!applyToAllImages && imageOptions.length > 0" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Image</label>
          <select 
            v-model="selectedImageId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="image in imageOptions" :key="image.id" :value="image.id">
              {{ image.name || `Image #${image.order}` }}
            </option>
          </select>
        </div>
        
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Group name"
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
                    class="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ creatingGroup ? 'Creating...' : 'Create Group' }}
                  </button>
                  <button 
                    @click="cancelCreateGroup"
                    class="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            <div class="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
              <div v-for="tag in availableTags" :key="tag.tagId" class="flex items-center mb-2">
                <input 
                  :id="`tag-${tag.tagId}`" 
                  type="checkbox"
                  :value="tag.tagId"
                  v-model="selectedTagIds"
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
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new tag name"
              />
              <button 
                @click="addCustomTag"
                :disabled="!newTagName.trim()"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div 
              v-for="tag in selectedTags" 
              :key="tag.id" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ tag.name }}
              <button 
                type="button" 
                @click="removeTag(tag.id)" 
                class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
              >
                <span class="sr-only">Remove tag</span>
                <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Apply tags button -->
        <div class="mt-4">
          <button 
            @click="applyTags"
            :disabled="selectedTags.length === 0 || submitting || (!applyToAllImages && !selectedImageId)"
            class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Applying...' : 'Apply Tags' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  artworkId: {
    type: String,
    required: true
  },
  images: {
    type: Array,
    default: () => []
  },
  autoApply: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['tags-applied']);

// State
const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const successMessage = ref('');
const categories = ref([]);
const selectedCategoryId = ref('');
const selectedGroupId = ref('');
const selectedTagIds = ref([]);
const selectedTags = ref([]);
const newTagName = ref('');
const applyToAllImages = ref(true);
const selectedImageId = ref('')
const token = useCookie('admin-token')
const showCreateGroupForm = ref(false)
const newGroupName = ref('')
const newGroupDescription = ref('')
const creatingGroup = ref(false);

// Computed properties
const groups = computed(() => {
  if (!selectedCategoryId.value) return [];
  const category = categories.value.find(c => c.categoryId === selectedCategoryId.value);
  return category ? category.groups : [];
});

const availableTags = computed(() => {
  if (!selectedGroupId.value) return [];
  const category = categories.value.find(c => c.categoryId === selectedCategoryId.value);
  if (!category) return [];
  
  const group = category.groups.find(g => g.groupId === selectedGroupId.value);
  return group ? group.tags : [];
});

const imageOptions = computed(() => {
  return props.images.map((img, index) => ({
    id: img.id || img.image_id,
    name: img.name || img.resolution,
    order: index + 1
  }));
});

// Methods
const fetchTags = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch('/api/tags');
    
    categories.value = response.categories || [];
  } catch (err) {
    console.error('Error fetching tags:', err);
    error.value = 'Failed to load tag categories';
  } finally {
    loading.value = false;
  }
};

const onCategoryChange = () => {
  selectedGroupId.value = ''
  selectedTagIds.value = []
  showCreateGroupForm.value = false
}

const onGroupChange = () => {
  selectedTagIds.value = []
}

const createNewGroup = async () => {
  if (!newGroupName.value.trim() || !selectedCategoryId.value) return
  
  creatingGroup.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/create-tag-group', {
      method: 'POST',
      body: {
        categoryId: selectedCategoryId.value,
        name: newGroupName.value.trim(),
        description: newGroupDescription.value.trim() || null
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    // Add the new group to the current category
    const category = categories.value.find(c => c.categoryId === selectedCategoryId.value)
    if (category) {
      category.groups.push(response.group)
    }
    
    // Select the newly created group
    selectedGroupId.value = response.group.groupId
    
    // Clear form and hide it
    cancelCreateGroup()
    
    successMessage.value = response.message
    
  } catch (err) {
    console.error('Error creating tag group:', err)
    error.value = err.data?.message || 'Failed to create tag group'
  } finally {
    creatingGroup.value = false
  }
}

const cancelCreateGroup = () => {
  showCreateGroupForm.value = false
  newGroupName.value = ''
  newGroupDescription.value = ''
};

const addCustomTag = () => {
  if (!newTagName.value.trim() || !selectedGroupId.value) return;
  
  // Create a temporary tag object
  const newTag = {
    id: `new-${Date.now()}`,
    name: newTagName.value.trim(),
    groupId: selectedGroupId.value,
    isCustom: true
  };
  
  // Add to selected tags
  selectedTags.value.push(newTag);
  
  // Clear input
  newTagName.value = '';
};

const removeTag = (tagId) => {
  // Remove from selected tags array
  selectedTags.value = selectedTags.value.filter(tag => tag.id !== tagId);
  
  // If it's an existing tag (not custom), also remove from selectedTagIds
  if (!tagId.toString().startsWith('new-')) {
    selectedTagIds.value = selectedTagIds.value.filter(id => id !== tagId);
  }
};

const updateSelectedTags = () => {
  // First, add all selected existing tags
  const existingTags = [];
  
  for (const tagId of selectedTagIds.value) {
    // Find the tag in available tags
    const category = categories.value.find(c => 
      c.groups.some(g => g.tags.some(t => t.tagId === tagId))
    );
    
    if (category) {
      const group = category.groups.find(g => g.tags.some(t => t.tagId === tagId));
      if (group) {
        const tag = group.tags.find(t => t.tagId === tagId);
        if (tag) {
          existingTags.push({
            id: tag.tagId,
            name: tag.name,
            groupId: group.groupId
          });
        }
      }
    }
  }
  
  // Keep custom tags and add existing tags
  const customTags = selectedTags.value.filter(tag => tag.isCustom);
  selectedTags.value = [...existingTags, ...customTags];
};

const applyTags = async () => {
  if (selectedTags.value.length === 0) return;
  if (!applyToAllImages.value && !selectedImageId.value) return;
  
  submitting.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    // Prepare tags for API
    const tagsToApply = selectedTags.value.map(tag => {
      if (tag.isCustom) {
        // For custom tags, send name and groupId
        return {
          name: tag.name,
          groupId: tag.groupId
        };
      } else {
        // For existing tags, send tagId
        return {
          tagId: tag.id
        };
      }
    });
    
    // Call API to apply tags
    const response = await $fetch('/api/admin/update-tags', {
      method: 'POST',
      body: {
        artworkId: props.artworkId,
        tags: tagsToApply,
        applyToAllImages: applyToAllImages.value,
        imageId: !applyToAllImages.value ? selectedImageId.value : undefined
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    successMessage.value = response.message || 'Tags applied successfully';
    emit('tags-applied', {
      tags: selectedTags.value,
      applyToAllImages: applyToAllImages.value,
      imageId: !applyToAllImages.value ? selectedImageId.value : null
    });
    
    // Clear selections if not auto-applying
    if (!props.autoApply) {
      selectedTags.value = [];
      selectedTagIds.value = [];
    }
    
    // Hide create group form on success
    showCreateGroupForm.value = false
    
  } catch (err) {
    console.error('Error applying tags:', err);
    error.value = err.data?.message || 'Failed to apply tags';
  } finally {
    submitting.value = false;
  }
};

// Watch for changes in selectedTagIds
watch(selectedTagIds, () => {
  updateSelectedTags();
});

// Watch for changes in applyToAllImages to auto-select first image
watch(applyToAllImages, (newValue) => {
  if (!newValue && props.images.length > 0 && !selectedImageId.value) {
    selectedImageId.value = props.images[0].id || props.images[0].image_id;
  }
});

// Initialize
onMounted(async () => {
  await fetchTags();
  
  // Set first image as selected if available
  if (props.images.length > 0 && !applyToAllImages.value) {
    selectedImageId.value = props.images[0].id || props.images[0].image_id;
  }
  
  // Auto-apply if requested
  if (props.autoApply && props.artworkId) {
    // Wait for next tick to ensure component is fully mounted
    nextTick(() => {
      applyTags();
    });
  }
});
</script>