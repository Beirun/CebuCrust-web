<template>
  <div></div>
  <!-- <button @click="auth.logout">Logout</button> -->
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>
