<template>
  <div>
    <h1>Admin Login</h1>
    
    <form @submit.prevent="onSubmit">
      <div>
        <label for="username">Username:</label>
        <input 
          id="username"
          v-model="state.username" 
          type="text" 
          placeholder="Enter username"
          required
        />
      </div>
      
      <div>
        <label for="password">Password:</label>
        <input 
          id="password"
          v-model="state.password" 
          type="password" 
          placeholder="Enter password"
          required
        />
      </div>

      <div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </div>
    </form>
    
    <div v-if="error" style="color: red; margin-top: 10px;">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const state = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: state.username,
        password: state.password
      }
    })
    
    if (response.token) {
      const token = useCookie('admin-token', {
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      token.value = response.token
      await navigateTo('/admin/overview')
    }
  } catch (err) {
    error.value = err.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>