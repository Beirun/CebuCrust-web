# /dashboard

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, Bell, User, Heart, Star, MapPin, Clock, ChevronDown } from 'lucide-vue-next'

const auth = useAuthStore()
const cart = useCartStore()

// User data
const user = ref({
  name: 'Maria Santos',
  address: '123 Lahug Street, Barangay Lahug, Cebu City, 6000',
  deliveryTime: '25-30 mins'
})

// Current order status
const currentOrder = ref({
  id: 'PZ-2024-0892',
  items: 2,
  total: 850.00,
  status: 'preparing',
  estimatedDelivery: '20-25 minutes'
})

// Order status steps
const orderSteps = ref([
  { id: 'received', label: 'Received', completed: true, active: false },
  { id: 'preparing', label: 'Preparing', completed: false, active: true },
  { id: 'ready', label: 'Ready', completed: false, active: false },
  { id: 'out-for-delivery', label: 'Out for Delivery', completed: false, active: false },
  { id: 'delivered', label: 'Delivered', completed: false, active: false }
])

// Static menu data
const favorites = ref([
  
])

const todaysSpecials = ref([
 
])

// Computed properties
const currentTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

// Methods
const toggleFavorite = (item: any) => {
  item.isFavorite = !item.isFavorite
}

const addToCart = (item: any) => {
  cart.addItem(item)
}

const trackOrder = () => {
  console.log('Tracking order:', currentOrder.value.id)
}

