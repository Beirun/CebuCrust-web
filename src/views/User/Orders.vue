<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import UserHeader from '@/components/UserHeader.vue'
import type { Order } from '@/models/order'
const cart = useCartStore()
const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()

// Addresses stored locally; keep simple shape { id, address, isDefault }
const addresses = ref<Array<{ id: string; address: string; isDefault?: boolean }>>(
  JSON.parse(localStorage.getItem('addresses') || '[]'),
)
const selectedAddressId = ref<string | null>(
  addresses.value.find((a) => a.isDefault)?.id ?? addresses.value[0]?.id ?? null,
)
const instructions = ref('')

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
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserHeader />

    <div class="py-8">
      <div class="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Order summary -->
        <div class="lg:col-span-1">
          <div class="bg-gray-900 text-white rounded-lg p-6 shadow">
            <h2 class="text-xl font-semibold mb-4">Complete Your Order</h2>
            <p class="text-gray-300 text-sm mb-6">
              Review your items and complete your delivery details
            </p>

            <div class="bg-gray-800 rounded-lg p-4">
              <h3 class="text-white font-semibold mb-4">Your Order</h3>
              <div
                v-for="item in cart.cart"
                :key="item.pizzaId"
                class="flex items-center justify-between bg-gray-700 p-3 rounded mb-3"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    class="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div class="font-medium">{{ item.name || `Pizza ${item.pizzaId}` }}</div>
                    <div class="text-xs text-gray-200">{{ item.description || '' }}</div>
                    <div class="flex items-center gap-2 mt-2">
                      <button
                        @click="cart.updateCart(item.pizzaId, (item.quantity || 1) - 1)"
                        class="bg-orange-500 text-white rounded-full w-6 h-6"
                      >
                        -
                      </button>
                      <span class="px-2">{{ item.quantity || 1 }}</span>
                      <button
                        @click="cart.updateCart(item.pizzaId, (item.quantity || 1) + 1)"
                        class="bg-orange-500 text-white rounded-full w-6 h-6"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-semibold">
                    {{ formatCurrency((item.price || 0) * (item.quantity || 1)) }}
                  </div>
                  <button @click="cart.removeFromCart(item.pizzaId)" class="text-red-400 text-sm mt-2">
                    🗑️
                  </button>
                </div>
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

      <!-- Add/Edit address modal (simple) -->
      <div
        v-if="openAdd"
        class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h4 class="font-semibold mb-4">
            {{ editing && editing.id ? 'Edit Address' : 'Add Address' }}
          </h4>
          <textarea
            v-model="addressInput"
            rows="4"
            class="w-full border rounded p-3 mb-4"
            placeholder="123 Lahug Street, Barangay Lahug, Cebu City, 6000"
          ></textarea>
          <div class="flex justify-end gap-2">
            <button @click="openAdd = false" class="px-4 py-2 border rounded">Cancel</button>
            <button @click="submitAddress" class="px-4 py-2 bg-orange-500 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
