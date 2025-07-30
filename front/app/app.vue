<script setup>
import { ref } from 'vue'

const message = ref('')
const error = ref('')

async function testConnection() {
  message.value = ''
  error.value = ''
  try {
    const response = await fetch('/api/db-test')
      .catch(e => {
        throw new Error(`Network error: ${e.message}. Is the backend running and accessible?`);
      });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }))
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`)
    }
    const data = await response.json()
    if (data.success) {
      message.value = `Database connection successful! DB time: ${data.data.now}`
    } else {
      throw new Error(data.message || 'An unknown error occurred.')
    }
  } catch (e) {
    console.error(e)
    error.value = e.message
  }
}
</script>

<template>
  <div style="font-family: sans-serif; padding: 2rem;">
    <h1>Connection Test</h1>
    <p>Click the button to test the connection from the front-end to the back-end and database.</p>
    <button @click="testConnection" style="padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;">Test Connection</button>
    <div v-if="message" style="margin-top: 1rem; padding: 1rem; background-color: #e0ffe0; border: 1px solid #a0c0a0;">
      <strong>Success:</strong> {{ message }}
    </div>
    <div v-if="error" style="margin-top: 1rem; padding: 1rem; background-color: #ffe0e0; border: 1px solid #c0a0a0;">
      <strong>Error:</strong> {{ error }}
    </div>
  </div>
</template>
