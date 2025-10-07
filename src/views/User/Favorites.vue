# /favorites

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShoppingCart, Heart, Star, Search, Filter, Trash2 } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import { usePizzaStore } from '@/stores/pizza'
import type { Pizza } from '@/models/pizza'
import { toBase64 } from '@/plugins/convert'
import { useFavoriteStore } from '@/stores/favorite'
import { useCartStore } from '@/stores/cart'

const favorite = useFavoriteStore()
const pizza = usePizzaStore()
const cart = useCartStore()

// Search and filter states
const searchQuery = ref('')
const sortBy = ref('name')
const showFilters = ref(false)

// Computed properties
const favoritePizzas = computed(() => {
  return pizza.pizzas.filter((pizza: Pizza) => 
    favorite.favorites.includes(pizza.pizzaId!)
  )
})

const filteredFavorites = computed(() => {
  let items = favoritePizzas.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter((item: Pizza) => {
      const name = (item.pizzaName || '').toString().toLowerCase()
      const description = (item.pizzaDescription || '').toString().toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // Sort items
  switch (sortBy.value) {
    case 'price-low':
      items.sort((a: Pizza, b: Pizza) => (a.pizzaPrice || 0) - (b.pizzaPrice || 0))
      break
    case 'price-high':
      items.sort((a: Pizza, b: Pizza) => (b.pizzaPrice || 0) - (a.pizzaPrice || 0))
      break
    case 'name':
    default:
      items.sort((a: Pizza, b: Pizza) =>
        (a.pizzaName || '').toString().localeCompare((b.pizzaName || '').toString()),
      )
      break
  }

  return items
})

const hasFavorites = computed(() => favoritePizzas.value.length > 0)

// Methods
const addToCart = (item: Pizza) => {
  cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
}

const removeFromFavorites = async (pizzaId: number) => {
  await favorite.removeFavorite(pizzaId)
}

// Load data on mount
onMounted(async () => {
  await pizza.fetchAll()
  await favorite.fetchFavorites()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Favorites Hero Section -->
      <div class="bg-gray-800 rounded-lg p-8 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-90"></div>
        <div class="relative z-10">
          <h1 class="text-4xl font-bold text-white mb-4">My Favorites</h1>
          <p class="text-gray-300 text-lg mb-6">
            Your favorite pizzas and menu items, all in one place
          </p>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1 relative">
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search your favorites..."
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

      <!-- Favorites Grid -->
      <div v-if="hasFavorites && filteredFavorites.length > 0">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            Your Favorites
            <span class="text-gray-500 text-lg font-normal"
              >({{ filteredFavorites.length }} items)</span
            >
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="item in filteredFavorites"
            :key="item.pizzaId!"
            class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
          >
            <div class="relative mb-4">
              <img
                :src="toBase64(item.pizzaImage as string)"
                :alt="item.pizzaName"
                class="w-full h-48 object-cover rounded-lg"
              />
              <button
                @click="removeFromFavorites(item.pizzaId!)"
                class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
              >
                <Heart
                  class="w-5 h-5 fill-red-500 text-red-500"
                />
              </button>
              <div
                v-if="!item.isAvailable"
                class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center"
              >
                <span class="text-white font-semibold">Currently Unavailable</span>
              </div>
            </div>

            <div class="mb-3">
              <h3 class="font-semibold text-gray-900 mb-1">{{ item.pizzaName }}</h3>
              <p class="text-gray-600 text-sm mb-2">{{ item.pizzaDescription }}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  15 min
                </span>
                <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {{ item.pizzaCategory }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between mb-3">
              <span class="text-lg font-bold text-gray-900">₱{{ item.pizzaPrice }}</span>
              <div class="flex items-center">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="text-sm text-gray-600 ml-1">
                  <!-- Rating placeholder -->
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="addToCart(item)"
                :disabled="!item.isAvailable"
                :class="
                  item.isAvailable
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                "
                class="flex-1 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                <ShoppingCart class="w-4 h-4 mr-2" />
                {{ item.isAvailable ? 'Add to Cart' : 'Unavailable' }}
              </button>
              <button
                @click="removeFromFavorites(item.pizzaId!)"
                class="p-2 border border-red-300 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove from favorites"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State - No Favorites -->
      <div v-else-if="!hasFavorites" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div
            class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Heart class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
          <p class="text-gray-600 mb-6">
            Start adding items to your favorites by clicking the heart icon on any menu item.
          </p>
          <router-link
            to="/menu"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Browse Menu
          </router-link>
        </div>
      </div>

      <!-- Empty State - No Search Results -->
      <div v-else-if="hasFavorites && filteredFavorites.length === 0" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div
            class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Search class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Favorites Found</h3>
          <p class="text-gray-600 mb-6">
            We couldn't find any favorites matching your search criteria. Try adjusting your search terms.
          </p>
          <button
            @click="searchQuery = ''"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear Search
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
              <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto" />
              <span class="text-xl font-bold">Cebu Crust</span>
            </div>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore.
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
              <router-link to="/aboutus" class="block text-gray-400 hover:text-white"
                >About Us</router-link
              >
              <router-link to="/contact" class="block text-gray-400 hover:text-white"
                >Contact Us</router-link
              >
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

        <div
          class="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
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
