<script setup lang="ts">
import router from '@/router'
</script>
<template>
  <div class="relative h-screen bg-black">
    <div class="absolute inset-0 bg-[url('@/assets/hero-bg.png')] bg-cover bg-center"></div>
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="absolute inset-0 bg-black/30"></div>
    <div class="relative h-screen flex flex-col items-center justify-center text-white gap-15">
      <div class="w-3/5 text-8xl font-bold text-center">From Crust to Crave, Delivered Fast.</div>
      <button
        @click="router.push('/signin')"
        class="group relative overflow-hidden bg-transparent border-primary border py-3 px-5 rounded-sm font-semibold"
      >
        <span class="relative z-10">Order Now</span>
        <div
          class="absolute left-1/2 top-1/2 w-[110%] aspect-square rounded-full bg-primary -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 duration-400 transition-transform"
        ></div>
      </button>
    </div>
  </div>
</template>
