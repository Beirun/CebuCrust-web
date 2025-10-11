<script setup lang="ts">
import { toBase64 } from '@/plugins/convert'
import { useAuthStore } from '@/stores/auth'
import { Bell, ChevronDown, User, LogOut, X, BarChart3, Utensils, Package } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const user = ref(auth.user ? { ...auth.user } : {})

const displayName = computed(() => {
  return user.value?.name || (user.value?.firstName && user.value?.lastName)
    ? `${user.value.firstName} ${user.value.lastName}`
    : user.value?.userName || user.value?.username || user.value?.userEmail || ''
})

const preview = ref<string | null>(user.value?.profileImage || user.value?.profileImageUrl || null)

// Dropdown states
const isProfileDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)

// Admin navigation links
const navLinks = [
  { to: '/dashboard/admin', name: 'Dashboard', icon: BarChart3 },
  { to: '/admin/menu', name: 'Menu', icon: Utensils },
  { to: '/admin/orders', name: 'Orders', icon: Package },
]

// Profile dropdown items
const profileItems = [
  { name: 'Profile', icon: User, action: () => router.push('/settings') },
  { name: 'Logout', icon: LogOut, action: () => handleLogout() },
]

// Safely format an image source for <img>.
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

// Handle logout
const handleLogout = async () => {
  try {
    await auth.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Close dropdowns when clicking outside
const closeDropdowns = () => {
  isProfileDropdownOpen.value = false
  isMobileMenuOpen.value = false
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
  <header class="bg-[#121A1D] static border-b border-[#D3D3D3]/30">
    <div class="w-screen px-4 sm:px-8 lg:px-30">
      <div class="flex justify-between items-center h-20 py-4">
        <!-- Logo -->
        <div class="flex items-center">
          <div>
            <img src="@/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto" />
          </div>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex space-x-10">
          <router-link
            v-for="link in navLinks"
            :key="link.name"
            :to="link.to"
            class="relative group font-medium px-3 py-2 transition-colors duration-300"
            :class="[
              route.path === link.to
                ? 'text-primary'
                : 'text-gray-300 hover:text-white'
            ]"
          >
            {{ link.name }}
            <!-- Orange underline for active link -->
            <span
              v-if="route.path === link.to"
              class="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2px] w-full bg-primary"
            ></span>
            <!-- Hover underline effect -->
            <span
              v-else
              class="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2px] w-full bg-primary origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
            ></span>
          </router-link>
        </nav>

        <!-- Desktop User Actions -->
        <div class="hidden lg:flex items-center space-x-6">
          <!-- Notifications -->
          <button class="relative p-2 text-gray-300 hover:text-white transition-colors">
            <Bell class="w-6 h-6" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <!-- User Profile Dropdown -->
          <div class="relative">
            <button
              @click="isProfileDropdownOpen = !isProfileDropdownOpen"
              class="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
            >
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  v-if="preview"
                  :src="formatImage(preview)"
                  alt="profile"
                  class="w-full h-full object-cover"
                />
              </div>
              <span class="font-medium">{{ displayName }}</span>
              <ChevronDown 
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': isProfileDropdownOpen }"
              />
            </button>

            <!-- Profile Dropdown Menu -->
            <div
              v-if="isProfileDropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-[#192124] rounded-lg shadow-lg border border-[#D3D3D3]/30 py-2 z-50"
            >
              <button
                v-for="item in profileItems"
                :key="item.name"
                @click="item.action(); isProfileDropdownOpen = false"
                class="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-[#121A1D] transition-colors"
              >
                <component :is="item.icon" class="w-4 h-4" />
                <span>{{ item.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
        >
          <span
            :class="[
              'block w-6 h-0.5 bg-white transition-all duration-300',
              isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
            ]"
          ></span>
          <span
            :class="[
              'block w-6 h-0.5 bg-white transition-all duration-300',
              isMobileMenuOpen ? 'opacity-0' : ''
            ]"
          ></span>
          <span
            :class="[
              'block w-6 h-0.5 bg-white transition-all duration-300',
              isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
            ]"
          ></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="closeDropdowns"
    ></div>

    <!-- Mobile Menu -->
    <div
      :class="[
        'fixed top-0 right-0 h-full w-80 bg-[#121A1D] z-50 transform transition-transform duration-300 lg:hidden',
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full p-6">
        <!-- Close Button -->
        <div class="flex justify-end mb-8">
          <button @click="closeDropdowns" class="text-white text-2xl">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Mobile Navigation Links -->
        <div class="flex flex-col gap-6 mb-8">
          <router-link
            v-for="link in navLinks"
            :key="link.name"
            :to="link.to"
            @click="closeDropdowns"
            class="flex items-center space-x-3 text-white text-xl hover:text-primary transition-colors"
            :class="{ 'text-primary': route.path === link.to }"
          >
            <component :is="link.icon" class="w-5 h-5" />
            <span>{{ link.name }}</span>
          </router-link>
        </div>

        <!-- Mobile User Actions -->
        <div class="flex flex-col gap-4 mb-8">
          <!-- Notifications -->
          <button class="flex items-center space-x-3 text-white text-xl hover:text-primary transition-colors">
            <Bell class="w-5 h-5" />
            <span>Notifications</span>
            <span class="ml-auto w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>

        <!-- Mobile Profile Actions -->
        <div class="mt-auto flex flex-col gap-4">
          <button
            @click="router.push('/settings'); closeDropdowns()"
            class="flex items-center space-x-3 text-white text-xl hover:text-primary transition-colors"
          >
            <User class="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            @click="handleLogout"
            class="flex items-center space-x-3 text-white text-xl hover:text-primary transition-colors"
          >
            <LogOut class="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>