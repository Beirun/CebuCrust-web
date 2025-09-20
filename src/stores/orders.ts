import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Order {
  id: string
  customerName: string
  phone: string
  dateTime: string
  address: string
  instructions: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  deliveryFee: number
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export const useOrdersStore = defineStore('orders', () => {
  // Initialize with empty data - will be populated from API
  const orders = ref<Order[]>([])
  const searchQuery = ref('')
  const statusFilter = ref('all')

  const filteredOrders = computed(() => {
    let filtered = orders.value

    if (searchQuery.value) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        order.phone.includes(searchQuery.value)
      )
    }

    if (statusFilter.value !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter.value)
    }

    return filtered
  })

  const fetchOrders = async () => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // const response = await fetch('/api/orders')
      // const data = await response.json()
      // orders.value = data.orders

      console.log('Orders will be fetched from API')
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // const response = await fetch(`/api/orders/${orderId}/status`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ status: newStatus })
      // })
      //
      // const updatedOrder = await response.json()
      // const index = orders.value.findIndex(order => order.id === orderId)
      // if (index !== -1) {
      //   orders.value[index] = updatedOrder
      // }

      console.log('Order status will be updated via API:', orderId, newStatus)
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getOrderById = (id: string) => {
    return orders.value.find(order => order.id === id)
  }

  return {
    orders,
    searchQuery,
    statusFilter,
    filteredOrders,
    fetchOrders,
    updateOrderStatus,
    getOrderById
  }
})
