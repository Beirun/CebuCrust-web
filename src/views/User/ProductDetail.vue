# /product/:id

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeMount } from 'vue'
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
import { toBase64, toDate } from '@/plugins/convert'
import { useFetch } from '@/plugins/api'
import type { Pizza } from '@/models/pizza'
import type { User } from '@/models/user'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const pizza = usePizzaStore()
const cart = useCartStore()
const favorite = useFavoriteStore()
const rating = useRatingStore()
const user = useUserStore()
const order = useOrderStore()

const pizzaId = computed(() => parseInt(route.params.id as string))
const currentPizza = ref<Pizza | null>(null)
const quantity = ref(1)
const isFavorite = ref<number[]>([])
const selectedReviewFilter = ref('all')
const productInfoRef = ref<HTMLElement | null>(null)
const confirmationOpen = ref(false)
const showAllReviews = ref(false)

// Real review data from database
const reviews = ref<any[]>([])
const ratingStats = ref({
  average: 0,
  totalReviews: 0,
  distribution: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
})

const relatedPizzas = computed(() => {
  if (!currentPizza.value) return []
  return pizza.pizzas
    .filter(
      (p) =>
        p.pizzaId !== currentPizza.value?.pizzaId &&
        p.pizzaCategory === currentPizza.value?.pizzaCategory,
    )
    .slice(0, 4)
})

// Real data from database

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
  let filtered = reviews.value
  if (selectedReviewFilter.value !== 'all') {
    const rating = parseInt(selectedReviewFilter.value)
    filtered = reviews.value.filter((review) => review.rating === rating)
  }

  // Show only first 5 reviews unless showAllReviews is true
  if (!showAllReviews.value && filtered.length > 5) {
    return filtered.slice(0, 5)
  }

  return filtered
})

const hasMoreReviews = computed(() => {
  let filtered = reviews.value
  if (selectedReviewFilter.value !== 'all') {
    const rating = parseInt(selectedReviewFilter.value)
    filtered = reviews.value.filter((review) => review.rating === rating)
  }
  return filtered.length > 5
})

const toggleShowAllReviews = () => {
  showAllReviews.value = !showAllReviews.value
}

// Reset showAllReviews when filter changes
watch(selectedReviewFilter, () => {
  showAllReviews.value = false
})

const addToCart = async () => {
  console.log('val', currentPizza.value)
  if (!currentPizza.value) return

  await cart.addToCart({ pizzaId: currentPizza.value.pizzaId!, quantity: quantity.value })
}

const addItemToCart = async (item: Pizza) => {
  await cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
}

const inCart = (id: number) => {
  return cart.cart.some((c) => c.pizzaId === id)
}

