<script setup lang="ts">

import router from '@/router'
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const props = defineProps({
  class: { type: String, default: '' },
})

const isMenuOpen = ref(false)

const links = [
  { name: 'Home', target: 'top' },
  { name: 'About Us', target: 'about' },
  { name: 'Menu', target: 'menu' },
  { name: 'Contact', target: 'contact' },
]

async function scrollTo(id: string) {
  if (route.path !== '/') await router.push('/')
  const el = id === 'top' ? document.documentElement : document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
  isMenuOpen.value = false // Close menu after navigation
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div
    :class="[
      'w-full flex justify-between absolute top-0 px-4 sm:px-8 lg:px-30 gap-4 sm:gap-6 lg:gap-10 py-4 text-lg z-10',
      props.class,
    ]"
  >
    <!-- Logo -->
    <div>
      <img
        src="@/assets/logo.png"
        alt="Logo"
        class="w-40 sm:w-45 lg:w-55 cursor-pointer"
        @click="scrollTo('top')"
      />
    </div>

    <!-- Desktop Navigation -->
    <div class="hidden lg:flex gap-[clamp(20px,10vw,100px)] items-center">
      <button
        v-for="link in links"
        :key="link.name"
        @click="scrollTo(link.target)"
        class="relative group text-white pb-1 hover:text-primary duration-300 transition-colors"
      >
        {{ link.name }}
        <span
          class="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2px] w-full bg-primary origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        ></span>
      </button>
    </div>

    <!-- Desktop Auth Buttons -->
    <div class="hidden lg:flex gap-8">
      <button @click="router.push('/signin')" class="text-primary">Sign In</button>
      <button @click="router.push('/signup')" class="bg-primary text-white px-4 py-3 rounded-sm">
        Sign Up
      </button>
    </div>

    <!-- Mobile Auth Buttons -->
    <div class="flex lg:hidden gap-2 sm:gap-4">
      <button @click="router.push('/signin')" class="text-primary text-sm sm:text-base">Sign In</button>
      <button @click="router.push('/signup')" class="bg-primary text-white px-2 sm:px-4 py-2 sm:py-3 rounded-sm text-sm sm:text-base">
        Sign Up
      </button>
    </div>

    <!-- Burger Menu Button -->
    <button
      @click="toggleMenu"
      class="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
    >
      <span
        :class="[
          'block w-6 h-0.5 bg-white transition-all duration-300',
          isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
        ]"
      ></span>
      <span
        :class="[
          'block w-6 h-0.5 bg-white transition-all duration-300',
          isMenuOpen ? 'opacity-0' : ''
        ]"
      ></span>
      <span
        :class="[
          'block w-6 h-0.5 bg-white transition-all duration-300',
          isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
        ]"
      ></span>
    </button>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 bg-black/50 z-50 lg:hidden"
      @click="isMenuOpen = false"
    ></div>

    <!-- Mobile Menu -->
    <div
      :class="[
        'fixed top-0 right-0 h-full w-80 bg-[#121A1D] z-50 transform transition-transform duration-300 lg:hidden',
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full p-6">
        <!-- Close Button -->
        <div class="flex justify-end mb-8">
          <button @click="isMenuOpen = false" class="text-white text-2xl">
            ×
          </button>
        </div>

        <!-- Mobile Navigation Links -->
        <div class="flex flex-col gap-6">
          <button
            v-for="link in links"
            :key="link.name"
            @click="scrollTo(link.target)"
            class="text-white text-xl hover:text-primary transition-colors text-left"
          >
            {{ link.name }}
          </button>
        </div>

        <!-- Mobile Auth Buttons -->
        <div class="flex flex-col gap-4 mt-auto">
          <button @click="router.push('/signin')" class="text-primary text-lg text-left">
            Sign In
          </button>
          <button @click="router.push('/signup')" class="bg-primary text-white px-6 py-3 rounded-sm text-lg">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
