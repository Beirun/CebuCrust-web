<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Clock, ConciergeBell, CookingPot, Pizza, Truck, X } from 'lucide-vue-next'
import { Search } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
const cart = useCartStore()
const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()

const selectedStatus = ref('all')
const searchQuery = ref('')
const sortBy = ref('')
const categoryFilter = ref('all')

const subtotal = computed(() => {
  const items = cart.cart || []
  return items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0)
})
const deliveryFee = computed(() => 50) // Fixed delivery fee of 50 pesos
const total = computed(() => subtotal.value + deliveryFee.value)

const formatCurrency = (v: number) => `₱${v.toLocaleString()}`

const saveAddresses = () => {
  localStorage.setItem('addresses', JSON.stringify(addresses.value))
}

const openAdd = ref(false)
const editing = ref<{ id?: string; address?: string } | null>(null)
const addressInput = ref('')

const startAdd = () => {
  editing.value = null
  addressInput.value = ''
  openAdd.value = true
}

const startEdit = (a: { id: string; address: string }) => {
  editing.value = { ...a }
  addressInput.value = a.address
  openAdd.value = true
}

const removeAddress = (id: string) => {
  addresses.value = addresses.value.filter((a) => a.id !== id)
  if (selectedAddressId.value === id) selectedAddressId.value = addresses.value[0]?.id ?? null
  saveAddresses()
}

const setDefault = (id: string) => {
  addresses.value = addresses.value.map((a) => ({ ...a, isDefault: a.id === id }))
  selectedAddressId.value = id
  saveAddresses()
  // update auth store local user address shortcut
  const addr = addresses.value.find((a) => a.id === id)
  if (addr) {
    auth.user = { ...auth.user, address: addr.address }
    localStorage.setItem('user', JSON.stringify(auth.user))
  }
}

const submitAddress = () => {
  const trimmed = addressInput.value.trim()
  if (!trimmed) return
  if (editing.value && editing.value.id) {
    addresses.value = addresses.value.map((a) =>
      a.id === editing.value!.id ? { ...a, address: trimmed } : a,
    )
  } else {
    const id = Date.now().toString()
    addresses.value.push({ id, address: trimmed, isDefault: addresses.value.length === 0 })
    if (addresses.value.length === 1) selectedAddressId.value = id
  }
  saveAddresses()
  openAdd.value = false
}

