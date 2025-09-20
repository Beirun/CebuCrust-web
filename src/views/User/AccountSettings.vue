<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, Bell, User, ChevronDown } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const cart = useCartStore()

const user = ref({ ...auth.user })

const displayName = computed(() => user.value?.name || user.value?.userName || user.value?.username || '')

const preview = ref<string | null>(user.value?.profileImage || null)

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result as string
    user.value.profileImage = preview.value
  }
  reader.readAsDataURL(file)
}

const save = () => {
  // Update auth store and localStorage; replace with API call when available
  auth.user = { ...auth.user, ...user.value }
  localStorage.setItem('user', JSON.stringify(auth.user))
  alert('Profile updated')
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header/Navbar (copied from Dashboard.vue) -->
    <header class="bg-gray-900 shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex items-center space-x-2">
              <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto">
            </div>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link to="/dashboard" class="text-orange-500 font-medium">Dashboard</router-link>
            <router-link to="/menu" class="text-white hover:text-orange-500">Menu</router-link>
            <router-link to="/orders" class="text-white hover:text-orange-500">Orders</router-link>
            <router-link to="/favorites" class="text-white hover:text-orange-500">Favorites</router-link>
          </nav>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            <router-link to="/cart" class="relative p-2 text-white hover:text-orange-500">
              <ShoppingCart class="w-6 h-6" />
              <span v-if="cart.itemCount > 0" class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{{ cart.itemCount }}</span>
            </router-link>
            <button class="p-2 text-white hover:text-orange-500 relative">
              <Bell class="w-6 h-6" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <router-link to="/settings" class="flex items-center space-x-2 text-white hover:text-orange-300">
              <User class="w-6 h-6 text-white" />
              <span class="text-white font-medium">{{ displayName }}</span>
              <ChevronDown class="w-4 h-4 text-white" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-28 h-28 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
            <img v-if="preview" :src="preview" alt="profile" class="w-full h-full object-cover" />
            <div v-else class="text-gray-300">No Image</div>
          </div>
          <div>
            <h2 class="text-2xl font-semibold">Account Settings</h2>
            <p class="text-gray-600">Manage your profile information</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700">First / Full name</label>
            <input v-model="user.name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input v-model="user.email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input v-model="user.phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Address</label>
            <input v-model="user.address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Profile Picture</label>
            <div class="mt-2 flex items-center gap-4">
              <input type="file" accept="image/*" @change="onFileChange" />
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button @click="save" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">Save Changes</button>
        </div>
      </div>
    </main>
  </div>
</template>
