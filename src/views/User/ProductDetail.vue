# /product/:id

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart, Heart, Star, Truck } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePizzaStore } from '@/stores/pizza'
import { useCartStore } from '@/stores/cart'
import { useFavoriteStore } from '@/stores/favorite'
import { useRatingStore } from '@/stores/rating'
import { useOrderStore } from '@/stores/orders'
import { toBase64 } from '@/plugins/convert'
import type { Pizza } from '@/models/pizza'

const route = useRoute()
const router = useRouter()
const pizza = usePizzaStore()
const cart = useCartStore()
const favorite = useFavoriteStore()
const rating = useRatingStore()
const order = useOrderStore()

const pizzaId = computed(() => parseInt(route.params.id as string))
const currentPizza = ref<Pizza | null>(null)
const quantity = ref(1)
const isFavorite = ref<number[]>([])
const selectedReviewFilter = ref('all')
const productInfoRef = ref<HTMLElement | null>(null)
const confirmationOpen = ref(false)

// Mock review data - in real app, this would come from API
const reviews = ref([
  {
    id: 1,
    user: 'Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    rating: 5,
    comment: 'Amazing pizza! The crust was perfectly crispy and the toppings were so fresh. Delivery was super fast too. Will definitely order again!',
    date: '2024-01-15',
    size: 'Medium'
  },
  {
    id: 2,
    user: 'John Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    rating: 5,
    comment: 'Best pizza in town! Love the authentic taste and generous toppings. The cheese stretch is incredible.',
    date: '2024-01-14',
    size: 'Large'
  },
  {
    id: 3,
    user: 'Ana Dela Cruz',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
    rating: 4,
    comment: 'Really good pizza, but delivery took a bit longer than expected. Still worth it though!',
    date: '2024-01-13',
    size: 'Medium'
  }
])

const ratingStats = ref({
  average: 4.8,
  totalReviews: 2347,
  distribution: {
    5: 1831,
    4: 352,
    3: 94,
    2: 47,
    1: 23
  }
})

const relatedPizzas = computed(() => {
  if (!currentPizza.value) return []
  return pizza.pizzas
    .filter(p => p.pizzaId !== currentPizza.value?.pizzaId && p.pizzaCategory === currentPizza.value?.pizzaCategory)
    .slice(0, 4)
})

// Real data from database
const favoriteCount = computed(() => {
  return favorite.favorites.length || 0
})

const totalReviews = computed(() => {
  return rating.getTotalRatings(pizzaId.value) || 0
})

const averageRating = computed(() => {
  return rating.getAverageRating(pizzaId.value) || 0
})

const soldCount = computed(() => {
  // This would need to come from order data - for now using a placeholder
  return currentPizza.value?.totalRatings || 0
})

// Get the actual height of the product information section
const productInfoHeight = computed(() => {
  if (!productInfoRef.value) return '400px'
  
  const actualHeight = productInfoRef.value.offsetHeight
  
  // Debug logging
  console.log('=== ACTUAL PRODUCT INFO HEIGHT ===')
  console.log('Actual product info height:', actualHeight)
  
  return `${actualHeight}px`
})

const filteredReviews = computed(() => {
  if (selectedReviewFilter.value === 'all') return reviews.value
  const rating = parseInt(selectedReviewFilter.value)
  return reviews.value.filter(review => review.rating === rating)
})

const addToCart = async () => {
  if (!currentPizza.value) return
  
  await cart.addToCart({ pizzaId: currentPizza.value.pizzaId!, quantity: quantity.value })
}

const orderNow = () => {
  if (!currentPizza.value) return
  confirmationOpen.value = true
}

const proceedToCheckout = () => {
  if (!currentPizza.value) return
  
  // Set the pending order with the current pizza and quantity
  order.setPendingOrder([{ pizzaId: currentPizza.value.pizzaId!, quantity: quantity.value }])
  // Navigate to complete order page
  router.push('/order/complete')
  confirmationOpen.value = false
}

