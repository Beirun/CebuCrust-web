<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { Bell, User, LogOut } from 'lucide-vue-next'

const auth = useAuthStore()

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
  { name: 'Menu', path: '/admin/menu', icon: 'menu' },
  { name: 'Orders', path: '/admin/orders', icon: 'orders' }
]
</script>

<template>
  <nav class="bg-gray-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <img src="@/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto" />
            <span class="ml-2 text-xl font-bold">Cebu Crust</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-8">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.path"
            class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-white bg-gray-700': $route.path === item.path }"
          >
            {{ item.name }}
          </router-link>
        </div>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <button class="relative p-2 text-gray-300 hover:text-white">
            <Bell class="h-5 w-5" />
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          <!-- User Dropdown -->
          <div class="relative">
            <button class="flex items-center space-x-2 text-gray-300 hover:text-white">
              <User class="h-5 w-5" />
              <span>{{ auth.userInfo?.userName || 'Maria Santos' }}</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>

          <!-- Logout -->
          <button
            @click="auth.logout"
            class="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <LogOut class="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

