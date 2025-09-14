<script setup lang="ts">
import router from '@/router'

const Links = [
  {
    name: 'Home',
  },
  {
    name: 'About Us',
  },
  {
    name: 'Menu',
  },
  {
    name: 'Contact',
  },
]
</script>

<template>
  <div class="w-full flex justify-between absolute top-0 px-40 gap-10 py-6 text-lg z-10">
    <div>
      <img src="@/assets/logo.png" alt="Logo" class="w-50" />
    </div>
    <div class="flex gap-[clamp(20px,10vw,100px)] items-center">
      <button v-for="link in Links" class="text-white">
        {{ link.name }}
      </button>
    </div>
    <div class="flex gap-8">
      <button class="text-primary">Sign In</button>
      <button class="bg-primary text-white px-4 py-3 rounded-sm">Sign Up</button>
    </div>
  </div>
</template>
