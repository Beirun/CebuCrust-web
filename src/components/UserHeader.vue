<script setup lang="ts">
import { toBase64 } from '@/plugins/convert'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, Bell, ChevronDown } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
const auth = useAuthStore()
const cart = useCartStore()
const user = ref(auth.user ? { ...auth.user } : {})

const displayName = computed(() => {
  return user.value?.name || (user.value?.firstName && user.value?.lastName)
    ? `${user.value.firstName} ${user.value.lastName}`
    : user.value?.userName || user.value?.username || user.value?.userEmail || ''
})

const preview = ref<string | null>(user.value?.profileImage || user.value?.profileImageUrl || null)

// Safely format an image source for <img>.
// Accepts:
// - data URLs (returned as-is)
// - absolute/relative URLs (returned as-is)
// - raw base64 string (wrapped with data:image/png;base64,)
const formatImage = (img: string | null) => {
  if (!img) return null
  if (typeof img !== 'string') return null
  const trimmed = img.trim()
  // already a data URL
  if (trimmed.startsWith('data:')) return trimmed
  // probably a full/relative URL
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed
  // otherwise assume it's a raw base64 payload
  return toBase64(trimmed)
}

// Keep local user in sync if auth.user changes (e.g. login/logout elsewhere)
watch(
  () => auth.user,
  (val) => {
    user.value = val ? { ...val } : {}
    preview.value = user.value?.profileImage || user.value?.profileImageUrl || null
  },
  { immediate: true },
)
</script>
<template>
  <header class="bg-gray-900 shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <div class="flex items-center space-x-2">
            <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto" />
          </div>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <router-link to="/dashboard" class="text-white hover:text-orange-500"
            >Dashboard</router-link
          >
          <router-link to="/menu" class="text-white hover:text-orange-500">Menu</router-link>
          <router-link to="/orders" class="text-white hover:text-orange-500">Orders</router-link>
          <router-link to="/favorites" class="text-white hover:text-orange-500"
            >Favorites</router-link
          >
        </nav>

        <!-- User Actions -->
        <div class="flex items-center space-x-4">
          <router-link to="/cart" class="relative p-2 text-white hover:text-orange-500">
            <ShoppingCart class="w-6 h-6" />
            <span
              v-if="cart.cart.length > 0"
              class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full"
              >{{ cart.cart.length }}</span
            >
          </router-link>
          <button class="p-2 text-white hover:text-orange-500 relative">
            <Bell class="w-6 h-6" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <router-link
            to="/settings"
            class="flex items-center space-x-2 text-white hover:text-orange-300"
          >
            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                v-if="preview"
                :src="formatImage(preview)"
                alt="profile"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-white font-medium">{{ displayName }}</span>
            <ChevronDown class="w-4 h-4 text-white" />
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>
