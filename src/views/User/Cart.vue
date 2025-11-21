<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import router from '@/router'
import { ShoppingCart, Trash2, Plus, Minus, Heart } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
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
import { MoreHorizontal, Edit, Star } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import { useFavoriteStore } from '@/stores/favorite'
import { toBase64 } from '@/plugins/convert'
import { useLocationStore } from '@/stores/location'
import { barangays } from '@/data/barangay'
import type { Location } from '@/models/location'
import { useOrderStore } from '@/stores/orders'
import { sanitizePostalCode } from '@/lib/utils'

const cart = useCartStore()
const pizza = usePizzaStore()
const favorite = useFavoriteStore()
const location = useLocationStore()
const order = useOrderStore()

const cartItems = ref<
  {
    pizzaId: number
    quantity: number
  }[]
>([])

const selectedItems = ref<number[]>([])
const selectAll = ref(false)
const confirmationOpen = ref(false)
const deleteConfirmationOpen = ref(false)
const individualDeleteConfirmationOpen = ref(false)
const itemToDelete = ref<number | null>(null)
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
    selectedItems.value = cartItems.value.map((item) => item.pizzaId)
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
  selectedItems.value.forEach(async (pizzaId) => {
    await cart.removeFromCart(pizzaId)
  })
  selectedItems.value = []
  selectAll.value = false
  deleteConfirmationOpen.value = false
}

const confirmDeleteSelected = () => {
  deleteConfirmationOpen.value = true
}

const confirmDeleteIndividual = (pizzaId: number) => {
  itemToDelete.value = pizzaId
  individualDeleteConfirmationOpen.value = true
}

const deleteIndividualItem = async () => {
  if (itemToDelete.value) {
    await cart.removeFromCart(itemToDelete.value)
    individualDeleteConfirmationOpen.value = false
    itemToDelete.value = null
  }
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

const onPostalInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  locationForm.locationPostal = sanitizePostalCode(target.value)
}

const deleteAddress = async (loc: Location) => {
  await location.removeLocation(loc.locationId)
}

const setAsDefault = async (loc: Location) => {
  loc.isDefault = true
  await location.updateLocation(loc.locationId, loc)
}

const UpdateShowAddressModal = (val: boolean) => {
  showAddressModal.value = val
  if (fromSelectAddress.value) showChangeAddressModal.value = true
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
const checkout = async () => {
  order.setPendingOrder(cartItems.value.filter((c) => selectedItems.value.includes(c.pizzaId)))

  router.push('/order/complete')
}

const hasItems = computed(() => cart.cart.length > 0)

const getSelectedSubtotal = () => {
  return cartItems.value.reduce((total, item) => {
    if (!selectedItems.value.includes(item.pizzaId)) return total
    const p = pizza.pizzas.find((el) => el.pizzaId === item.pizzaId)
    if (!p) return total
    return total + p.pizzaPrice * item.quantity
  }, 0)
}

onMounted(async () => {
  cartItems.value = cart.cart
  selectedAddressId.value = location.selectedLocation?.locationId
})
onBeforeUnmount(() => {
  location.selectedLocation =
    location.locations.find((l) => l.locationId === selectedAddressId.value) ??
    location.selectedLocation
})
onBeforeMount(async () => {
  await favorite.fetchFavorites()
  await location.fetchLocations()

  console.log('locs', location.locations)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <UserHeader />

    <main
      class="w-screen flex-1 px-4 sm:px-8 lg:px-30 py-16 min-h-[calc(100vh-5rem)]"
      :class="!hasItems ? 'grid place-items-center' : ''"
    >
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

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
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
                @click="confirmDeleteSelected"
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
                  <div v-else class="w-full h-full flex items-center justify-center text-2xl">
                    🍕
                  </div>
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
                        @click="confirmDeleteIndividual(item.pizzaId!)"
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
                      <span
                        class="px-3 py-1 bg-gray-100 rounded-md min-w-[40px] text-center font-medium"
                      >
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
                  <span class="text-2xl font-bold text-primary"
                    >₱{{ (getSelectedSubtotal() + 50).toFixed(2) }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Delivery Information -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-700">Delivery to:</span>
                <button
                  @click="
                    location.selectedLocation ? openChangeAddressModal() : openChangeAddress()
                  "
                  class="text-primary hover:text-primary/80 font-medium"
                >
                  {{ location.selectedLocation ? 'Change' : 'Add Address' }}
                </button>
              </div>
              <p class="text-gray-600 text-sm mb-2">
                {{
                  location.mapLocation(location.selectedLocation ?? null) || 'Address not set yet'
                }}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Estimated Delivery:</span>
                <span class="text-green-600 font-medium">{{ estimatedDelivery }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <Button
                :disabled="selectedItems.length === 0"
                @click="confirmationOpen = true"
                class="h-12 w-full text-white py-3 rounded-lg font-medium transition-colors"
              >
                Checkout ({{ selectedItems.length }})
              </Button>
              <router-link to="/menu">
                <Button
                  variant="outline"
                  class="h-12 w-full border border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Continue Shopping
                </Button>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>

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
            class="flex items-center justify-between p-3 border rounded relative"
          >
            <label class="flex items-center gap-3 flex-1">
              <input type="radio" :value="a.locationId" v-model="selectedAddressId" class="radio" />
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
                <Button variant="ghost" class="h-8 w-8 p-0">
                  <span class="sr-only">Open menu</span>
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEditAddress(a)">
                  <Edit class="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem @click="deleteAddress(a)" class="text-red-600 focus:text-red-600">
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

        <!-- Buttons -->
        <div class="flex justify-between gap-3">
          <Button
            class="w-[calc(50%-6px)] h-12"
            variant="outline"
            @click="showChangeAddressModal = false"
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
                maxlength="4"
                inputmode="numeric"
                pattern="\d*"
                @input="onPostalInput"
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

    <Dialog v-model:open="confirmationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Checkout</DialogTitle>
        </DialogHeader>
        <div>
          Would you like to proceed to checkout? You will be redirected to complete your order
          details.
        </div>
        <DialogFooter class="flex justify-end space-x-2">
          <Button variant="outline" @click="confirmationOpen = false">Cancel</Button>
          <Button @click="checkout">Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog v-model:open="deleteConfirmationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Items</DialogTitle>
        </DialogHeader>
        <div>
          Are you sure you want to delete {{ selectedItems.length }} selected item(s) from your
          cart? This action cannot be undone.
        </div>
        <DialogFooter class="flex justify-end space-x-2">
          <Button variant="outline" @click="deleteConfirmationOpen = false">Cancel</Button>
          <Button @click="deleteSelected" class="bg-red-500 hover:bg-red-600">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Individual Item Delete Confirmation Modal -->
    <Dialog v-model:open="individualDeleteConfirmationOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
        </DialogHeader>
        <div>
          Are you sure you want to remove this item from your cart? This action cannot be undone.
        </div>
        <DialogFooter class="flex justify-end space-x-2">
          <Button variant="outline" @click="individualDeleteConfirmationOpen = false"
            >Cancel</Button
          >
          <Button @click="deleteIndividualItem" class="bg-red-500 hover:bg-red-600">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Footer />
  </div>
</template>