// Fetch reviews for current pizza
const fetchReviews = async () => {
  if (!pizzaId.value) return

  try {
    const pizzaRating = await rating.fetchRatingsByPizzaId(pizzaId.value)
    if (pizzaRating) {
      // Transform the rating data to match the expected format
      reviews.value = pizzaRating.ratings.map((rating, index) => ({
        id: index + 1,
        user:
          user.users.find((u) => u.userId === rating.userId)?.firstName +
          ' ' +
          user.users.find((u) => u.userId === rating.userId)?.lastName,
        avatar: user.users.find((u) => u.userId === rating.userId)?.profileImage,
        rating: rating.ratingValue,
        comment: rating.ratingMessage || 'No comment provided',
        date: toDate(rating.dateCreated), // You might want to use actual dates
        size: 'Medium', // Default size since this info isn't in the rating data
      }))

      // Update rating stats
      ratingStats.value = {
        average: pizzaRating.averageRating,
        totalReviews: pizzaRating.totalRatings,
        distribution: {
          5: pizzaRating.ratings.filter((r) => r.ratingValue === 5).length,
          4: pizzaRating.ratings.filter((r) => r.ratingValue === 4).length,
          3: pizzaRating.ratings.filter((r) => r.ratingValue === 3).length,
          2: pizzaRating.ratings.filter((r) => r.ratingValue === 2).length,
          1: pizzaRating.ratings.filter((r) => r.ratingValue === 1).length,
        },
      }
    }
  } catch (error) {
    console.error('Error fetching reviews:', error)
  }
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

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const toggleFavorite = (pizzaId: number, delay = 500) => {
  console.log(`favorites: ${favorite.favorites}`)
  if (isFavorite.value.includes(pizzaId)) {
    isFavorite.value = isFavorite.value.filter((f) => f !== pizzaId)
    if (currentPizza.value?.favoriteCount)
      currentPizza.value.favoriteCount = currentPizza.value?.favoriteCount - 1
  } else {
    isFavorite.value = [...isFavorite.value, pizzaId]
    if (currentPizza.value?.favoriteCount)
      currentPizza.value.favoriteCount = currentPizza.value?.favoriteCount + 1
  }
  toggle(pizzaId, delay)
}

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

const incrementQuantity = () => {
  quantity.value++
}

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

onBeforeMount(async () => {
  await pizza.fetchAll()
  await favorite.fetchFavorites()
  await order.fetchUserOrders() // Fetch orders to get user names
  await user.getAllUsers()
  await cart.fetchCart()
  isFavorite.value = favorite.favorites

  currentPizza.value = pizza.pizzas.find((p) => p.pizzaId === pizzaId.value) || null

  if (!currentPizza.value) {
    router.push('/menu')
  }

  // Fetch reviews for this pizza
  await fetchReviews()
})

// Watch for pizzaId changes and refetch reviews
watch(pizzaId, async () => {
  if (pizzaId.value) {
    await fetchReviews()
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
            <div
              class="bg-gray-200 rounded-lg overflow-hidden"
              :style="{ height: productInfoHeight }"
            >
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
                  :class="
                    isFavorite.includes(currentPizza.pizzaId!)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400'
                  "
                  class="w-5 h-5"
                />
                <span>{{ currentPizza.favoriteCount }}</span>
              </button>
            </div>

            <!-- Row 2: Rating, Reviews, and Sales -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="flex">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    :class="
                      i <= Math.round(averageRating || currentPizza.averageRating || 0)
                        ? 'w-5 h-5 text-primary fill-current'
                        : 'w-5 h-5 text-gray-300'
                    "
                  />
                </div>
                <span class="font-semibold text-gray-900">{{
                  averageRating || currentPizza.averageRating || '0.0'
                }}</span>
              </div>
              <span class="text-gray-400">•</span>
              <span class="text-gray-600">{{ totalReviews }} Reviews</span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-600">{{ soldCount }} Sold</span>
            </div>
            <span class="text-gray-600 font-semibold text-lg"
              >{{ currentPizza.stock }} Available</span
            >

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
                  :style="{
                    width: `${(ratingStats.distribution[rating] / ratingStats.totalReviews) * 100}%`,
                  }"
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
            :class="
              selectedReviewFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-300 text-gray-700'
            "
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            All
          </button>
          <button
            v-for="rating in [5, 4, 3, 2, 1]"
            :key="rating"
            @click="selectedReviewFilter = rating.toString()"
            :class="
              selectedReviewFilter === rating.toString()
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-300 text-gray-700'
            "
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
                :src="toBase64(review.avatar)"
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

        <button
          v-if="hasMoreReviews"
          @click="toggleShowAllReviews"
          class="w-full mt-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors"
        >
          {{ showAllReviews ? 'Show Less Reviews' : 'View All Reviews' }}
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
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="router.push(`/product/${item.pizzaId}`)"
          >
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

              <button
                class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                @click.stop="toggleFavorite(item.pizzaId!)"
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
              <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>
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
              </div>
              <button
                :disabled="!item.isAvailable || inCart(item.pizzaId!)"
                @click.stop="addItemToCart(item)"
                class="w-full text-white py-2 rounded-lg font-medium flex items-center justify-center"
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
    </main>

    <!-- Checkout Confirmation Dialog -->
    <Dialog v-model:open="confirmationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Checkout</DialogTitle>
          <DialogDescription>
            Would you like to proceed to checkout? You will be redirected to complete your order
            details.
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
