<script setup lang="ts">
import { ref, computed, onMounted, reactive, onBeforeUnmount, onBeforeMount } from 'vue'
import { useCartStore } from '@/stores/cart'
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
import { MoreHorizontal, Edit, Star, Trash2 } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import { toBase64 } from '@/plugins/convert'
import { useLocationStore } from '@/stores/location'
import { barangays } from '@/data/barangay'
import type { Location } from '@/models/location'
import { useOrderStore } from '@/stores/orders'
import router from '@/router'

const cart = useCartStore()
const pizza = usePizzaStore()
const location = useLocationStore()
const order = useOrderStore()
const cartItems = ref<
  {
    pizzaId: number
    quantity: number
  }[]
>([])
const selectedAddressId = ref(0)
const showAddressModal = ref(false)
const isEdit = ref(false)

const instructions = ref('')

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
  isEdit.value = true
}

const pizzasInCart = computed(() =>
  order.pendingOrder
    .map((c) => {
      const p = pizza.pizzas.find((p) => p.pizzaId === c.pizzaId)
      return p ? { ...p, quantity: c.quantity } : null
    })
    .filter(Boolean),
)

const subtotal = computed(() => {
  const items = cartItems.value

  return items.reduce((total, item) => {
    const pizzaItem = pizza.pizzas.find((p) => p.pizzaId === item.pizzaId)
    if (!pizzaItem) return total
    return total + pizzaItem.pizzaPrice * item.quantity
  }, 0)
})
const deliveryFee = computed(() => 50) // Fixed delivery fee of 50 pesos
const total = computed(() => subtotal.value + deliveryFee.value)

const formatCurrency = (v: number) => `₱${v.toLocaleString()}`

const saveAddress = async () => {
  if (isEdit.value) {
    const res = await location.updateLocation(locationForm.locationId, locationForm)
    if (res) {
      showAddressModal.value = false
      isEdit.value = false
    }
  } else {
    const res = await location.addLocation(locationForm)
    if (res) showAddressModal.value = false
  }
}
const deleteAddress = async (loc: Location) => {
  await location.removeLocation(loc.locationId)
}

const setAsDefault = async (loc: Location) => {
  loc.isDefault = true
  await location.updateLocation(loc.locationId, loc)
}

const placeOrder = async () => {
  const currentOrder = {
    locationId: selectedAddressId.value,
    orderInstruction: instructions.value,
    orderStatus: 'pending',
    orderEstimate: estimatedDelivery.value,
    orderLists: order.pendingOrder,
  }

  await order.createOrder(currentOrder)
}

