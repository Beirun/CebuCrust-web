// stores/cart.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { Cart } from '@/models/cart'

export const useCartStore = defineStore('cart', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const cart = ref<Cart[]>([])
  const isLoading = ref(false)

  const fetchCart = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/cart/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch cart')
      cart.value = data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching cart'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const addToCart = async (item: { pizzaId: number; quantity: number }) => {
    isLoading.value = true
    try {
      const itemCart = cart.value.find((c) => c.pizzaId === item.pizzaId)
      if (itemCart) {
        await updateCart(item.pizzaId, item.quantity + itemCart.quantity)
        sonner.success('Added to cart')
        return
      }
      const res = await useFetch(`${URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to add to cart')
      sonner.success('Added to cart')
      cart.value = [...cart.value, item]
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding to cart'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const updateCart = async (pizzaId: number, quantity: number) => {
    isLoading.value = true
    try {
      const current = cart.value.find((p) => p.pizzaId === pizzaId)
      if (!current) throw new Error('Item not found')

      const item = {
        pizzaId,
        quantity,
      }

      const res = await useFetch(`${URL}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update cart')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating cart'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const removeFromCart = async (pizzaId: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/cart/${pizzaId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to remove item')
      }
      cart.value = cart.value.filter((c) => c.pizzaId !== pizzaId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing item'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const clearCart = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/cart`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to clear cart')
      }
      sonner.success('Cart cleared')
      cart.value = []
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error clearing cart'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    cart,
    isLoading,
    fetchCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
  }
})
