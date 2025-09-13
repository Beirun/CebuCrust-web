<template>
  <div>Landing</div>
  <div>
    <input placeholder="Email" type="text" v-model="userCredentials.email" />
    <input placeholder="Password" type="password" v-model="userCredentials.password" />
    <button @click="auth.login(userCredentials)">Login</button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const userCredentials = reactive({
  email: '',
  password: '',
})
</script>
