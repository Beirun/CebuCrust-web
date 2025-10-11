<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import router from '@/router'
import { ShoppingCart, Trash2, Plus, Minus, Heart, Check, MapPin, Clock } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import { useFavoriteStore } from '@/stores/favorite'
import { useAuthStore } from '@/stores/auth'
import { toBase64 } from '@/plugins/convert'

const cart = useCartStore()
const pizza = usePizzaStore()
const favorite = useFavoriteStore()
const auth = useAuthStore()

const cartItems = ref<
  {
    pizzaId: number
    quantity: number
  }[]
>([])

const selectedItems = ref<number[]>([])
const selectAll = ref(false)

// User data (seeded from auth store if available)
const user = ref({
  name: auth.user?.firstName ? `${auth.user.firstName} ${auth.user.lastName ?? ''}`.trim() : auth.user?.name ?? 'Guest',
  address: auth.user?.address ?? localStorage.getItem('address') ?? '',
})

// Address modal state & logic
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

const increase = async (pizzaId: number, quantity: number) =>
  await cart.updateCart(pizzaId, quantity)
const decrease = async (pizzaId: number, quantity: number) =>
  await cart.updateCart(pizzaId, quantity)

const addUpdateTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const removeUpdateTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const addCount = (pizzaId: number, delay = 500) => {
  cartItems.value = cartItems.value.map((c) =>
    pizzaId === c.pizzaId ? { pizzaId: c.pizzaId, quantity: c.quantity + 1 } : c,
  )
  if (addUpdateTimeout.value) clearTimeout(addUpdateTimeout.value)

  addUpdateTimeout.value = setTimeout(async () => {
    await increase(pizzaId, cartItems.value.find((c) => c.pizzaId === pizzaId)!.quantity)
  }, delay)
}

const removeCount = (pizzaId: number, delay = 500) => {
  cartItems.value = cartItems.value.map((c) =>
    pizzaId === c.pizzaId ? { pizzaId: c.pizzaId, quantity: c.quantity - 1 } : c,
  )
  if (removeUpdateTimeout.value) clearTimeout(removeUpdateTimeout.value)

  removeUpdateTimeout.value = setTimeout(async () => {
    await decrease(pizzaId, cartItems.value.find((c) => c.pizzaId === pizzaId)!.quantity)
  }, delay)
}

const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  if (selectAll.value) {
    selectedItems.value = cartItems.value.map(item => item.pizzaId)
  } else {
    selectedItems.value = []
  }
}

const toggleItemSelection = (pizzaId: number) => {
  const index = selectedItems.value.indexOf(pizzaId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(pizzaId)
  }
  selectAll.value = selectedItems.value.length === cartItems.value.length
}

const deleteSelected = () => {
  selectedItems.value.forEach(pizzaId => {
    cart.removeFromCart(pizzaId)
  })
  selectedItems.value = []
  selectAll.value = false
}

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const toggleFavorite = (pizzaId: number, delay = 500) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  debounceTimeout = setTimeout(async () => {
    if (favorite.favorites.includes(pizzaId)) {
      await favorite.removeFavorite(pizzaId)
    } else {
      await favorite.addFavorite(pizzaId)
    }
  }, delay)
}

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

const checkout = async () => {
  router.push('/completeOrder')
}

const hasItems = computed(() => cart.cart.length > 0)

const getSubtotal = () => {
  return cartItems.value.reduce((total, item) => {
    const pizzaItem = pizza.pizzas.find((p) => p.pizzaId === item.pizzaId)
    if (!pizzaItem) return total
    return total + pizzaItem.pizzaPrice * item.quantity
  }, 0)
}

const getSelectedSubtotal = () => {
  return cartItems.value
    .filter(item => selectedItems.value.includes(item.pizzaId))
    .reduce((total, item) => {
      const pizzaItem = pizza.pizzas.find((p) => p.pizzaId === item.pizzaId)
      if (!pizzaItem) return total
      return total + pizzaItem.pizzaPrice * item.quantity
    }, 0)
}

