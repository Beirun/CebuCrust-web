# /menu

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { useAuthStore } from '@/stores/auth'
import { ShoppingCart, Bell, User, Heart, Star, MapPin, Clock, ChevronDown, Search, Filter } from 'lucide-vue-next'

// const auth = useAuthStore()

// User data
const user = ref({
  name: 'Maria Santos',
  address: '123 Lahug Street, Barangay Lahug, Cebu City, 6000',
  deliveryTime: '25-30 mins'
})

// Menu categories
const categories = ref([
  { id: 'all', name: 'All Items', active: true },
  { id: 'pizza', name: 'Pizza', active: false },
  { id: 'appetizers', name: 'Appetizers', active: false },
  { id: 'drinks', name: 'Drinks', active: false },
  { id: 'desserts', name: 'Desserts', active: false }
])

// Admin-controlled menu data (this would come from an API in a real app)
const adminMenuItems = ref([

])

// Search and filter states
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('name')
const showFilters = ref(false)

// Computed properties
const filteredMenuItems = computed(() => {
  let items = adminMenuItems.value.filter(item => item.isAvailable)

  // Filter by category
  if (selectedCategory.value !== 'all') {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.ingredients.some(ingredient => ingredient.toLowerCase().includes(query))
    )
  }

  // Sort items
  switch (sortBy.value) {
    case 'price-low':
      items.sort((a, b) => a.price - b.price)
      break
    case 'price-high':
      items.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      items.sort((a, b) => b.rating - a.rating)
      break
    case 'name':
    default:
      items.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  return items
})

const hasMenuItems = computed(() => adminMenuItems.value.length > 0)

// Methods
const selectCategory = (categoryId: string) => {
  categories.value.forEach(cat => cat.active = false)
  const selectedCat = categories.value.find(cat => cat.id === categoryId)
  if (selectedCat) {
    selectedCat.active = true
    selectedCategory.value = categoryId
  }
}

const toggleFavorite = (item: { isFavorite: boolean }) => {
  item.isFavorite = !item.isFavorite
}

const addToCart = (item: { name: string; price: number }) => {
  console.log('Added to cart:', item)
}

const changeAddress = () => {
  console.log('Change address clicked')
}

// Load menu data on mount
onMounted(() => {
  // In a real app, this would fetch menu items from an API
  // For now, we're using static data that would be controlled by admin
})
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
            <router-link to="/dashboard" class="text-white hover:text-orange-500">Dashboard</router-link>
            <router-link to="/menu" class="text-orange-500 font-medium">Menu</router-link>
            <router-link to="/orders" class="text-white hover:text-orange-500">Orders</router-link>
            <router-link to="/favorites" class="text-white hover:text-orange-500">Favorites</router-link>
          </nav>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            <button class="p-2 text-white hover:text-orange-500">
              <ShoppingCart class="w-6 h-6" />
            </button>
            <button class="p-2 text-white hover:text-orange-500 relative">
              <Bell class="w-6 h-6" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div class="flex items-center space-x-2">
              <User class="w-6 h-6 text-white" />
              <span class="text-white font-medium">{{ user.name }}</span>
              <ChevronDown class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Menu Hero Section -->
      <div class="bg-gray-800 rounded-lg p-8 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-90"></div>
        <div class="relative z-10">
          <h1 class="text-4xl font-bold text-white mb-4">Our Menu</h1>
          <p class="text-gray-300 text-lg mb-6">Discover our delicious selection of pizzas, appetizers, drinks, and desserts</p>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1 relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search menu items..."
                class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div class="flex gap-2">
              <select
                v-model="sortBy"
                class="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <button
                @click="showFilters = !showFilters"
                class="px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
              >
                <Filter class="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Address -->
      <div class="bg-white rounded-lg p-4 mb-8 border border-orange-400">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <MapPin class="w-5 h-5 text-gray-600 mr-2" />
            <span class="text-gray-600 font-medium">Delivering to:</span>
            <span class="text-gray-800 ml-2">{{ user.address }}</span>
          </div>
          <div class="flex items-center gap-4">
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

      <!-- Category Tabs -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.id)"
          :class="category.active
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'"
          class="px-6 py-3 rounded-lg font-medium transition-colors border border-gray-200"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Menu Items Grid -->
      <div v-if="hasMenuItems && filteredMenuItems.length > 0">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ selectedCategory === 'all' ? 'All Items' : categories.find(c => c.id === selectedCategory)?.name }}
            <span class="text-gray-500 text-lg font-normal">({{ filteredMenuItems.length }} items)</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="item in filteredMenuItems" :key="item.id" class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div class="relative mb-4">
              <img :src="item.image" :alt="item.name" class="w-full h-48 object-cover rounded-lg">
              <button @click="toggleFavorite(item)" class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg">
                <Heart :class="item.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'" class="w-5 h-5" />
              </button>
              <div v-if="!item.isAvailable" class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold">Currently Unavailable</span>
              </div>
            </div>

            <div class="mb-3">
              <h3 class="font-semibold text-gray-900 mb-1">{{ item.name }}</h3>
              <p class="text-gray-600 text-sm mb-2">{{ item.description }}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span v-if="item.isVegetarian" class="bg-green-100 text-green-800 px-2 py-1 rounded">Vegetarian</span>
                <span v-if="item.isSpicy" class="bg-red-100 text-red-800 px-2 py-1 rounded">Spicy</span>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">{{ item.preparationTime }} min</span>
              </div>
            </div>

            <div class="flex items-center justify-between mb-3">
              <span class="text-lg font-bold text-gray-900">₱{{ item.price }}</span>
              <div class="flex items-center">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="text-sm text-gray-600 ml-1">{{ item.rating }} ({{ item.reviewCount }})</span>
              </div>
            </div>

            <button
              @click="addToCart(item)"
              :disabled="!item.isAvailable"
              :class="item.isAvailable
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
              class="w-full py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              <ShoppingCart class="w-4 h-4 mr-2" />
              {{ item.isAvailable ? 'Add to Cart' : 'Unavailable' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State - No Menu Items -->
      <div v-else-if="!hasMenuItems" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Menu Items Available</h3>
          <p class="text-gray-600 mb-6">
            Our admin hasn't added any menu items yet. Please check back later or contact us for more information.
          </p>
          <router-link to="/contact" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">
            Contact Us
          </router-link>
        </div>
      </div>

      <!-- Empty State - No Search Results -->
      <div v-else-if="hasMenuItems && filteredMenuItems.length === 0" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Items Found</h3>
          <p class="text-gray-600 mb-6">
            We couldn't find any menu items matching your search criteria. Try adjusting your filters or search terms.
          </p>
          <button
            @click="searchQuery = ''; selectedCategory = 'all'"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
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
