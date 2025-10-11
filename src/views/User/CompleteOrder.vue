<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { usePizzaStore } from '@/stores/pizza'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { Trash2, Edit } from 'lucide-vue-next'
import { toBase64 } from '@/plugins/convert'

const cart = useCartStore()
const auth = useAuthStore()
const orders = useOrdersStore()
const pizza = usePizzaStore()
const router = useRouter()

// Addresses stored locally; keep simple shape { id, address, isDefault }
const addresses = ref<Array<{ id: string; address: string; isDefault?: boolean }>>(
  JSON.parse(localStorage.getItem('addresses') || '[]'),
)
const selectedAddressId = ref<string | null>(
  addresses.value.find((a) => a.isDefault)?.id ?? addresses.value[0]?.id ?? null,
)
const instructions = ref('')

// Get cart items with pizza details
const cartItemsWithDetails = computed(() => {
  return cart.cart.map(cartItem => {
    const pizzaItem = pizza.pizzas.find(p => p.pizzaId === cartItem.pizzaId)
    return {
      ...cartItem,
      pizza: pizzaItem
    }
  }).filter(item => item.pizza) // Only include items where pizza details exist
})

const subtotal = computed(() => {
  return cartItemsWithDetails.value.reduce((total, item) => {
    return total + (item.pizza?.pizzaPrice || 0) * item.quantity
  }, 0)
})

const deliveryFee = computed(() => 50) // Fixed delivery fee

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

const placeOrder = async () => {
  if (!cartItemsWithDetails.value.length) return alert('Your cart is empty')
  if (!selectedAddressId.value) return alert('Please select a delivery address or add one')

  const addr = addresses.value.find((a) => a.id === selectedAddressId.value)!

  const order = {
    id: 'ORD-' + Date.now(),
    customerName: auth.user?.name || auth.user?.userName || 'Guest',
    phone: auth.user?.phone || auth.user?.phoneNumber || '',
    dateTime: new Date().toISOString(),
    address: addr.address,
    instructions: instructions.value,
    items: cartItemsWithDetails.value.map((item) => ({ 
      name: item.pizza?.pizzaName, 
      quantity: item.quantity, 
      price: item.pizza?.pizzaPrice 
    })),
    subtotal: subtotal.value,
    deliveryFee: deliveryFee.value,
    total: total.value,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // push to orders store and persist in localStorage as simple implementation
  orders.orders.push(order as any)
  localStorage.setItem('orders', JSON.stringify(orders.orders))

  await cart.clearCart()
  alert('Order placed successfully')
  router.push('/dashboard')
}

onMounted(async () => {
  // Fetch cart and pizza data
  await cart.fetchCart()
  await pizza.fetchAll()
  
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
      <!-- Header Section -->
      <div class="w-screen px-4 sm:px-8 lg:px-30 mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
        <p class="text-gray-600 text-lg">
          Review your items and complete your delivery details
        </p>
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
                v-for="item in cartItemsWithDetails"
                :key="item.pizzaId"
                class="bg-gray-800 rounded-lg p-4"
              >
                <!-- 2-Column Layout: Picture + Details -->
                <div class="flex gap-3">
                  <!-- Column 1: Picture -->
                  <div class="w-12 h-12 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      v-if="item.pizza?.pizzaImage"
                      :src="toBase64(item.pizza.pizzaImage as string)"
                      :alt="item.pizza.pizzaName"
                      class="w-full h-full object-cover"
                      @error="
                        (e: Event) => {
                          const img = e.target as HTMLImageElement
                          img.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='
                        }
                      "
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-white">🍕</div>
                  </div>
                  
                  <!-- Column 2: Details (3 rows) -->
                  <div class="flex-1">
                    <!-- Row 1: Title -->
                    <div class="font-medium text-white mb-1">{{ item.pizza?.pizzaName }}</div>
                    
                    <!-- Row 2: Description -->
                    <div class="text-xs text-gray-300 mb-2">{{ item.pizza?.pizzaDescription || '' }}</div>
                    
                    <!-- Row 3: Quantity Controls + Delete Icon -->
                    <div class="flex items-center justify-between">
                      <!-- Quantity Controls -->
                      <div class="flex items-center gap-2">
                         <button
                           @click="cart.updateCart(item.pizzaId, item.quantity - 1)"
                           class="bg-primary hover:bg-primary/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                         >
                           -
                         </button>
                         <span class="px-3 py-1 bg-gray-700 rounded text-white font-medium">{{ item.quantity }}</span>
                         <button
                           @click="cart.updateCart(item.pizzaId, item.quantity + 1)"
                           class="bg-primary hover:bg-primary/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                         >
                           +
                         </button>
                      </div>
                      
                      <!-- Delete Icon -->
                      <button 
                        @click="cart.removeFromCart(item.pizzaId)" 
                        class="p-1 hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <Trash2 class="w-4 h-4 text-red-500" />
                      </button>
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
          <div class="bg-white rounded-lg p-6 shadow mb-6 border" style="border-color: #E5E7EB;">
            <h3 class="font-semibold mb-4">Choose Delivery Address</h3>

            <div v-if="addresses.length" class="space-y-3">
               <div
                 v-for="a in addresses"
                 :key="a.id"
                 class="flex items-center justify-between p-4 border rounded-lg shadow-sm"
                 :class="selectedAddressId === a.id ? 'border-2 border-primary bg-primary/5' : 'border'"
                 :style="selectedAddressId === a.id ? '' : 'border-color: #E5E7EB;'"
               >
                <label class="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    :value="a.id" 
                    v-model="selectedAddressId" 
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" 
                  />
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{{ a.address }}</div>
                    <div v-if="a.isDefault" class="inline-block mt-1">
                      <span class="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">Default</span>
                    </div>
                    <button
                      v-if="!a.isDefault"
                      @click="setDefault(a.id)"
                      class="text-sm text-primary hover:text-primary/80 mt-1"
                    >
                      Set as Default
                    </button>
                  </div>
                </label>
                <div class="flex items-center gap-2">
                  <button 
                    @click="startEdit(a)" 
                    class="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit class="w-4 h-4 text-gray-600 hover:text-gray-800" />
                  </button>
                  <button 
                    @click="removeAddress(a.id)" 
                    class="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Trash2 class="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-gray-500 mb-4">No saved addresses. Please add one.</div>

             <div class="mt-4">
               <div class="border-2 border-dashed rounded-lg p-4 flex justify-center" style="border-color: #E5E7EB;">
                 <button @click="startAdd" class="bg-primary text-white px-4 py-2 rounded-lg font-medium">
                   + Add New Address
                 </button>
               </div>
             </div>
          </div>

          <div class="bg-white rounded-lg p-6 shadow mb-6 border" style="border-color: #E5E7EB;">
            <h3 class="font-semibold mb-4">Special Instructions</h3>
            <textarea
              v-model="instructions"
              rows="4"
              class="w-full border rounded p-3 text-sm"
              style="border-color: #E5E7EB;"
              placeholder="Ring doorbell twice. Leave at front door if no answer."
            ></textarea>
          </div>

           <div class="flex gap-4">
             <button @click="placeOrder" class="bg-primary text-white px-6 py-3 rounded-lg font-medium">
               Place Order
             </button>
             <router-link
               to="/menu"
               class="border border-primary text-primary px-6 py-3 rounded-lg font-medium"
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
             <button @click="submitAddress" class="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