const placeOrder = () => {
  if (!cart.cart.length) return alert('Your cart is empty')
  if (!selectedAddressId.value) return alert('Please select a delivery address or add one')

  const addr = addresses.value.find((a) => a.id === selectedAddressId.value)!
  const cartArr = cart.cart

  const order: Order = {
    id: 'ORD-' + Date.now(),
    customerName: auth.user?.name || auth.user?.userName || 'Guest',
    phone: auth.user?.phone || auth.user?.phoneNumber || '',
    dateTime: new Date().toISOString(),
    address: addr.address,
    instructions: instructions.value,
    items: cartArr.map((i) => ({
      name: i.name || `Pizza ${i.pizzaId}`,
      quantity: i.quantity || 1,
      price: i.price || 0
    })),
    subtotal: subtotal.value,
    deliveryFee: deliveryFee.value,
    total: total.value,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // push to orders store and persist in localStorage as simple implementation
  orders.orders.push(order)
  localStorage.setItem('orders', JSON.stringify(orders.orders))

  // Clear cart by removing all items
  for (const item of cart.cart) {
    cart.removeFromCart(item.pizzaId)
  }
  alert('Order placed successfully')
  router.push('/dashboard')
}

onMounted(() => {
  // bootstrap addresses: if user has address in auth.user, seed it
  if (!addresses.value.length && auth.user?.address) {
    const id = Date.now().toString()
    addresses.value.push({ id, address: auth.user.address, isDefault: true })
    selectedAddressId.value = id
    saveAddresses()
  }

  order.orders.forEach((order) => {
    counts[order.orderStatus as keyof typeof counts]++
  })

  return counts
})

const statusTabs = computed(() => [
  { key: 'all', label: 'All Orders', count: null },
  { key: 'pending', label: 'Pending', count: statusCounts.value.pending },
  { key: 'preparing', label: 'Preparing', count: statusCounts.value.preparing },
  { key: 'ready', label: 'Ready', count: statusCounts.value.ready },
  {
    key: 'out for delivery',
    label: 'Out for Delivery',
    count: statusCounts.value.out_for_delivery,
  },
  { key: 'delivered', label: 'Delivered', count: statusCounts.value.delivered },
  { key: 'cancelled', label: 'Cancelled', count: statusCounts.value.cancelled },
])
const getTabCountClass = (tabKey: string) => {
  switch (tabKey) {
    case 'pending':
      return 'bg-orange-100 text-orange-800'
    case 'preparing':
      return 'bg-blue-100 text-blue-800'
    case 'ready':
      return 'bg-blue-100 text-blue-800'
    case 'out for delivery':
      return 'bg-green-100 text-green-800'
    case 'delivered':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
const filteredOrders = computed(() => {
  let filtered = order.orders

  // Filter by pizza category
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter((order) => 
      order.orderLists.some((item) => {
        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
        const cat = (p?.pizzaCategory || '').toString().toLowerCase()
        return cat === categoryFilter.value.toLowerCase()
      })
    )
  }

  // Filter by status tabs (existing functionality)
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((order) => order.orderStatus === selectedStatus.value)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(
      (order) =>
        order.orderId.toString().includes(searchQuery.value.toLowerCase()) ||
        (order.firstName + ' ' + order.lastName)
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase()) ||
        order.orderLists.some((item) => {
          const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
          return p?.pizzaName.toLowerCase().includes(searchQuery.value.toLowerCase())
        }),
    )
  }

  // Sort orders
  if (sortBy.value) {
    switch (sortBy.value) {
      case 'order-number':
        filtered.sort((a, b) => (b.orderId || 0) - (a.orderId || 0)) // Newest first
        break
      case 'order-date':
        filtered.sort((a, b) => {
          const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
          const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
          return dateB - dateA // Newest first
        })
        break
      case 'price-low':
        filtered.sort((a, b) => (a.orderTotal || 0) - (b.orderTotal || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.orderTotal || 0) - (a.orderTotal || 0))
        break
    }
  }

  return filtered
})

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'ready':
      return 'bg-blue-100 text-blue-800'
    case 'preparing':
      return 'bg-yellow-100 text-yellow-800'
    case 'pending':
      return 'bg-purple-100 text-purple-800'
    case 'out for delivery':
      return 'bg-pink-100 text-pink-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return ConciergeBell
    case 'preparing':
      return CookingPot
    case 'pending':
      return Clock
    case 'out for delivery':
      return Truck
    case 'delivered':
      return Check
    case 'cancelled':
      return X
    default:
      return Pizza
  }
}

const formatStatus = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'preparing':
      return 'Preparing'
    case 'ready':
      return 'Ready'
    case 'out for delivery':
      return 'Out for Delivery'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

const handleCancelOrder = async (id: number) => {
  await order.updateOrderStatus(id, 'cancelled')
  cancelConfirmationOpen.value = false
}

const handleModifyOrder = (currentOrder: Order) => {
  order.setPendingOrder(currentOrder.orderLists as Cart[])
  router.push('/order/modify/' + currentOrder.orderId)
}

const handleReorder = (currentOrder: Order) => {
  // Set the pending order with the same items from the previous order
  order.setPendingOrder(currentOrder.orderLists as Cart[])
  // Navigate to complete order page
  router.push('/order/complete')
}

const clearAllFilters = () => {
  searchQuery.value = ''
  categoryFilter.value = 'all'
  sortBy.value = ''
}

