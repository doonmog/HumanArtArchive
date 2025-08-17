<template>
  <div v-if="pagination">
    <!-- Pagination Info -->
    <div class="mt-8 text-center">
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Showing {{ currentItemsCount }} of {{ pagination.totalItems }} artwork{{ pagination.totalItems !== 1 ? 's' : '' }}
        (Page {{ pagination.currentPage }} of {{ pagination.totalPages }})
      </p>
    </div>

    <!-- Pagination Controls -->
    <div v-if="pagination.totalPages > 1" class="mt-6 flex justify-center items-center space-x-2">
      <!-- Previous Button -->
      <button
        @click="$emit('prev-page')"
        :disabled="!pagination.hasPrevPage"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <!-- Page Numbers -->
      <div class="flex space-x-1">
        <!-- First page -->
        <button
          v-if="pagination.currentPage > 3"
          @click="$emit('go-to-page', 1)"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          1
        </button>
        <span v-if="pagination.currentPage > 4" class="px-2 py-2 text-gray-500">...</span>

        <!-- Pages around current page -->
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('go-to-page', page)"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md',
            page === pagination.currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>

        <!-- Last page -->
        <span v-if="pagination.currentPage < pagination.totalPages - 3" class="px-2 py-2 text-gray-500">...</span>
        <button
          v-if="pagination.currentPage < pagination.totalPages - 2"
          @click="$emit('go-to-page', pagination.totalPages)"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {{ pagination.totalPages }}
        </button>
      </div>

      <!-- Next Button -->
      <button
        @click="$emit('next-page')"
        :disabled="!pagination.hasNextPage"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pagination: {
    type: Object,
    required: true
  },
  currentItemsCount: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['go-to-page', 'next-page', 'prev-page'])

const visiblePages = computed(() => {
  if (!props.pagination) return []
  
  const current = props.pagination.currentPage
  const total = props.pagination.totalPages
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>
