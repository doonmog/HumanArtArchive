export default defineNuxtRouteMiddleware(async (to, from) => {
  const token = useCookie('admin-token')
  
  if (!token.value) {
    return navigateTo('/login')
  }

  try {
    const response = await $fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (!response.username) {
      token.value = null
      return navigateTo('/login')
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    token.value = null
    return navigateTo('/login')
  }
})
