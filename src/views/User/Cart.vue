<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShoppingCart, Trash2, Plus, Minus, Bell, User, ChevronDown } from 'lucide-vue-next'

const cart = useCartStore()
const router = useRouter()
const auth = useAuthStore()

const displayName = computed(() => {
  const u = auth.user
  return u?.name || u?.userName || u?.username || 'Guest'
})

const increase = (item: any) => cart.updateQuantity(item.id, (item.quantity || 1) + 1)
const decrease = (item: any) => cart.updateQuantity(item.id, (item.quantity || 1) - 1)

const checkout = () => {
  // placeholder - in real app you'd call API
  alert(`Checkout - Total: ₱${cart.total.toFixed(2)}`)
  cart.clear()
  router.push('/dashboard')
}

const hasItems = computed(() => cart.items.length > 0)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-gray-900 shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex items-center space-x-2">
              <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto">
            </div>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link to="/dashboard" class="text-white hover:text-orange-500">Dashboard</router-link>
            <router-link to="/menu" class="text-white hover:text-orange-500">Menu</router-link>
            <router-link to="/orders" class="text-white hover:text-orange-500">Orders</router-link>
            <router-link to="/favorites" class="text-white hover:text-orange-500">Favorites</router-link>
          </nav>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            <router-link to="/cart" class="relative p-2 text-white hover:text-orange-500">
              <ShoppingCart class="w-6 h-6" />
              <span v-if="cart.itemCount > 0" class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{{ cart.itemCount }}</span>
            </router-link>
            <button class="p-2 text-white hover:text-orange-500 relative">
              <Bell class="w-6 h-6" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <router-link to="/settings" class="flex items-center space-x-2 text-white hover:text-orange-300">
              <User class="w-6 h-6 text-white" />
              <span class="text-white font-medium">{{ displayName }}</span>
              <ChevronDown class="w-4 h-4 text-white" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div v-if="!hasItems" class="text-center py-12">
          <ShoppingCart class="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p class="text-gray-600 mb-6">Add items from the menu to begin your order.</p>
          <router-link to="/menu" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">Browse Menu</router-link>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div v-for="item in cart.items" :key="item.id" class="flex items-center gap-4 p-4 border-b last:border-b-0">
              <img :src="item.image" alt="" class="w-20 h-20 object-cover rounded" />
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900">{{ item.name }}</h4>
                <p class="text-sm text-gray-600">₱{{ item.price.toFixed(2) }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <button @click="decrease(item)" class="p-2 bg-gray-100 rounded"><Minus class="w-4 h-4"/></button>
                  <span class="px-3">{{ item.quantity }}</span>
                  <button @click="increase(item)" class="p-2 bg-gray-100 rounded"><Plus class="w-4 h-4"/></button>
                  <button @click="cart.removeItem(item.id)" class="ml-4 text-red-500"><Trash2 class="w-4 h-4"/></button>
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold">₱{{ (item.price * (item.quantity || 1)).toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <aside class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-semibold mb-4">Order Summary</h3>
            <div class="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span>₱{{ cart.subTotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-700 mb-2">
              <span>Delivery</span>
              <span>₱{{ cart.deliveryFee.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-900 text-lg mb-4">
              <span>Total</span>
              <span>₱{{ cart.total.toFixed(2) }}</span>
            </div>
            <button @click="checkout" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium">Checkout</button>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>
