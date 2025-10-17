# /favorites

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart, Heart, Star, Search } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import type { Pizza } from '@/models/pizza'
import { toBase64 } from '@/plugins/convert'
import { useFavoriteStore } from '@/stores/favorite'
import { useCartStore } from '@/stores/cart'

const favorite = useFavoriteStore()
const pizza = usePizzaStore()
const cart = useCartStore()
const router = useRouter()

// Search and filter states
const searchQuery = ref('')
const sortBy = ref('')
const selectedCategory = ref('all')

// Computed properties
const favoritePizzas = computed(() => {
  return pizza.pizzas.filter((pizza: Pizza) => favorite.favorites.includes(pizza.pizzaId!))
})

const filteredFavorites = computed(() => {
  let items = favoritePizzas.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    items = items.filter((item: Pizza) => {
      const cat = (item.pizzaCategory || '').toString().toLowerCase()
      return cat === selectedCategory.value.toLowerCase()
    })
  }

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
  if (sortBy.value) {
    switch (sortBy.value) {
      case 'name':
        items.sort((a: Pizza, b: Pizza) => (a.pizzaName || '').localeCompare(b.pizzaName || ''))
        break
      case 'price-low':
        items.sort((a: Pizza, b: Pizza) => (a.pizzaPrice || 0) - (b.pizzaPrice || 0))
        break
      case 'price-high':
        items.sort((a: Pizza, b: Pizza) => (b.pizzaPrice || 0) - (a.pizzaPrice || 0))
        break
      case 'rating':
        items.sort((a: Pizza, b: Pizza) => (b.averageRating || 0) - (a.averageRating || 0))
        break
    }
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

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  sortBy.value = ''
}

// Load data on mount
onMounted(async () => {
  await pizza.fetchAll()
  await favorite.fetchFavorites()
})

const inCart = (id: number) => {
  return cart.cart.some((c) => c.pizzaId === id)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <!-- Main Content -->
    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8 min-h-[calc(100vh-5rem)]">
<<<<<<< HEAD
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p class="text-gray-600">Your favorite pizzas and menu items, all in one place</p>
      </div>
=======
      <!-- Favorites Hero Section -->
      <div class="bg-gray-800 rounded-lg p-8 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-90"></div>
        <div class="relative z-10">
          <h1 class="text-4xl font-bold text-white mb-4">My Favorites</h1>
          <p class="text-gray-300 text-lg mb-6">
            Your favorite pizzas and menu items, all in one place
          </p>
>>>>>>> origin/main

      <!-- Search, Filter and Sort Bar -->
      <div class="flex flex-col lg:flex-row gap-4 mb-8">
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
            v-model="selectedCategory"
            class="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="veggie">Veggie</option>
            <option value="meat-lovers">Meat Lovers</option>
            <option value="premium-specials">Premium Specials</option>
            <option value="seasonal-picks">Seasonal Picks</option>
          </select>
          <select
            v-model="sortBy"
            class="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="" disabled>Sort by</option>
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
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
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="router.push(`/product/${item.pizzaId}`)"
          >
            <!-- Pizza Image -->
            <div class="relative h-48 bg-gray-700 flex items-center justify-center">
              <img
                v-if="item.pizzaImage"
                :src="toBase64(item.pizzaImage as string)"
                :alt="item.pizzaName"
                class="w-full h-full object-cover"
                @error="
                  (e: Event) => {
                    const img = e.target as HTMLImageElement
                    img.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='
                  }
                "
              />
              <div v-else class="text-6xl">🍕</div>

              <!-- Heart Icon -->
              <button
                class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                @click.stop="removeFromFavorites(item.pizzaId!)"
              >
                <Heart class="w-5 h-5 fill-red-500 text-red-500" />
              </button>

              <!-- Unavailable Overlay -->
              <div
                v-if="!item.isAvailable"
                class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <span class="text-white font-semibold">Currently Unavailable</span>
              </div>
            </div>

<<<<<<< HEAD
            <!-- Pizza Details -->
            <div class="p-4">
              <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>

              <!-- Price and Rating -->
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-1">
                  <Star class="h-4 w-4 text-yellow-400 fill-current" />
                  <span class="text-white text-sm">
                    {{
                      item.averageRating && item.averageRating > 0
                        ? `${item.averageRating} (${item.totalRatings})`
                        : '0 (0)'
                    }}
                  </span>
                </div>
                <span class="text-xl font-bold text-primary">₱{{ item.pizzaPrice }}</span>
=======
            <div class="mb-3">
              <h3 class="font-semibold text-gray-900 mb-1">{{ item.pizzaName }}</h3>
              <p class="text-gray-600 text-sm mb-2">{{ item.pizzaDescription }}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded"> 15 min </span>
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
                  {{
                    item.averageRating && item.averageRating > 0
                      ? `${item.averageRating} (${item.totalRatings})`
                      : '0 (0)'
                  }}
                </span>
>>>>>>> origin/main
              </div>

              <!-- Action Buttons -->
              <button
<<<<<<< HEAD
                :disabled="!item.isAvailable || inCart(item.pizzaId!)"
                @click.stop="addToCart(item)"
                class="w-full text-white py-2 rounded-lg font-medium flex items-center justify-center"
=======
                @click="addToCart(item)"
                :disabled="!item.isAvailable || inCart(item.pizzaId!)"
>>>>>>> origin/main
                :class="
                  item.isAvailable && !inCart(item.pizzaId!)
                    ? 'bg-primary hover:bg-primary/80'
                    : 'bg-gray-300 text-gray-500 cursor-default'
                "
              >
                <ShoppingCart class="w-4 h-4 mr-2" />
                {{
                  !item.isAvailable
                    ? 'Unavailable'
                    : inCart(item.pizzaId!)
                      ? 'In Cart'
                      : 'Add to Cart'
                }}
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
            We couldn't find any favorites matching your search criteria. Try adjusting your search
            terms.
          </p>
          <button
            @click="clearAllFilters"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>