onBeforeMount(async () => {
  await order.fetchUserOrders()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserHeader />

    <div class="py-8">
      <div class="w-screen px-4 sm:px-8 lg:px-30 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Order summary -->
        <div class="lg:col-span-1">
          <div class="bg-gray-900 text-white rounded-lg p-6 shadow">
            <h2 class="text-xl font-semibold mb-4">Complete Your Order</h2>
            <p class="text-gray-300 text-sm mb-6">
              Review your items and complete your delivery details
            </p>

      <!-- Search, Filter and Sort -->
      <div class="flex items-center gap-4 mb-6">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by order number, pizza name..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 w-full"
          />
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <div class="flex gap-2">
          <select
            v-model="categoryFilter"
            class="px-4 py-2 h-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-transparent"
          >
            <option value="all">All Categories</option>
            <option value="veggie">Veggie</option>
            <option value="meat-lovers">Meat Lovers</option>
            <option value="premium-specials">Premium Specials</option>
            <option value="seasonal-picks">Seasonal Picks</option>
          </select>
          <div class="lg:w-48">
            <select
              v-model="sortBy"
              class="w-full px-4 py-2 h-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-transparent"
            >
              <option value="" disabled>Sort by</option>
              <option value="order-number">Order Number</option>
              <option value="order-date">Order Date</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div v-for="o in filteredOrders" :key="o.orderId" class="bg-white rounded-lg shadow">
          <Card class="w-full rounded-xl shadow-sm border-0 bg-white">
            <CardHeader class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-sm">ORDER #{{ o.orderId }}</p>
                <p class="text-xs text-gray-500">{{ toDate(o.dateCreated as Date) }}</p>
              </div>
              <Badge
                :class="[
                  getStatusBadgeClass(o.orderStatus!),
                  'px-4 py-2 rounded-full flex items-center space-x-1 ',
                ]"
              >
                <component :is="getStatusIcon(o.orderStatus!)" class="w-3 h-3 mr-1" />
                {{ formatStatus(o.orderStatus!) }}
              </Badge>
            </CardHeader>

            <CardContent
              v-for="po in o.orderLists?.map((item) => {
                const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                return {
                  pizzaId: item.pizzaId,
                  pizzaName: p?.pizzaName,
                  quantity: item.quantity,
                  pizzaPrice: p?.pizzaPrice,
                  pizzaImage: p?.pizzaImage,
                }
              })"
              :key="po.pizzaId"
              class="flex items-center gap-2 py-2"
            >
              <img
                :src="toBase64(po.pizzaImage as string)"
                alt="Hawaiian Delight"
                class="size-20 rounded-md object-cover"
              />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ po.pizzaName }}</p>
                <p class="text-xs text-gray-500">Qty: {{ po.quantity }}</p>
                <p class="text-sm font-semibold mt-1">₱{{ po.quantity * po.pizzaPrice! }}</p>
              </div>
            </CardContent>

            <div class="w-full grid place-items-center">
              <Separator class="max-w-[97%]" />
            </div>
            <CardFooter class="flex justify-between items-center py-3">
              <div>
                <p class="text-xs text-gray-500">{{ o.orderLists.length }} item</p>
                <p
                  class="font-semibold"
                  :class="o.orderStatus === 'cancelled' ? 'line-through' : ''"
                >
                  ₱{{
                    o.orderLists.reduce((total, item) => {
                      const p = pizza.pizzas.find((el) => el.pizzaId === item.pizzaId)
                      if (!p) return total
                      return total + p.pizzaPrice * item.quantity
                    }, 0)
                  }}
                </p>
              </div>
              <div v-if="o.orderStatus === 'pending'" class="space-x-4">
                <!-- Confirm Cancel Dialog -->
                <Dialog v-model:open="cancelConfirmationOpen">
                  <DialogTrigger>
                    <Button variant="outline" class="h-12 rounded-md px-4 py-2"> Cancel </Button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cancel Order</DialogTitle>
                    </DialogHeader>
                    <div>Are you sure you want to cancel this order?</div>
                    <div
                      v-for="po in o.orderLists?.map((item) => {
                        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                        return {
                          pizzaId: item.pizzaId,
                          pizzaName: p?.pizzaName,
                          quantity: item.quantity,
                          pizzaPrice: p?.pizzaPrice,
                          pizzaImage: p?.pizzaImage,
                        }
                      })"
                      :key="po.pizzaId"
                      class="flex items-center gap-4 py-2"
                    >
                      <img
                        :src="toBase64(po.pizzaImage as string)"
                        alt="Hawaiian Delight"
                        class="size-16 rounded-md object-cover"
                      />
                      <div class="flex-1">
                        <p class="font-medium text-sm">{{ po.pizzaName }}</p>
                        <p class="text-xs text-gray-500">Qty: {{ po.quantity }}</p>
                        <p class="text-sm font-semibold mt-1">
                          ₱{{ po.quantity * po.pizzaPrice! }}
                        </p>
                      </div>
                    </div>
                    <DialogFooter class="flex justify-end space-x-2">
                      <Button variant="outline" @click="cancelConfirmationOpen = false">No</Button>
                      <Button @click="handleCancelOrder(o.orderId)">Yes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button @click="handleModifyOrder(o)" class="h-12 rounded-md px-4 py-2">
                  Modify Order
                </Button>
              </div>
              <div
                v-for="item in cart.cart"
                :key="item.pizzaId"
                class="flex items-center justify-between bg-gray-700 p-3 rounded mb-3"
              >
                <Button
                  v-if="o.orderStatus === 'delivered'"
                  variant="outline"
                  class="h-12 rounded-md px-4 py-2"
                >
                  Rate & Review
                </Button>
                <Button 
                  @click="handleReorder(o)" 
                  class="h-12 rounded-md px-4 py-2"
                > 
                  Reorder 
                </Button>
              </div>

              <div class="mt-4 border-t border-gray-600 pt-4 text-sm">
                <div class="flex justify-between text-gray-300 mb-2">
                  <span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="flex justify-between text-gray-300 mb-2">
                  <span>Delivery Fee</span><span>{{ formatCurrency(deliveryFee) }}</span>
                </div>
                <div class="flex justify-between font-semibold text-orange-300 text-lg">
                  <span>Total Amount</span><span>{{ formatCurrency(total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Delivery address and instructions -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg p-6 shadow mb-6 border">
            <h3 class="font-semibold mb-4">Choose Delivery Address</h3>

            <div v-if="addresses.length" class="space-y-3">
              <div
                v-for="a in addresses"
                :key="a.id"
                class="flex items-center justify-between p-3 border rounded"
              >
                <label class="flex items-center gap-3">
                  <input type="radio" :value="a.id" v-model="selectedAddressId" class="radio" />
                  <div>
                    <div class="font-medium">{{ a.address }}</div>
                    <div class="text-xs text-gray-500">{{ a.isDefault ? 'Default' : '' }}</div>
                  </div>
                </label>
                <div class="flex items-center gap-2">
                  <button @click="startEdit(a)" class="text-sm text-gray-600">✏️</button>
                  <button @click="removeAddress(a.id)" class="text-sm text-red-500">🗑️</button>
                  <button
                    v-if="!a.isDefault"
                    @click="setDefault(a.id)"
                    class="text-sm text-orange-500"
                  >
                    Set as Default
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-gray-500 mb-4">No saved addresses. Please add one.</div>

            <div class="mt-4">
              <button @click="startAdd" class="bg-orange-500 text-white px-4 py-2 rounded">
                + Add New Address
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg p-6 shadow mb-6 border">
            <h3 class="font-semibold mb-4">Special Instructions</h3>
            <textarea
              v-model="instructions"
              rows="4"
              class="w-full border rounded p-3 text-sm"
              placeholder="Ring doorbell twice. Leave at front door if no answer."
            ></textarea>
          </div>

          <div class="flex gap-4">
            <button @click="placeOrder" class="bg-orange-500 text-white px-6 py-3 rounded shadow">
              Place Order
            </button>
            <router-link
              to="/menu"
              class="border border-orange-300 text-orange-500 px-6 py-3 rounded"
              >Back to Menu</router-link
            >
          </div>
        </div>
      </div>

      <!-- Empty State - No Orders Found -->
      <div v-if="order.orders.length > 0 && filteredOrders.length === 0" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p class="text-gray-600 mb-6">
            We couldn't find any orders matching your search criteria. Try adjusting your filters.
          </p>
          <button
            @click="clearAllFilters"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear Filters
          </button>
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
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
