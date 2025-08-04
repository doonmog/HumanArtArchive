<template>
  <div v-if="tags && tags.length > 0" class="space-y-3">
    <h3 v-if="showTitle" class="text-lg font-semibold text-black">Tags</h3>
    
    <!-- Tag groups organized by category -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="category in categories" :key="category">
        <div class="space-y-4">
          <h4 class="font-medium text-gray-900">{{ category }}</h4>
          
          <!-- Groups in this category -->
          <div class="space-y-3">
            <template v-for="group in getGroupsByCategory(category)" :key="group.name">
              <div class="space-y-2">
                <h5 class="text-sm font-medium text-gray-700">{{ group.name }}</h5>
                
                <!-- Tags in this group -->
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in group.tags"
                    :key="tag.tag_name"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ tag.tag_name }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  showTitle: {
    type: Boolean,
    default: true
  }
})

// Group tags by category and group
const groupedTags = computed(() => {
  if (!props.tags || props.tags.length === 0) return []
  
  const groups = new Map()
  
  props.tags.forEach(tag => {
    const groupName = tag.group_name || 'Other'
    if (!groups.has(groupName)) {
      groups.set(groupName, { 
        name: groupName === 'Other' ? 'Uncategorized' : groupName, 
        tags: [],
        category: tag.category || 'Other' // Use 'Other' as default category
      })
    }
    groups.get(groupName).tags.push(tag)
  })
  
  return Array.from(groups.values()).sort((a, b) => {
    if (a.name === 'Uncategorized') return 1
    if (b.name === 'Uncategorized') return -1
    return a.name.localeCompare(b.name)
  })
})

// Get unique categories
const categories = computed(() => {
  const uniqueCategories = new Set(groupedTags.value.map(group => group.category))
  return Array.from(uniqueCategories).sort()
})

// Get groups by category
const getGroupsByCategory = (category) => {
  return groupedTags.value.filter(group => group.category === category)
}
</script>
