<script setup lang="ts">
import { toBase64 } from '@/plugins/convert'
import { useAuthStore } from '@/stores/auth'
import { Bell, ChevronDown } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
const auth = useAuthStore()
const user = ref(auth.user ? { ...auth.user } : {})
const route = useRoute()
const displayName = computed(() => {
  return user.value?.name || (user.value?.firstName && user.value?.lastName)
    ? `${user.value.firstName} ${user.value.lastName}`
    : user.value?.userName || user.value?.username || user.value?.userEmail || ''
})

const Links = [
  {
    to: '/dashboard/admin',
    name: 'Dashboard',
  },
  {
    to: '/admin/menu',
    name: 'Menu',
  },
  {
    to: '/admin/orders',
    name: 'Orders',
  },
]

const preview = ref<string | null>(user.value?.profileImage || user.value?.profileImageUrl || null)

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
  <header class="bg-[#121A1D] text-white">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div class="flex justify-between items-center h-20 py-4">
        <!-- Logo -->
        <div class="flex items-center">
          <div>
            <img src="@/assets/logo.png" alt="Cebu Crust" />
          </div>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-10">
          <RouterLink
            v-for="link in Links"
            :key="link.name"
            :to="link.to"
            :class="[
              route.path === link.to
                ? 'text-orange-300 font-medium px-3 py-2'
                : 'text-gray-300 hover:text-white font-medium px-3 py-2',
            ]"
            >{{ link.name }}</RouterLink
          >
        </nav>

        <!-- User & Notifications -->
        <div class="flex items-center space-x-6">
          <div class="relative">
            <button class="text-gray-300 hover:text-white relative p-2">
              <Bell class="h-6 w-6" />
              <span
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                >3</span
              >
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <img
                v-if="preview"
                :src="toBase64(preview)"
                alt="profile"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-gray-300 font-medium">{{ displayName }}</span>
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
