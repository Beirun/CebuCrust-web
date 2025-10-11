# /menu

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShoppingCart, Heart, Star, Search, Filter } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import type { Pizza } from '@/models/pizza'
import { toBase64 } from '@/plugins/convert'
import { useFavoriteStore } from '@/stores/favorite'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'

const favorite = useFavoriteStore()
const pizza = usePizzaStore()
const cart = useCartStore()
const router = useRouter()

const isFavorite = ref<number[]>([])
// Local UI state
const categories = ref([
  { id: 'all', name: 'All Pizzas', active: true },
  { id: 'veggie', name: 'Veggie', active: false },
  { id: 'meat-lovers', name: 'Meat Lovers', active: false },
  { id: 'premium-specials', name: 'Premium Specials', active: false },
  { id: 'seasonal-picks', name: 'Seasonal Picks', active: false }
])

// Admin-controlled menu data comes from the store
const adminMenuItems = computed(() => pizza.pizzas)

// Search and filter states
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('name')
const showFilters = ref(false)

// Computed properties
const filteredMenuItems = computed(() => {
  // menuStore.menuItems may be an array of items with different property shapes.
  let items = adminMenuItems.value || []

  // Filter by category
  if (selectedCategory.value !== 'all') {
    items = items.filter((item: Pizza) => {
      // normalize category comparison
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
      // items.sort((a: Pizza, b: Pizza) => (b.rating || 0) - (a.rating || 0))
      break
  }

  return items
})

const hasMenuItems = computed(() => adminMenuItems.value && adminMenuItems.value.length > 0)
const hasMoreItems = computed(() => filteredMenuItems.value.length > 8)

// Methods
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
  categories.value.forEach((cat) => {
    cat.active = cat.id === categoryId
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  categories.value.forEach((cat) => {
    cat.active = cat.id === 'all'
  })
}

const loadMore = () => {
  // Implement load more logic here
  console.log('Load more clicked')
}

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const toggle = (pizzaId: number, delay = 500) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(async () => {
    if (favorite.favorites.includes(pizzaId)) {
      await favorite.removeFavorite(pizzaId)
    } else {
      await favorite.addFavorite(pizzaId)
    }
  }, delay)
}

const addToCart = async (item: Pizza) => {
  const confirmed = window.confirm(`Add ${item.pizzaName} to your cart?`)
  if (confirmed) {
    await cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
  }
}

const orderNow = (item: Pizza) => {
  const confirmed = window.confirm(`Would you like to proceed with ordering ${item.pizzaName}?`)
  if (confirmed) {
    router.push('/orders')
  }
const toggleFavorite = (pizzaId: number) => {
  toggle(pizzaId)
}

const addToCart = (item: Pizza) => {
  cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
}

// Load menu data on mount
onMounted(async () => {
  // Fetch menu items from the store (store may call API)
  await pizza.fetchAll()
  await favorite.fetchFavorites()
  isFavorite.value = favorite.favorites
})

const inCart = (id: number) => {
  return cart.cart.some((c) => c.pizzaId === id)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <!-- Hero Banner Section -->
    <section class="bg-[#121A1D] py-8 relative overflow-hidden w-screen mx-auto">
      <div class="absolute inset-0 bg-[url('/src/assets/menu-bg.png')] bg-cover bg-center"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-[#121A1D] to-[#192124] opacity-70"></div>
      <div class="relative z-10 flex flex-col items-center justify-center h-64 text-center text-white px-4">
        <h1 class="text-5xl font-bold mb-4">Explore Our Menu</h1>
        <p class="text-xl mb-8 max-w-2xl">Freshly baked, always delicious — from crust to crave.</p>
        <button class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Start Your Order
        </button>
      </div>
    </section>

    <!-- Category Tabs and Search Bar - Attached to Banner -->
    <div class="bg-white py-4">
       <div class="w-screen px-4 sm:px-8 lg:px-30 flex flex-col lg:flex-row gap-8 lg:gap-40 items-center">
        <!-- Category Tabs -->
        <div class="flex flex-wrap gap-2 justify-center lg:justify-start">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="
              category.active
                ? 'bg-primary text-white rounded-full'
                : 'bg-white text-gray-700 hover:bg-gray-100 rounded-full'
            "
            class="px-6 py-3 font-medium transition-colors"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="w-full lg:flex-1 lg:ml-auto">
          <div class="relative max-w-xl lg:max-w-lg mx-auto lg:mx-0">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search orders..."
              class="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8">

      <!-- Menu Items Grid -->
      <div v-if="hasMenuItems && filteredMenuItems.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <div
            v-for="item in filteredMenuItems.slice(0, 8)"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
                @click="toggleFavorite(item.pizzaId!)"
              >
                <Heart
                  :class="
                    isFavorite.includes(item.pizzaId!)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400'
                  "
                  class="w-5 h-5"
                />
              </button>
            </div>

            <!-- Pizza Details -->
            <div class="p-4">
              <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>

              <!-- Price and Rating -->
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-1">
                  <Star class="h-4 w-4 text-yellow-400 fill-current" />
                  <span class="text-white text-sm">
                    {{ item.averageRating && item.averageRating > 0 ? `${item.averageRating} (${item.totalRatings})` : '0 (0)' }}
                  </span>
                </div>
                <span class="text-xl font-bold text-primary">₱{{ item.pizzaPrice }}</span>
              </div>

              <!-- Action Buttons -->
              <button
                @click="addToCart(item)"
                class="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-lg font-medium flex items-center justify-center"
              >
                <ShoppingCart class="w-4 h-4 mr-2" />
                Add to Cart
              </button>
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
                @click="orderNow(item)"
                :disabled="!item.isAvailable"
                :class="
                  item.isAvailable
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                "
                class="flex-1 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMoreItems" class="text-center">
          <button
            @click="loadMore"
            class="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Load More Delicious Pizzas
          </button>
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
          <router-link
            to="/contact"
            class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium"
          >
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
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p class="text-gray-600 mb-6">
            We couldn't find any menu items matching your search criteria. Try adjusting your filters or search terms.
          </p>
          <button
            @click="clearFilters"
            class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
