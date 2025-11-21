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
import { useNotificationStore } from './notification'
import type { Notification } from '@/models/notification'
type Status = 'preparing' | 'ready' | 'out for delivery' | 'delivered' | 'cancelled'

export const useOrderStore = defineStore('order', () => {
  const cart = useCartStore()
  const sonner = useSonnerStore()
  const pizza = usePizzaStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const orders = ref<Order[]>([])
  const isLoading = ref(false)
  const pendingOrder = ref<Cart[]>(JSON.parse(localStorage.getItem('pendingOrders') || '[]'))

  const notification = useNotificationStore()
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
      const notificationPayload = {
        userId: 1,
        notificationTitle: 'New Order',
        notificationMessage: 'A new order has just been placed by a customer.',
      }
      await notification.createNotification(notificationPayload)
      orders.value.push(data)
      await router.push('/orders')
      setPendingOrder([])
      // Only remove items from cart if they exist in the cart
      order.orderLists.forEach(async (o) => {
        const cartItem = cart.cart.find((c) => c.pizzaId === o.pizzaId)
        if (cartItem) {
          await cart.removeFromCart(o.pizzaId)
        }
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
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update order')
      await router.push('/orders')
      sonner.success('Order modified')
      setPendingOrder([])
      const i = orders.value.findIndex((o) => o.orderId === orderId)
      if (i !== -1) orders.value[i] = data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error update order'
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
      const userId = orders.value.find((o) => o.orderId === orderId)?.userId
      const payloads: Record<Status, Notification> = {
        preparing: {
          userId: userId ?? 1,
          notificationTitle: 'Order Preparing',
          notificationMessage: 'The kitchen has started preparing the order.',
        },
        ready: {
          userId: userId ?? 1,
          notificationTitle: 'Order Ready',
          notificationMessage: 'The order is ready for pickup or dispatch.',
        },
        'out for delivery': {
          userId: userId ?? 1,
          notificationTitle: 'Out for Delivery',
          notificationMessage: 'The rider has picked up the order and is on the way.',
        },
        delivered: {
          userId: userId ?? 1,
          notificationTitle: 'Order Delivered',
          notificationMessage: 'The order has been delivered successfully.',
        },
        cancelled: {
          userId: 1,
          notificationTitle: 'Order Cancelled',
          notificationMessage: 'The order has been cancelled.',
        },
      }

      const p = payloads[status as Status]

      await notification.createNotification(p)

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
