// stores/order.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { Order, OrderItem } from '@/models/order'
import { usePizzaStore } from './pizza'
import { type Cart } from '@/models/cart'
import router from '@/router'
import { useCartStore } from './cart'

export const useOrderStore = defineStore('order', () => {
  const cart = useCartStore()
  const sonner = useSonnerStore()
  const pizza = usePizzaStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const orders = ref<Order[]>([])
  const isLoading = ref(false)
  const pendingOrder = ref<Cart[]>(JSON.parse(localStorage.getItem('pendingOrders') || '[]'))

  const fetchUserOrders = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch orders')
      orders.value = data.map((o: Order) => {
        const total = o.orderLists.reduce((sum, item) => {
          const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
          return sum + (p ? p.pizzaPrice * item.quantity : 0)
        }, 0)
        return { ...o, orderTotal: total }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching orders'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllOrders = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch all orders')

      console.log('data', data)
      orders.value = data.map((o: Order) => {
        const total = o.orderLists.reduce((sum, item) => {
          const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
          return sum + (p ? p.pizzaPrice * item.quantity : 0)
        }, 0)
        return { ...o, orderTotal: total }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching all orders'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const createOrder = async (order: {
    locationId: number
    orderInstruction?: string
    orderStatus?: string
    orderEstimate?: string
    orderLists: OrderItem[]
  }) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to create order')
      sonner.success('Order created')
      orders.value.push(data)
      await router.push('/orders')
      setPendingOrder([])
      order.orderLists.map(async (o) => {
        await cart.removeFromCart(o.pizzaId)
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating order'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }
  const updateOrder = async (
    orderId: number,
    order: {
      locationId: number
      orderInstruction?: string
      orderStatus?: string
      orderEstimate?: string
      orderLists: OrderItem[]
    },
  ) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to create order')
      await router.push('/orders')
      sonner.success('Order modified')
      setPendingOrder([])
      const i = orders.value.findIndex((o) => o.orderId === orderId)
      if (i !== -1) orders.value[i] = data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating order'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update status')
      sonner.success('Order status updated')
      const i = orders.value.findIndex((o) => o.orderId === orderId)
      if (i !== -1) orders.value[i].orderStatus = status
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const deleteOrder = async (orderId: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/order/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete order')
      }
      sonner.success('Order deleted')
      orders.value = orders.value.filter((o) => o.orderId !== orderId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting order'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }
  const setPendingOrder = (carts: Cart[]) => {
    pendingOrder.value = carts

    if (carts.length > 0) localStorage.setItem('pendingOrders', JSON.stringify(pendingOrder.value))
    else localStorage.removeItem('pendingOrders')
  }

  return {
    orders,
    isLoading,
    fetchUserOrders,
    fetchAllOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    setPendingOrder,
    pendingOrder,
  }
})