onMounted(async () => {
  cartItems.value = cart.cart
  await favorite.fetchFavorites()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8">
      <div v-if="!hasItems" class="text-center py-12">
        <ShoppingCart class="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p class="text-gray-600 mb-6">Add items from the menu to begin your order.</p>
        <router-link
          to="/menu"
          class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium"
          >Browse Menu</router-link
        >
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Shopping Cart -->
        <div class="lg:col-span-2">
          <!-- Shopping Cart Header Card -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
            
            <!-- Global Actions -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="selectAll"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span class="text-gray-700 font-medium">Select All</span>
                </label>
                <span class="text-gray-500">{{ cartItems.length }} items in your cart</span>
              </div>
              <button
                @click="deleteSelected"
                :disabled="selectedItems.length === 0"
                class="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Trash2 class="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          </div>

          <!-- Cart Items Container -->
          <div class="space-y-4">
            <div
              v-for="item in pizza.pizzas.filter((p) =>
                cart.cart.some((c) => c.pizzaId === p.pizzaId),
              )"
              :key="item.pizzaId!"
              class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div class="flex items-start gap-4">
                <!-- Checkbox -->
                <input
                  type="checkbox"
                  :checked="selectedItems.includes(item.pizzaId!)"
                  @change="toggleItemSelection(item.pizzaId!)"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                />

                <!-- Pizza Image -->
                <div class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                  <div v-else class="w-full h-full flex items-center justify-center text-2xl">🍕</div>
                </div>

                <!-- Pizza Details -->
                <div class="flex-1">
                  <!-- Row 1: Title and Actions -->
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-gray-900 text-lg">{{ item.pizzaName }}</h3>
                    <div class="flex items-center gap-3">
                        <button
                          @click="toggleFavorite(item.pizzaId!)"
                          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Heart 
                            class="w-5 h-5"
                            :class="
                              favorite.favorites.includes(item.pizzaId!)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                            "
                          />
                        </button>
                      <button
                        @click="cart.removeFromCart(item.pizzaId!)"
                        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Trash2 class="w-5 h-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  <!-- Row 2: Description -->
                  <p class="text-gray-600 text-sm mb-2">{{ item.pizzaDescription }}</p>

                  <!-- Row 3: Price -->
                  <div class="mb-3">
                    <span class="text-lg font-bold text-gray-900">₱{{ item.pizzaPrice }}</span>
                  </div>

                  <!-- Row 4: Quantity and Subtotal -->
                  <div class="flex items-center justify-between">
                    <!-- Quantity Selector -->
                    <div class="flex items-center gap-2">
                      <button
                        @click="removeCount(item.pizzaId!)"
                        class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center justify-center transition-colors"
                      >
                        <Minus class="w-4 h-4 text-gray-600" />
                      </button>
                      <span class="px-3 py-1 bg-gray-100 rounded-md min-w-[40px] text-center font-medium">
                        {{ cartItems.find((c) => c.pizzaId === item.pizzaId)?.quantity || 1 }}
                      </span>
                      <button
                        @click="addCount(item.pizzaId!)"
                        class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center justify-center transition-colors"
                      >
                        <Plus class="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <!-- Subtotal -->
                    <div class="text-right">
                      <p class="text-gray-500 text-sm">Subtotal</p>
                      <p class="font-semibold text-primary">
                        ₱{{
                          (
                            item.pizzaPrice *
                            (cartItems.find((c) => c.pizzaId === item.pizzaId)?.quantity || 1)
                          ).toFixed(2)
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <!-- Summary Breakdown -->
            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₱{{ getSelectedSubtotal().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-700">
                <span>Delivery Fee</span>
                <span>₱50</span>
              </div>
              <div class="border-t border-gray-200 pt-3">
                <div class="flex justify-between">
                  <span class="font-bold text-gray-900">Total Payment</span>
                  <span class="text-2xl font-bold text-primary">₱{{ (getSelectedSubtotal() + 50).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Delivery Information -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-700">Delivery to:</span>
                <button 
                  @click="openChangeAddress"
                  class="text-primary hover:text-primary/80 font-medium"
                >
                  {{ user.address ? 'Change' : 'Add Address' }}
                </button>
              </div>
              <p class="text-gray-600 text-sm mb-2">{{ user.address || 'Address not set yet' }}</p>
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Estimated Delivery:</span>
                <span class="text-green-600 font-medium">{{ estimatedDelivery }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                @click="checkout"
                class="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Checkout ({{ selectedItems.length }})
              </button>
              <router-link
                to="/menu"
                class="w-full border border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                Continue Shopping
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>

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

    <Footer />
  </div>
</template>
