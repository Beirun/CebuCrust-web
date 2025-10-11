# /dashboard

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, Heart, Star, MapPin, Clock } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { useFavoriteStore } from '@/stores/favorite'
import { useOrdersStore } from '@/stores/orders'
import { usePizzaStore } from '@/stores/pizza'
import { useAuthStore } from '@/stores/auth'
import { toBase64 } from '@/plugins/convert'

const cart = useCartStore()

const favorite = useFavoriteStore()
const pizza = usePizzaStore()

const isFavorite = ref<number[]>([])

const favoritePizzas = computed(() =>
  pizza.pizzas.filter((p) => isFavorite.value.includes(p.pizzaId!)),
)

// User data (seeded from auth store if available)
const auth = useAuthStore()
const user = ref({
  name: auth.user?.firstName ? `${auth.user.firstName} ${auth.user.lastName ?? ''}`.trim() : auth.user?.name ?? 'Guest',
  // For new accounts keep address empty so UI can show "not set yet"
  address: auth.user?.address ?? localStorage.getItem('address') ?? '',
  deliveryTime: '25-30 mins',
})

// Orders store
const ordersStore = useOrdersStore()

// Current selected order (first recent order)
const currentOrder = ref<any>(null)

// Order status steps template
const orderSteps = ref([
  { id: 'pending', label: 'Received', completed: false, active: false },
  { id: 'preparing', label: 'Preparing', completed: false, active: false },
  { id: 'ready', label: 'Ready', completed: false, active: false },
  { id: 'out_for_delivery', label: 'Out for Delivery', completed: false, active: false },
  { id: 'delivered', label: 'Delivered', completed: false, active: false },
])

const todaysSpecials = ref<
  {
    id: number
    image: string
    name: string
    rating: number
    reviewCount: number
    description: string
    price: number
  }[]
>([])

// Computed properties
const currentTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

// Methods
const addToCart = (item: any) => {
  cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
}

const trackOrder = () => {
  if (!currentOrder.value) return
  console.log('Tracking order:', currentOrder.value.id)
}

// Change address modal state & logic
const showAddressModal = ref(false)
const newAddress = ref('')
const addressError = ref('')
const isSavingAddress = ref(false)

// Searchable list of barangays in Cebu City (client-side static list)
const barangays = [
  'Amonian', 'Apas', 'Banilad', 'Basak Pardo', 'Basak San Nicolas', 'Basak Tua', 'Bula', 'Camputhaw',
  'Capitol Site', 'Carmelite', 'Carreta', 'Guadalupe', 'Hipodromo', 'Kalubihan', 'Kinasang-an', 'Labangon',
  'Lahug', 'Mabolo', 'Magallanes', 'Mambaling', 'Masilaw', 'Minglanilla', 'N. Bacayan', 'Pardo', 'Poblacion',
  'Sagay', 'San Nicolas Proper', 'San Roque', 'Talamban', 'T. Padilla', 'Tinago'
]

const searchQuery = ref('')
const selectedBarangay = ref<string | null>(null)

const filteredBarangays = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return barangays
  return barangays.filter((b) => b.toLowerCase().includes(q))
})

const openChangeAddress = () => {
  // initialize modal state
  newAddress.value = user.value.address || ''
  addressError.value = ''
  searchQuery.value = ''
  selectedBarangay.value = null
  showAddressModal.value = true
}

const validateCebuCity = (addr: string) => {
  if (!addr || addr.trim().length === 0) return 'Address is required.'
  // we only accept selections within Cebu City; ensure the string references Cebu
  const lower = addr.toLowerCase()
  if (!lower.includes('cebu')) {
    return 'Delivery is available only within Cebu City.'
  }
  return ''
}

const selectBarangay = (b: string) => {
  selectedBarangay.value = b
  // show the composed address for confirmation
  newAddress.value = `${b}, Cebu City`
}

