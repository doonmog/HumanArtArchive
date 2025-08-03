<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">
              Hello {{ username }}!
            </h1>
            <p class="text-gray-600 mb-8">
              Welcome to the Human Art Archive admin panel.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <UCard class="hover:shadow-lg transition-shadow">
                <template #header>
                  <h3 class="text-lg font-semibold">Upload Artwork</h3>
                </template>
                <p class="text-gray-600 mb-4">Add new artwork to the archive</p>
                <UButton disabled variant="outline" class="w-full">
                  Coming Soon
                </UButton>
              </UCard>
              
              <UCard class="hover:shadow-lg transition-shadow">
                <template #header>
                  <h3 class="text-lg font-semibold">Manage Tags</h3>
                </template>
                <p class="text-gray-600 mb-4">Create and organize artwork tags</p>
                <UButton disabled variant="outline" class="w-full">
                  Coming Soon
                </UButton>
              </UCard>
              
              <UCard class="hover:shadow-lg transition-shadow">
                <template #header>
                  <h3 class="text-lg font-semibold">User Management</h3>
                </template>
                <p class="text-gray-600 mb-4">Manage admin users and permissions</p>
                <UButton disabled variant="outline" class="w-full">
                  Coming Soon
                </UButton>
              </UCard>
            </div>
            
            <div class="mt-8">
              <UButton @click="logout" color="red" variant="outline">
                Logout
              </UButton>
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

const username = ref('Admin')

const logout = async () => {
  const token = useCookie('admin-token')
  token.value = null
  await navigateTo('/login')
}

onMounted(async () => {
  try {
    const token = useCookie('admin-token')
    if (token.value) {
      const response = await $fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      if (response.username) {
        username.value = response.username
      }
    }
  } catch (error) {
    console.error('Failed to verify token:', error)
    await navigateTo('/login')
  }
})
</script>