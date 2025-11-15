<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, Heart, Star, MapPin, Clock } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { useFavoriteStore } from '@/stores/favorite'
import { useOrderStore } from '@/stores/orders'
import { usePizzaStore } from '@/stores/pizza'
import { useAuthStore } from '@/stores/auth'
import { toBase64 } from '@/plugins/convert'
import type { Pizza } from '@/models/pizza'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-vue-next'
import { useLocationStore } from '@/stores/location'
import { barangays } from '@/data/barangay'
import type { Location } from '@/models/location'

const cart = useCartStore()
const order = useOrderStore()
const favorite = useFavoriteStore()
const pizza = usePizzaStore()
const location = useLocationStore()
const router = useRouter()
const isFavorite = ref<number[]>([])
const auth = useAuthStore()

const favoritePizzas = computed(() =>
  pizza.pizzas.filter((p) => !p.isDeleted && isFavorite.value.includes(p.pizzaId!)),
)

// Current active order (most recent non-delivered order)
const currentOrder = computed(() => {
  const activeOrders = order.orders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled',
  )
  return activeOrders.length > 0 ? activeOrders[0] : null
})

// Order status steps template
const orderSteps = ref([
  { id: 'pending', label: 'Received', completed: false, active: false },
  { id: 'preparing', label: 'Preparing', completed: false, active: false },
  { id: 'ready', label: 'Ready', completed: false, active: false },
  { id: 'out_for_delivery', label: 'Out for Delivery', completed: false, active: false },
  { id: 'delivered', label: 'Delivered', completed: false, active: false },
])

const completedSegments = computed(
  () => orderSteps.value.filter((step) => step.completed).length,
)

const totalSegments = computed(() => Math.max(orderSteps.value.length - 1, 0))

const progressLineStyle = computed(() => {
  if (totalSegments.value === 0) return { width: '0' }
  const fraction = completedSegments.value / totalSegments.value
  return {
    width: `calc(${fraction} * (100% - 2rem))`,
  }
})

// Computed properties
const currentTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

// Methods
const addToCart = (item: Pizza) => {
  cart.addToCart({ pizzaId: item.pizzaId!, quantity: 1 })
}

const trackOrder = () => {
  if (!currentOrder.value) return
  router.push(`/order/track/${currentOrder.value.orderId}`)
}

const showAddressModal = ref(false)
const selectedAddressId = ref(0)
const showChangeAddressModal = ref(false)
const fromSelectAddress = ref(false)
const isEdit = ref(false)
const locationForm = reactive({
  locationId: 0,
  locationCity: 'Cebu City',
  locationBrgy: '',
  locationStreet: '',
  locationHouseNo: '',
  locationPostal: '',
  locationLandmark: '',
  isDefault: false,
})

const openChangeAddress = () => {
  // initialize modal state
  locationForm.locationBrgy = ''
  locationForm.locationStreet = ''
  locationForm.locationHouseNo = ''
  locationForm.locationPostal = ''
  locationForm.locationLandmark = ''
  locationForm.isDefault = false
  showAddressModal.value = true
}

const openChangeAddressModal = () => {
  showChangeAddressModal.value = true
}
const openEditAddress = (loc: Location) => {
  // initialize modal state
  locationForm.locationId = loc.locationId
  locationForm.locationBrgy = loc.locationBrgy
  locationForm.locationStreet = loc.locationStreet
  locationForm.locationHouseNo = loc.locationHouseNo
  locationForm.locationPostal = loc.locationPostal ?? ''
  locationForm.locationLandmark = loc.locationLandmark ?? ''
  locationForm.isDefault = loc.isDefault
  showAddressModal.value = true
  fromSelectAddress.value = true
  showChangeAddressModal.value = false
  isEdit.value = true
}

const UpdateShowAddressModal = (val: boolean) => {
  showAddressModal.value = val
  if (fromSelectAddress.value) showChangeAddressModal.value = true
}

// Auto-confirm selection when user picks a radio in the Select Address dialog.
// This lets us remove the visible Cancel/Save buttons in that dialog while
// still applying the selected address immediately.
watch(selectedAddressId, (val) => {
  if (!val) return
  const sel = location.locations.find((l) => l.locationId === val)
  if (sel) {
    location.selectedLocation = sel
    showChangeAddressModal.value = false
  }
})