const saveAddress = async () => {
  // If a barangay is selected use it; otherwise validate free text
  if (selectedBarangay.value) {
    newAddress.value = `${selectedBarangay.value}, Cebu City`
  }

  addressError.value = validateCebuCity(newAddress.value)
  if (addressError.value) return
  isSavingAddress.value = true

  // Try to update via auth store API if available
  try {
    const updates: any = { address: newAddress.value }
    const ok = await auth.update(updates)
    if (ok) {
      // auth.update stores the user into localStorage; sync local state
      user.value.address = auth.user?.address ?? newAddress.value
      localStorage.setItem('address', user.value.address)
      showAddressModal.value = false
    } else {
      // Fallback: update local state and persist to localStorage
      user.value.address = newAddress.value
      localStorage.setItem('address', user.value.address)
      showAddressModal.value = false
    }
  } catch (err) {
    // fallback local update
    user.value.address = newAddress.value
    localStorage.setItem('address', user.value.address)
    showAddressModal.value = false
  } finally {
    isSavingAddress.value = false
    // clear selection
    selectedBarangay.value = null
    searchQuery.value = ''
  }
}

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const toggleFavorite = (pizzaId: number, delay = 500) => {
  if (favorite.favorites.includes(pizzaId)) {
    isFavorite.value = isFavorite.value.filter((f) => f !== pizzaId)
  } else {
    isFavorite.value = [...isFavorite.value, pizzaId]
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

onMounted(async () => {
  await pizza.fetchAll()
  await favorite.fetchFavorites()
  isFavorite.value = favorite.favorites
  // fetch user orders and set current order if any
  await ordersStore.fetchOrders()
  if (ordersStore.orders.length > 0) {
    // pick the latest order
    currentOrder.value = ordersStore.orders[0]
    // map order status to steps
    updateStepsFromStatus(currentOrder.value.status)
  }
})

const updateStepsFromStatus = (status: string) => {
  const statusOrder = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered']
  const index = statusOrder.indexOf(status)
  orderSteps.value = orderSteps.value.map((s, i) => ({
    ...s,
    completed: i < index,
    active: i === index,
  }))
}

// Simple estimated delivery heuristic based on barangay/address keywords
const estimatedDelivery = computed(() => {
  const addr = (user.value.address || '').toLowerCase()
  if (!addr) return 'TBD'

  const fast = ['lahug', 'capitol', 'mabolo', 'guadalupe', 'poblacion', 'hipodromo']
  const medium = ['banilad', 'labangon', 'kinalubihan', 'mambaling', 'basak', 'pardo']
  const slow = ['minglanilla', 'tinago', 'n. bacayan', 'san roque', 'san nicolas']

  for (const k of fast) if (addr.includes(k)) return '15-25 mins'
  for (const k of medium) if (addr.includes(k)) return '20-35 mins'
  for (const k of slow) if (addr.includes(k)) return '30-45 mins'

  // default estimate
  return '25-35 mins'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <!-- Main Content -->
    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8">
      <div class="bg-[#121A1D] rounded-lg p-8 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('@/assets/banner-dashboard.png')] bg-cover bg-center"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-[#121A1D] to-[#192124] opacity-90"></div>
        <div
          class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center"
        >
          <div class="mb-6 lg:mb-0">
            <h1 class="text-3xl font-bold text-white mb-2">
              {{ currentTime }}, {{ user.name.split(' ')[0] }}!
            </h1>
            <p class="text-[#D1D5DB] text-lg mb-4">Ready for another delicious pizza experience?</p>
            <router-link
              to="/favorites"
              class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              Order Your Favorite Pizza
            </router-link>
          </div>
          <div class="bg-[#192124] rounded-lg p-6 w-full lg:w-80">
            <div class="flex items-center mb-2">
              <MapPin class="w-5 h-5 text-[#D1D5DB] mr-2" />
              <span class="text-[#D1D5DB] font-medium">Delivering to:</span>
            </div>
            <p class="text-white mb-3">{{ user.address || 'Address not set yet' }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Clock class="w-4 h-4 text-[#D1D5DB] mr-1" />
                <span class="text-sm text-[#D1D5DB]">Est. delivery: {{ estimatedDelivery }}</span>
              </div>
              <button
                @click="openChangeAddress"
                class="text-primary hover:text-primary/80 text-sm font-medium"
              >
                {{ user.address ? 'Change address' : 'Set address' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Change address modal -->
      <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black opacity-40" @click="showAddressModal = false"></div>
        <div class="bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6">
          <h3 class="text-lg font-semibold mb-2">Choose your Barangay (Cebu City)</h3>
          <p class="text-sm text-gray-600 mb-4">Select from the list or search your barangay.</p>

          <div class="mb-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search barangay..."
              class="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div class="max-h-44 overflow-auto mb-3 border rounded-md p-2">
            <ul>
              <li
                v-for="b in filteredBarangays"
                :key="b"
                @click="selectBarangay(b)"
                :class="['px-3 py-2 rounded-md cursor-pointer', selectedBarangay === b ? 'bg-orange-100' : 'hover:bg-gray-100']"
              >
                {{ b }}
              </li>
              <li v-if="filteredBarangays.length === 0" class="text-sm text-gray-500 px-3 py-2">No barangays found.</li>
            </ul>
          </div>

          <div class="mb-3">
            <label class="block text-sm text-gray-700 mb-1">Full Address</label>
            <input v-model="newAddress" type="text" class="w-full border rounded-md px-3 py-2" placeholder="Optional additional details (street, building)" />
            <p v-if="addressError" class="text-sm text-red-500 mt-1">{{ addressError }}</p>
          </div>

          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 rounded-md" @click="showAddressModal = false">Cancel</button>
            <button :disabled="isSavingAddress" @click="saveAddress" class="bg-orange-500 text-white px-4 py-2 rounded-md">{{ isSavingAddress ? 'Saving...' : 'Save Address' }}</button>
          </div>
        </div>
      </div>

      <div v-if="currentOrder" class="mb-8">
        <div class="bg-[#121A1D] rounded-lg p-6">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h3 class="text-lg font-semibold text-white">Order #{{ currentOrder.id }}</h3>
              <p class="text-[#D1D5DB]">
                {{ currentOrder.items?.length ?? currentOrder.items }} items • ₱{{ (currentOrder.total ?? currentOrder.totalAmount ?? currentOrder.totalPrice ?? 0).toFixed(2) }}
              </p>
            </div>
            <button
              @click="trackOrder"
              class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-medium mt-4 lg:mt-0"
            >
              Track Order
            </button>
          </div>

          <div class="flex items-center justify-between mb-4">
            <div v-for="(step, index) in orderSteps" :key="step.id" class="flex items-center">
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  :class="
                    step.completed
                      ? 'bg-green-500 text-white'
                      : step.active
                        ? 'bg-primary text-white'
                        : 'bg-[#797B78] text-white'
                  "
                >
                  <span v-if="step.completed">✓</span>
                  <span v-else-if="step.id === 'delivered'">🏠</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="text-xs text-[#D1D5DB] mt-1 text-center">{{ step.label }}</span>
              </div>
              <div
                v-if="index < orderSteps.length - 1"
                class="flex-1 h-0.5 mx-2"
                :class="step.completed ? 'bg-green-500' : 'bg-[#797B78]'"
              ></div>
            </div>
          </div>

          <p class="text-[#D1D5DB]">Estimated delivery: {{ currentOrder.estimatedDelivery ?? 'TBD' }}</p>
        </div>
      </div>

      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Order Your Favorites</h2>
          <router-link to="/favorites" class="text-primary hover:text-primary/80 font-medium">
            View All Favorites
          </router-link>
        </div>
        <!-- Empty state for favorites -->
        <div
          v-if="isFavorite.length === 0"
          class="text-center p-12"
        >
          <Heart class="w-16 h-16 text-[#797B78] mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-white mb-2">You have no favorites yet</h3>
          <p class="text-[#D1D5DB] mb-6">
            Start exploring our menu and add your favorite pizzas to see them here!
          </p>
          <router-link
            to="/menu"
            class="inline-flex items-center bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Menu
          </router-link>
        </div>

        <!-- Favorites grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in favoritePizzas"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="h-48 bg-gray-700 flex items-center justify-center relative">
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
                @click="toggleFavorite(item.pizzaId!)"
              >
                <Heart
                  class="w-5 h-5"
                  :class="
                    isFavorite.includes(item.pizzaId!)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400'
                  "
                />
              </button>
            </div>

            <div class="p-4">
              <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>
              <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-primary">₱{{ item.pizzaPrice }}</span>
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="text-sm text-[#D1D5DB] ml-1">4.8 (124)</span>
                </div>
              </div>
              <button
                @click="addToCart(item)"
                class="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-lg font-medium flex items-center justify-center"
              >
                <ShoppingCart class="w-4 h-4 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Today's Specials</h2>
          <router-link to="/menu" class="text-primary hover:text-primary/80 font-medium">
            View All Menu
          </router-link>
        </div>
        <!-- Empty state for today's specials -->
        <div
          v-if="pizza.pizzas.length === 0"
          class="text-center p-12"
        >
          <Star class="w-16 h-16 text-[#797B78] mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-white mb-2">No specials today</h3>
          <p class="text-[#D1D5DB] mb-6">
            Our admin hasn't added any special offers for today. Check back later or explore our
            regular menu!
          </p>
          <router-link
            to="/menu"
            class="inline-flex items-center bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Full Menu
          </router-link>
        </div>

        <!-- Today's specials grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in pizza.pizzas.slice(0, 4)"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="h-48 bg-gray-700 flex items-center justify-center relative">
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
                @click="toggleFavorite(item.pizzaId!)"
              >
                <Heart
                  class="w-5 h-5"
                  :class="
                    isFavorite.includes(item.pizzaId!)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400'
                  "
                />
              </button>
            </div>

            <div class="p-4">
              <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
              <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>
              <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-primary">₱{{ item.pizzaPrice }}</span>
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="text-sm text-[#D1D5DB] ml-1">4.8 (124)</span>
                </div>
              </div>
              <button
                @click="addToCart(item)"
                class="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-lg font-medium flex items-center justify-center"
              >
                <ShoppingCart class="w-4 h-4 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>
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
