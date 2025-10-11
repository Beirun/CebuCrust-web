<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import router from '@/router'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import { usePizzaStore } from '@/stores/pizza'
import { toBase64 } from '@/plugins/convert'
const cart = useCartStore()
const pizza = usePizzaStore()

const cartItems = ref<
  {
    pizzaId: number
    quantity: number
  }[]
>([])

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
  console.log(cartItems.value)
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

const checkout = async () => {
  const confirmed = window.confirm(
    'Would you like to proceed to checkout? You will be redirected to complete your order details.'
  )

  if (confirmed) {
    router.push('/orders')
  }
}

const hasItems = computed(() => cart.cart.length > 0)

const getSubtotal = () => {
  return cartItems.value.reduce((total, item) => {
    const pizzaItem = pizza.pizzas.find((p) => p.pizzaId === item.pizzaId)
    if (!pizzaItem) return total
    return total + pizzaItem.pizzaPrice * item.quantity
  }, 0)
}
onMounted(() => {
  cartItems.value = cart.cart
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <UserHeader />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div v-if="!hasItems" class="text-center py-12">
          <ShoppingCart class="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p class="text-gray-600 mb-6">Add items from the menu to begin your order.</p>
          <router-link
            to="/menu"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >Browse Menu</router-link
          >
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div
              v-for="item in pizza.pizzas.filter((p) =>
                cart.cart.some((c) => c.pizzaId === p.pizzaId),
              )"
              :key="item.pizzaId!"
              class="flex items-center gap-4 p-4 border-b last:border-b-0"
            >
              <img
                :src="toBase64(item.pizzaImage as string)"
                alt=""
                class="w-20 h-20 object-cover rounded"
              />
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900">{{ item.pizzaName }}</h4>
                <p class="text-sm text-gray-600">₱{{ item.pizzaPrice.toFixed(2) }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <button @click="removeCount(item.pizzaId!)" class="p-2 bg-gray-100 rounded">
                    <Minus class="w-4 h-4" />
                  </button>
                  <span class="px-3">{{
                    cartItems.find((c) => c.pizzaId === item.pizzaId)?.quantity
                  }}</span>
                  <button @click="addCount(item.pizzaId!)" class="p-2 bg-gray-100 rounded">
                    <Plus class="w-4 h-4" />
                  </button>
                  <button @click="cart.removeFromCart(item.pizzaId!)" class="ml-4 text-red-500">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold">
                  ₱{{
                    (
                      item.pizzaPrice *
                      (cartItems.find((c) => c.pizzaId === item.pizzaId)?.quantity || 1)
                    ).toFixed(2)
                  }}
                </div>
              </div>
            </div>
          </div>

          <aside class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-semibold mb-4">Order Summary</h3>
            <div class="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span>₱{{ getSubtotal().toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-700 mb-2">
              <span>Delivery</span>
              <span>₱{{ cart.cart.length > 0 ? 50 : 0 }}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-900 text-lg mb-4">
              <span>Total</span>
              <span>₱{{ (getSubtotal() + 50).toFixed(2) }}</span>
            </div>
            <button
              @click="checkout"
              class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
            >
              Checkout
            </button>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>