const changeAddress = () => {
  console.log('Change address clicked')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
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
              <span class="text-white font-medium">{{ user.name }}</span>
              <ChevronDown class="w-4 h-4 text-white" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Banner -->
      <div class="bg-gray-800 rounded-lg p-8 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-90"></div>
        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div class="mb-6 lg:mb-0">
            <h1 class="text-3xl font-bold text-white mb-2">{{ currentTime }}, {{ user.name.split(' ')[0] }}!</h1>
            <p class="text-gray-300 text-lg mb-4">Ready for another delicious pizza experience?</p>
            <button class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Order Your Favorite Pizza
            </button>
          </div>
          <div class="bg-white rounded-lg p-6 w-full lg:w-80">
            <div class="flex items-center mb-2">
              <MapPin class="w-5 h-5 text-gray-600 mr-2" />
              <span class="text-gray-600 font-medium">Delivering to:</span>
            </div>
            <p class="text-gray-800 mb-3">{{ user.address }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Clock class="w-4 h-4 text-gray-600 mr-1" />
                <span class="text-sm text-gray-600">Est. delivery: {{ user.deliveryTime }}</span>
              </div>
              <button @click="changeAddress" class="text-orange-500 hover:text-orange-600 text-sm font-medium">
                Change address
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Status -->
      <div class="bg-white rounded-lg shadow-sm border border-orange-400 p-6 mb-8">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Order #{{ currentOrder.id }}</h3>
            <p class="text-gray-600">{{ currentOrder.items }} items • ₱{{ currentOrder.total.toFixed(2) }}</p>
          </div>
          <button @click="trackOrder" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium mt-4 lg:mt-0">
            Track Order
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="flex items-center justify-between mb-4">
          <div v-for="(step, index) in orderSteps" :key="step.id" class="flex items-center">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                   :class="step.completed ? 'bg-green-500 text-white' : step.active ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'">
                <span v-if="step.completed">✓</span>
                <span v-else-if="step.id === 'delivered'">🏠</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="text-xs text-gray-600 mt-1 text-center">{{ step.label }}</span>
            </div>
            <div v-if="index < orderSteps.length - 1" class="flex-1 h-0.5 mx-2"
                 :class="step.completed ? 'bg-green-500' : 'bg-gray-300'"></div>
          </div>
        </div>

        <p class="text-gray-600">Estimated delivery: {{ currentOrder.estimatedDelivery }}</p>
      </div>

      <!-- Order Your Favorites -->
      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Order Your Favorites</h2>
          <router-link to="/favorites" class="text-orange-500 hover:text-orange-600 font-medium">
            View All Favorites
          </router-link>
        </div>
        <!-- Empty state for favorites -->
        <div v-if="favorites.length === 0" class="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Heart class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">You have no favorites yet</h3>
          <p class="text-gray-600 mb-6">Start exploring our menu and add your favorite pizzas to see them here!</p>
          <router-link to="/menu" class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Browse Menu
          </router-link>
        </div>
        
        <!-- Favorites grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="item in favorites" :key="item.id" class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div class="relative mb-4">
              <img :src="item.image" :alt="item.name" class="w-full h-48 object-cover rounded-lg">
              <button @click="toggleFavorite(item)" class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg">
                <Heart :class="item.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'" class="w-5 h-5" />
              </button>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">{{ item.name }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ item.description }}</p>
            <div class="flex items-center justify-between mb-3">
              <span class="text-lg font-bold text-gray-900">₱{{ item.price }}</span>
              <div class="flex items-center">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="text-sm text-gray-600 ml-1">{{ item.rating }} ({{ item.reviewCount }})</span>
              </div>
            </div>
            <button @click="addToCart(item)" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium flex items-center justify-center">
              <ShoppingCart class="w-4 h-4 mr-2" />
              Order Now
            </button>
          </div>
        </div>
      </section>

      <!-- Today's Specials -->
      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Today's Specials</h2>
          <router-link to="/menu" class="text-orange-500 hover:text-orange-600 font-medium">
            View All Menu
          </router-link>
        </div>
        <!-- Empty state for today's specials -->
        <div v-if="todaysSpecials.length === 0" class="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Star class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No specials today</h3>
          <p class="text-gray-600 mb-6">Our admin hasn't added any special offers for today. Check back later or explore our regular menu!</p>
          <router-link to="/menu" class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            View Full Menu
          </router-link>
        </div>
        
        <!-- Today's specials grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="item in todaysSpecials" :key="item.id" class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div class="relative mb-4">
              <img :src="item.image" :alt="item.name" class="w-full h-48 object-cover rounded-lg">
              <button @click="toggleFavorite(item)" class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg">
                <Heart :class="item.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'" class="w-5 h-5" />
              </button>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">{{ item.name }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ item.description }}</p>
            <div class="flex items-center justify-between mb-3">
              <span class="text-lg font-bold text-gray-900">₱{{ item.price }}</span>
              <div class="flex items-center">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="text-sm text-gray-600 ml-1">{{ item.rating }} ({{ item.reviewCount }})</span>
              </div>
            </div>
            <button @click="addToCart(item)" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium flex items-center justify-center">
              <ShoppingCart class="w-4 h-4 mr-2" />
              Order Now
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="col-span-1 md:col-span-1">
            <div class="flex items-center space-x-2 mb-4">
              <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto">
              <span class="text-xl font-bold">Cebu Crust</span>
            </div>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>

          <!-- Opening Hours -->
          <div>
            <h3 class="font-semibold mb-4">Opening Time</h3>
            <div class="space-y-2 text-sm text-gray-400">
              <p>Mon - Wed: 10:00 AM - 10:00 PM</p>
              <p>Thu - Sat: 10:00 AM - 11:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          <!-- User Links -->
          <div>
            <h3 class="font-semibold mb-4">User Link</h3>
            <div class="space-y-2 text-sm">
              <router-link to="/aboutus" class="block text-gray-400 hover:text-white">About Us</router-link>
              <router-link to="/contact" class="block text-gray-400 hover:text-white">Contact Us</router-link>
              <a href="#" class="block text-gray-400 hover:text-white">Order Delivery</a>
            </div>
          </div>

          <!-- Contact Info -->
          <div>
            <h3 class="font-semibold mb-4">Contact Us</h3>
            <div class="space-y-2 text-sm text-gray-400">
              <p>543 Country Club Ave, NC 27587, London, UK</p>
              <p>+1257 654020</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">©2024 ARR. All right reserved</p>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <a href="#" class="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" class="text-gray-400 hover:text-white text-sm">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
