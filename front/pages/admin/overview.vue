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
              <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <h3 class="text-lg font-semibold mb-2">Upload Artwork</h3>
                <p class="text-gray-600 mb-4">Add new artwork to the archive</p>
                <NuxtLink to="/admin/upload" class="inline-block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Upload Now
                </NuxtLink>
              </div>
              
              <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <h3 class="text-lg font-semibold mb-2">Manage Tags</h3>
                <p class="text-gray-600 mb-4">Create and organize artwork tags</p>
                <button disabled class="inline-block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
              
              <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <h3 class="text-lg font-semibold mb-2">User Management</h3>
                <p class="text-gray-600 mb-4">Manage admin users and permissions</p>
                <button disabled class="inline-block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
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