const toggleFavorite = (pizzaId: number) => {
  if (favorite.favorites.includes(pizzaId)) {
    isFavorite.value = isFavorite.value.filter((f) => f !== pizzaId)
  } else {
    isFavorite.value = [...isFavorite.value, pizzaId]
  }
  // Call API to update favorites
  if (favorite.favorites.includes(pizzaId)) {
    favorite.removeFavorite(pizzaId)
  } else {
    favorite.addFavorite(pizzaId)
  }
}

const incrementQuantity = () => {
  quantity.value++
}

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

onMounted(async () => {
  await pizza.fetchAll()
  await favorite.fetchFavorites()
  await rating.fetchRatingsByPizzaId(pizzaId.value)
  isFavorite.value = favorite.favorites
  
  currentPizza.value = pizza.pizzas.find(p => p.pizzaId === pizzaId.value) || null
  
  if (!currentPizza.value) {
    router.push('/menu')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8">
      <!-- Product Details Section -->
      <div v-if="currentPizza" class="mb-12">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Product Image -->
          <div class="relative lg:w-1/2">
            <div class="bg-gray-200 rounded-lg overflow-hidden" :style="{ height: productInfoHeight }">
              <img
                v-if="currentPizza.pizzaImage"
                :src="toBase64(currentPizza.pizzaImage as string)"
                :alt="currentPizza.pizzaName"
                class="w-full h-full object-cover"
                @error="
                  (e: Event) => {
                    const img = e.target as HTMLImageElement
                    img.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='
                  }
                "
              />
              <div v-else class="w-full h-full flex items-center justify-center text-6xl">🍕</div>
            </div>
          </div>

          <!-- Product Information -->
          <div ref="productInfoRef" class="lg:w-1/2 space-y-6 flex flex-col justify-start">
            <!-- Row 1: Title and Favorite Count -->
            <div class="flex items-center justify-between">
              <h1 class="text-3xl font-bold text-gray-900">{{ currentPizza.pizzaName }}</h1>
              <button 
                @click="toggleFavorite(currentPizza.pizzaId!)"
                class="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <Heart 
                  :class="isFavorite.includes(currentPizza.pizzaId!) ? 'fill-red-500 text-red-500' : 'text-gray-400'"
                  class="w-5 h-5" 
                />
                <span>{{ favoriteCount }}</span>
              </button>
            </div>

            <!-- Row 2: Rating, Reviews, and Sales -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="flex">
                  <Star 
                    v-for="i in 5" 
                    :key="i" 
                    :class="i <= Math.round(averageRating || currentPizza.averageRating || 0) ? 'w-5 h-5 text-primary fill-current' : 'w-5 h-5 text-gray-300'"
                  />
                </div>
                <span class="font-semibold text-gray-900">{{ averageRating || currentPizza.averageRating || '0.0' }}</span>
              </div>
              <span class="text-gray-400">•</span>
              <span class="text-gray-600">{{ totalReviews }} Reviews</span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-600">{{ soldCount }} Sold</span>
            </div>

            <!-- Row 3: Price and Delivery Time -->
            <div class="flex items-center justify-between">
              <div class="text-4xl font-bold text-primary">₱{{ currentPizza.pizzaPrice }}</div>
              <div class="flex items-center gap-2 text-gray-600">
                <Truck class="w-5 h-5" />
                <span>Delivery in 20-25 mins</span>
              </div>
            </div>

            <!-- Row 4: Product Description -->
            <div class="space-y-2">
              <h3 class="text-lg font-semibold text-gray-900">Product Description</h3>
              <p class="text-gray-700 break-words">{{ currentPizza.pizzaDescription }}</p>
            </div>

            <!-- Row 5: Quantity Selector -->
            <div class="flex items-center gap-4">
              <span class="text-gray-700 font-medium">Quantity:</span>
              <div class="flex items-center border border-gray-300 rounded-lg">
                <button
                  @click="decrementQuantity"
                  class="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <input
                  v-model="quantity"
                  type="number"
                  min="1"
                  class="w-16 text-center border-0 focus:ring-0"
                />
                <button
                  @click="incrementQuantity"
                  class="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Row 6: Action Buttons -->
            <div class="flex gap-3">
              <button
                @click="addToCart"
                class="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart class="w-5 h-5" />
                Add to Cart
              </button>
              <button
                @click="orderNow"
                class="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Separator -->
      <div class="border-t border-dashed border-gray-300 mb-8"></div>

      <!-- Customer Feedback Section -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Customer Feedback</h2>
        
        <!-- Rating Summary -->
        <div class="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
          <div class="text-left flex flex-col justify-center">
            <div class="text-4xl font-bold text-primary mb-2">{{ ratingStats.average }}</div>
            <div class="flex mb-2">
              <Star v-for="i in 5" :key="i" class="w-5 h-5 text-primary fill-current" />
            </div>
            <div class="text-gray-600">{{ ratingStats.totalReviews.toLocaleString() }} Reviews</div>
          </div>
          
          <div class="md:col-span-5 space-y-2">
            <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="flex items-center gap-3">
              <span class="w-8 text-sm text-gray-900">{{ rating }}</span>
              <Star class="w-4 h-4 text-primary fill-current" />
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-primary h-2 rounded-full" 
                  :style="{ width: `${(ratingStats.distribution[rating] / ratingStats.totalReviews) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm text-gray-600 w-12">{{ ratingStats.distribution[rating] }}</span>
            </div>
          </div>
        </div>

        <!-- Review Filters -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            @click="selectedReviewFilter = 'all'"
            :class="selectedReviewFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            All
          </button>
          <button
            v-for="rating in [5, 4, 3, 2, 1]"
            :key="rating"
            @click="selectedReviewFilter = rating.toString()"
            :class="selectedReviewFilter === rating.toString() ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            {{ rating }} Stars ({{ ratingStats.distribution[rating] }})
          </button>
        </div>

        <!-- Individual Reviews -->
        <div class="space-y-6">
          <div
            v-for="review in filteredReviews"
            :key="review.id"
            class="border-b border-gray-200 pb-6 last:border-b-0"
          >
            <div class="flex items-start gap-4">
              <img
                :src="review.avatar"
                :alt="review.user"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-gray-900">{{ review.user }}</span>
                  <div class="flex">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      :class="i <= review.rating ? 'text-primary fill-current' : 'text-gray-300'"
                      class="w-4 h-4"
                    />
                  </div>
                </div>
                <p class="text-gray-700 mb-2">{{ review.comment }}</p>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span>{{ review.date }}</span>
                  <span>Size: {{ review.size }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="w-full mt-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors">
          View All Reviews
        </button>
      </div>

      <!-- You May Also Like Section -->
      <div v-if="relatedPizzas.length > 0" class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">You May Also Like</h2>
          <router-link to="/menu" class="text-primary hover:text-primary/80 font-medium">
            View All Menu
          </router-link>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in relatedPizzas"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="relative h-48 bg-gray-200">
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
              <div v-else class="w-full h-full flex items-center justify-center text-4xl">🍕</div>
              
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
                  class="w-4 h-4"
                />
              </button>
            </div>

            <div class="p-4">
              <h3 class="font-semibold text-white mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-2 line-clamp-2">{{ item.pizzaDescription }}</p>
              <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-primary">₱{{ item.pizzaPrice }}</span>
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="text-sm text-[#D1D5DB] ml-1">
                    {{ item.averageRating && item.averageRating > 0 ? `${item.averageRating} (${item.totalRatings})` : '0 (0)' }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="addToCart"
                  class="flex-1 bg-white border border-primary text-primary hover:bg-primary hover:text-white py-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm transition-colors"
                >
                  <ShoppingCart class="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  @click="orderNow"
                  class="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Checkout Confirmation Dialog -->
    <Dialog v-model:open="confirmationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Checkout</DialogTitle>
          <DialogDescription>
            Would you like to proceed to checkout? You will be redirected to complete your order details.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex justify-end space-x-2">
          <Button variant="outline" @click="confirmationOpen = false">Cancel</Button>
          <Button @click="proceedToCheckout">Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
