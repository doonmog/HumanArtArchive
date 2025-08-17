<template>
  <div class="flex items-center space-x-2 mb-6">
    <span class="text-sm font-medium text-gray-700">View:</span>
    <div class="flex bg-gray-100 rounded-lg p-1">
      <button
        @click="$emit('update:view-mode', 'grid')"
        :class="[
          'px-3 py-1 text-sm font-medium rounded-md transition-colors',
          viewMode === 'grid'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        ]"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Grid
      </button>
      <button
        @click="$emit('update:view-mode', 'dynamic')"
        :class="[
          'px-3 py-1 text-sm font-medium rounded-md transition-colors',
          viewMode === 'dynamic'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        ]"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Dynamic
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'dynamic'].includes(value)
  }
})

const emit = defineEmits(['update:view-mode'])
</script>