const deleteAddress = async (loc: Location) => {
  const deleted = await location.removeLocation(loc.locationId)
  if (deleted) {
    // Sync selectedAddressId with the store's selectedLocation after deletion
    selectedAddressId.value = location.selectedLocation?.locationId ?? 0
  }
}

const setAsDefault = async (loc: Location) => {
  loc.isDefault = true
  await location.updateLocation(loc.locationId, loc)
}

const saveAddress = async () => {
  if (isEdit.value) {
    const res = await location.updateLocation(locationForm.locationId, locationForm)
    if (res) {
      showAddressModal.value = false
      isEdit.value = false
      // Update selectedAddressId if the edited address was selected or is now default
      if (locationForm.isDefault) {
        selectedAddressId.value = locationForm.locationId
      }
    }
  } else {
    const res = await location.addLocation(locationForm)
    if (res) {
      showAddressModal.value = false
      // Update selectedAddressId to the newly added address or the newly set default
      const newLocation = location.locations[location.locations.length - 1]
      if (newLocation) {
        selectedAddressId.value = newLocation.locationId
      }
    }
  }
  if (fromSelectAddress.value) showChangeAddressModal.value = true
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
  await location.fetchLocations()
  await order.fetchUserOrders()
  selectedAddressId.value = location.selectedLocation?.locationId ?? 0

  isFavorite.value = favorite.favorites
  // fetch user orders and set current order if any
  if (order.orders.length > 0) {
    // map order status to steps for the current active order
    const activeOrder = order.orders.find(
      (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled',
    )
    if (activeOrder) {
      updateStepsFromStatus(activeOrder.orderStatus!)
    }
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
  const addr =
    location.locations
      .find(
        (l) => l.locationId === (selectedAddressId.value ?? location.selectedLocation?.locationId),
      )
      ?.locationBrgy.toLowerCase() ?? ''
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

const inCart = (id: number) => {
  return cart.cart.some((c) => c.pizzaId === id)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <!-- Main Content -->
    <main class="w-screen min-h-[calc(100vh-5rem)] px-4 sm:px-8 lg:px-30 py-8">
      <div class="bg-[#121A1D] rounded-lg p-8 mb-8 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-[url('@/assets/banner-dashboard.png')] bg-cover bg-center"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-r from-[#121A1D] to-[#192124] opacity-90"></div>
        <div
          class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center"
        >
          <div class="mb-6 lg:mb-0">
            <h1 class="text-3xl font-bold text-white mb-2">
              {{ currentTime }}, {{ auth.userInfo.firstName }}!
            </h1>
            <p class="text-[#D1D5DB] text-lg mb-4">Ready for another delicious pizza experience?</p>
            <router-link
              to="/favorites"
              class="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              Order Your Favorite Pizza
            </router-link>
          </div>
          <div class="bg-[#192124] rounded-lg p-6 w-full lg:w-90">
            <div class="flex items-center mb-2">
              <MapPin class="w-5 h-5 text-[#D1D5DB] mr-2" />
              <span class="text-[#D1D5DB] font-medium">Delivering to:</span>
            </div>
            <p class="text-white mb-3">
              {{ location.mapLocation(location.selectedLocation ?? null) || 'Address not set yet' }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Clock class="w-4 h-4 text-[#D1D5DB] mr-1" />
                <span class="text-sm text-[#D1D5DB]">Est. delivery: {{ estimatedDelivery }}</span>
              </div>
              <button
                @click="location.selectedLocation ? openChangeAddressModal() : openChangeAddress()"
                class="text-primary hover:text-primary/80 text-sm font-medium"
              >
                {{ location.selectedLocation ? 'Change address' : 'Set address' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog v-model:open="showChangeAddressModal">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Delivery Address</DialogTitle>
            <DialogDescription>Select an address for delivery within Cebu City.</DialogDescription>
          </DialogHeader>
          <div v-if="location.locations.filter((l) => !l.isDeleted).length" class="space-y-3">
            <div
              v-for="a in location.locations.filter((l) => !l.isDeleted)"
              :key="a.locationId"
              class="flex items-center justify-between p-4 border rounded-lg shadow-sm relative"
              :class="
                selectedAddressId === a.locationId
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border'
              "
              :style="selectedAddressId === a.locationId ? '' : 'border-color: #E5E7EB;'"
            >
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  :value="a.locationId"
                  v-model="selectedAddressId"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div class="flex-1 flex items-center gap-2">
                  <div class="font-medium text-gray-900 flex items-center gap-2">
                    {{ location.mapLocation(a) }}
                    <span
                      v-if="a.isDefault"
                      class="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium"
                      >{{ a.isDefault ? 'Default' : '' }}</span
                    >
                  </div>
                </div>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="absolute h-8 w-8 p-0 top-1 right-1">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4 rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEditAddress(a)">
                    <Edit class="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    @click="deleteAddress(a)"
                    class="text-red-600 focus:text-red-600"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="!a.isDefault" @click="setAsDefault(a)">
                    <Star class="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div v-else class="text-sm text-gray-500 mb-4">No saved addresses. Please add one.</div>

          <div class="mt-4">
            <Button
              variant="outline"
              @click="
                () => {
                  openChangeAddress()
                  fromSelectAddress = true
                  showChangeAddressModal = false
                }
              "
              class="h-12 w-full text-primary px-4 py-2"
            >
              + Add New Address
            </Button>
          </div>

          <!-- Footer removed: selection is applied immediately when user picks a radio -->
        </DialogContent>
      </Dialog>
      <!-- Change address modal -->
      <Dialog :open="showAddressModal" @update:open="UpdateShowAddressModal">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{{ isEdit ? 'Update' : 'Add' }} Delivery Address</DialogTitle>
            <DialogDescription>
              Enter your complete address for delivery within Cebu City.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <!-- First Row: City and Barangay -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="city">City *</Label>
                <Input
                  id="city"
                  v-model="locationForm.locationCity"
                  class="h-12 col-span-3"
                  disabled
                />
              </div>
              <div class="space-y-2">
                <Label for="barangay">Barangay *</Label>
                <Select v-model="locationForm.locationBrgy">
                  <SelectTrigger class="w-full py-5.5">
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="barangay in barangays" :key="barangay" :value="barangay">
                      {{ barangay }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Second Row: Street and House No -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="street">Street *</Label>
                <Input
                  class="h-12"
                  id="street"
                  v-model="locationForm.locationStreet"
                  placeholder="Enter street name"
                />
              </div>
              <div class="space-y-2">
                <Label for="houseNo">House No *</Label>
                <Input
                  class="h-12"
                  id="houseNo"
                  v-model="locationForm.locationHouseNo"
                  placeholder="Enter house number"
                />
              </div>
            </div>

            <!-- Third Row: Postal Code and Landmark (Optional) -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="postalCode">Postal Code</Label>
                <Input
                  class="h-12"
                  id="postalCode"
                  v-model="locationForm.locationPostal"
                  placeholder="Enter postal code"
                />
              </div>
              <div class="space-y-2">
                <Label for="landmark">Landmark</Label>
                <Input
                  class="h-12"
                  id="landmark"
                  v-model="locationForm.locationLandmark"
                  placeholder="Enter nearby landmark"
                />
              </div>
            </div>

            <!-- Save as default checkbox -->
            <div class="flex items-center space-x-2">
              <Checkbox id="saveDefault" v-model="locationForm.isDefault" />
              <Label for="saveDefault" class="text-sm font-normal"> Save as default address </Label>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-between gap-3">
            <Button
              class="w-[calc(50%-6px)] h-12"
              variant="outline"
              @click="showAddressModal = false"
            >
              Cancel
            </Button>
            <Button
              :disabled="location.isLoading"
              @click="saveAddress"
              class="w-[calc(50%-6px)] h-12 bg-primary hover:bg-primary/90"
            >
              <span v-if="location.isLoading">Saving...</span>
              <span v-else>Save Address</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div v-if="currentOrder" class="mb-8">
        <div class="bg-[#121A1D] rounded-lg p-6">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h3 class="text-lg font-semibold text-white">Order #{{ currentOrder.orderId }}</h3>
              <p class="text-[#D1D5DB]">
                {{ currentOrder.orderLists.reduce((sum, item) => sum + item.quantity, 0) }} items •
                ₱{{ (currentOrder.orderTotal ?? 0).toFixed(2) }}
              </p>
            </div>
            <button
              @click="trackOrder"
              class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-medium mt-4 lg:mt-0"
            >
              Track Order
            </button>
          </div>

          <div class="relative mb-6">
            <div class="absolute top-4 left-4 right-4 h-0.5 bg-white/10"></div>
            <div
              class="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-300"
              :style="progressLineStyle"
            ></div>

            <div class="relative grid grid-cols-5">
              <div
                v-for="(step, index) in orderSteps"
                :key="step.id"
                :class="[
                  'relative flex flex-col items-center text-center gap-1',
                  index === 0 ? 'justify-self-start items-start' : '',
                  index === orderSteps.length - 1 ? 'justify-self-end items-end' : '',
                ]"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium self-center"
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
                <span
                  :class="[
                    'mt-1 text-xs text-[#D1D5DB]',
                    index === 0 ? 'self-start text-left' : '',
                    index === orderSteps.length - 1 ? 'self-end text-right' : '',
                  ]"
                >
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>

          <p class="text-[#D1D5DB]">
            Estimated delivery: {{ currentOrder.orderEstimate ?? 'TBD' }}
          </p>
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
        <div v-if="favoritePizzas.length === 0" class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div
              class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Heart class="w-12 h-12 text-gray-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">You have no favorites yet</h3>
            <p class="text-gray-600 mb-6">
              Start exploring our menu and add your favorite pizzas to see them here!
            </p>
            <router-link
              to="/menu"
              class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Browse Menu
            </router-link>
          </div>
        </div>

        <!-- Favorites grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in favoritePizzas"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="router.push(`/product/${item.pizzaId}`)"
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
                @click.stop="toggleFavorite(item.pizzaId!)"
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
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="text-sm text-[#D1D5DB] ml-1">
                    {{
                      item.averageRating && item.averageRating > 0
                        ? `${item.averageRating} (${item.totalRatings})`
                        : '0 (0)'
                    }}
                  </span>
                </div>
                <span class="text-lg font-bold text-primary">₱{{ item.pizzaPrice }}</span>
              </div>
              <button
                :disabled="!item.isAvailable || inCart(item.pizzaId!)"
                @click.stop="addToCart(item)"
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
      </section>

      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Today's Specials</h2>
          <router-link to="/menu" class="text-primary hover:text-primary/80 font-medium">
            View All Menu
          </router-link>
        </div>
        <!-- Empty state for today's specials -->
        <div v-if="pizza.pizzas.filter((p) => !p.isDeleted).length === 0" class="text-center py-16">
          <div class="max-w-md mx-auto">
            <div
              class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Star class="w-12 h-12 text-gray-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No specials today</h3>
            <p class="text-gray-600 mb-6">
              Our admin hasn't added any special offers for today. Check back later or explore our
              regular menu!
            </p>
            <router-link
              to="/menu"
              class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Browse Menu
            </router-link>
          </div>
        </div>

        <!-- Today's specials grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="item in pizza.pizzas.filter((p) => !p.isDeleted).slice(0, 4)"
            :key="item.pizzaId!"
            class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="router.push(`/product/${item.pizzaId}`)"
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
                @click.stop="toggleFavorite(item.pizzaId!)"
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
                <div class="flex items-center">
                  <Star class="w-4 h-4 text-yellow-400 fill-current" />
                  <span class="text-sm text-[#D1D5DB] ml-1">
                    {{
                      item.averageRating && item.averageRating > 0
                        ? `${item.averageRating} (${item.totalRatings})`
                        : '0 (0)'
                    }}
                  </span>
                </div>
                <span class="text-lg font-bold text-primary">₱{{ item.pizzaPrice }}</span>
              </div>
              <button
                :disabled="!item.isAvailable || inCart(item.pizzaId!)"
                @click.stop="addToCart(item)"
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
      </section>
    </main>

    <Footer />
  </div>
</template>