const backToMenu = () => {
  router.push('/menu')
}
onBeforeUnmount(() => {
  order.setPendingOrder([])
})
onBeforeMount(() => {
  if (!order.pendingOrder.length) return router.push('/cart')
})
onMounted(() => {
  cartItems.value = order.pendingOrder
  console.log('locs', location.locations)
  selectedAddressId.value = location.selectedLocation?.locationId ?? 0
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
  order.setPendingOrder(
    order.pendingOrder.map((c) =>
      pizzaId === c.pizzaId ? { pizzaId: c.pizzaId, quantity: c.quantity + 1 } : c,
    ),
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
  order.setPendingOrder(
    order.pendingOrder.map((c) =>
      pizzaId === c.pizzaId ? { pizzaId: c.pizzaId, quantity: c.quantity - 1 } : c,
    ),
  )
  if (removeUpdateTimeout.value) clearTimeout(removeUpdateTimeout.value)

  removeUpdateTimeout.value = setTimeout(async () => {
    await decrease(pizzaId, cartItems.value.find((c) => c.pizzaId === pizzaId)!.quantity)
  }, delay)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserHeader />

    <div class="py-8 min-h-[calc(100vh-5rem)]">
      <!-- Header Section -->
      <div class="w-screen px-4 sm:px-8 lg:px-30 mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
        <p class="text-gray-600 text-lg">Review your items and complete your delivery details</p>
      </div>

      <!-- Two Column Layout -->
      <div class="w-screen px-4 sm:px-8 lg:px-30 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left: Order summary -->
        <div class="lg:col-span-2">
          <div class="bg-[#121A1D] text-white rounded-lg p-6 shadow">
            <h3 class="text-white font-semibold mb-4">Your Order</h3>

            <!-- Pizza Items -->
            <div class="space-y-3 mb-4">
              <div
                v-for="item in pizzasInCart"
                :key="item?.pizzaId!"
                class="bg-gray-800 rounded-lg p-4"
              >
                <!-- 2-Column Layout: Picture + Details -->
                <div class="flex gap-3">
                  <!-- Column 1: Picture -->
                  <div class="size-21 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      v-if="item?.pizzaImage"
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
                    <div v-else class="w-full h-full flex items-center justify-center text-white">
                      🍕
                    </div>
                  </div>

                  <!-- Column 2: Details (3 rows) -->
                  <div class="flex-1">
                    <!-- Row 1: Title -->
                    <div class="font-medium text-white mb-1">{{ item?.pizzaName }}</div>

                    <!-- Row 2: Description -->
                    <div class="text-xs text-gray-300 mb-2">
                      {{ item?.pizzaDescription || '' }}
                    </div>

                    <!-- Row 3: Quantity Controls + Delete Icon -->
                    <div class="flex items-center justify-between">
                      <!-- Quantity Controls -->
                      <div class="flex items-center gap-2">
                        <button
                          @click="removeCount(item?.pizzaId!)"
                          class="bg-primary hover:bg-primary/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span class="px-3 py-1 bg-gray-700 rounded text-white font-medium">{{
                          cartItems.find((c) => c.pizzaId === item?.pizzaId)?.quantity || 1
                        }}</span>
                        <button
                          @click="addCount(item?.pizzaId!)"
                          class="bg-primary hover:bg-primary/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div class="flex items-center gap-2">
                        <div class="font-semibold">
                          ₱{{
                            item?.pizzaPrice! *
                            (cartItems.find((c) => c.pizzaId === item?.pizzaId)?.quantity || 1)
                          }}
                        </div>
                        <!-- Delete Icon -->
                        <button
                          @click="cart.removeFromCart(item?.pizzaId!)"
                          class="p-1 hover:bg-gray-700 rounded-full transition-colors"
                        >
                          <Trash2 class="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-gray-300">
                  <span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="flex justify-between text-gray-300">
                  <span>Delivery Fee</span><span>{{ formatCurrency(deliveryFee) }}</span>
                </div>
                <div class="border-t border-gray-600 pt-2">
                  <div class="flex justify-between font-semibold text-primary text-lg">
                    <span>Total Amount</span><span>{{ formatCurrency(total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Delivery address and instructions -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-lg p-6 shadow mb-6 border" style="border-color: #e5e7eb">
            <h3 class="font-semibold mb-4">Choose Delivery Address</h3>

            <div v-if="location.locations.length" class="space-y-3">
              <div
                v-for="a in location.locations"
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
              <div
                class="border-2 border-dashed rounded-lg p-4 flex justify-center"
                style="border-color: #e5e7eb"
              >
                <Button
                  @click="openChangeAddress"
                  class="h-12 bg-primary text-white px-4 py-2 rounded-lg font-medium"
                >
                  + Add New Address
                </Button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg p-6 shadow mb-6 border" style="border-color: #e5e7eb">
            <h3 class="font-semibold mb-4">Special Instructions</h3>
            <textarea
              v-model="instructions"
              rows="4"
              class="w-full border rounded p-3 text-sm"
              style="border-color: #e5e7eb"
              placeholder="Ring doorbell twice. Leave at front door if no answer."
            ></textarea>
          </div>

          <div class="flex gap-4">
            <Button @click="placeOrder" class="h-12 px-6 py-3 rounded-lg font-medium">
              Place Order
            </Button>
            <Button
              variant="outline"
              @click="backToMenu"
              class="h-12 px-6 py-3 rounded-lg font-medium"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>

      <!-- Change address modal -->
      <Dialog v-model:open="showAddressModal">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{{ !isEdit ? 'Add' : 'Update' }} Delivery Address</DialogTitle>
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
    </div>
    <Footer />
  </div>
</template>
