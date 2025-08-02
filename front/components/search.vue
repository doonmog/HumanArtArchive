<template>
  <div class="relative w-full max-w-md">
    <UInput
      v-model="searchQuery"
      placeholder="Search artwork..."
      size="md"
      :ui="{ 
        icon: { trailing: { pointer: '' } },
        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
        rounded: 'rounded-full',
        placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',
        size: {
          md: 'text-sm'
        },
        gap: {
          md: 'gap-x-2.5'
        },
        padding: {
          md: 'px-4 py-2.5'
        }
      }"
      class="bg-gray-50 hover:bg-gray-100 focus:bg-white transition-colors"
    >
      <template #trailing>
        <UButton
          variant="ghost"
          size="xs"
          :padded="false"
          class="text-gray-400 hover:text-gray-600"
        >
          <UIcon name="i-heroicons-solid:magnifying-glass" class="h-4 w-4" />
        </UButton>
      </template>
    </UInput>
  </div>
</template>

<script setup>
const searchQuery = ref('')
</script>