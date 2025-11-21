<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { useOrderStore } from '@/stores/orders'
import { type Order } from '@/models/order'
import { Search, Eye } from 'lucide-vue-next'
import AdminHeader from '@/components/AdminHeader.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import { useLocationStore } from '@/stores/location'
import { toDate } from '@/plugins/convert'

const order = useOrderStore()
const pizza = usePizzaStore()
const selectedStatus = ref('all')
const sortBy = ref<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc')
const searchQuery = ref('')
const isOrderModalOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const selectedUpdateStatus = ref('')

// Computed status counts based on actual orders data

const selectedPizzaOrders = computed(() =>
  selectedOrder.value?.orderLists.map((o) => {
    const p = pizza.pizzas.find((p) => p.pizzaId === o.pizzaId)
    return {
      pizzaId: p!.pizzaId,
      pizzaName: p!.pizzaName,
      pizzaPrice: p!.pizzaPrice,
      quantity: o.quantity,
    }
  }),
)

const statusCounts = computed(() => {
  const counts = {
    all: order.orders.length,
    pending: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
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

const filteredOrders = computed(() => {
  let filtered = order.orders.slice()

  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((order) => order.orderStatus === selectedStatus.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((order) => {
      const idMatch = order.orderId.toString().includes(query)
      const name = `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim().toLowerCase()
      const nameMatch = name.includes(query)
      const itemMatch = order.orderLists.some((item) => {
        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
        return p?.pizzaName.toLowerCase().includes(query)
      })
      return idMatch || nameMatch || itemMatch
    })
  }

  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_asc':
        return new Date(a.dateCreated ?? 0).getTime() - new Date(b.dateCreated ?? 0).getTime()
      case 'total_desc':
        return (b.orderTotal ?? 0) - (a.orderTotal ?? 0)
      case 'total_asc':
        return (a.orderTotal ?? 0) - (b.orderTotal ?? 0)
      case 'date_desc':
      default:
        return new Date(b.dateCreated ?? 0).getTime() - new Date(a.dateCreated ?? 0).getTime()
    }
  })

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

const openOrderModal = (order: Order) => {
  selectedOrder.value = order
  selectedUpdateStatus.value = selectedOrder.value.orderStatus!
  isOrderModalOpen.value = true
}

const closeOrderModal = () => {
  isOrderModalOpen.value = false
}

const updateOrderStatus = async () => {
  // console.log(selectedUpdateStatus.value)
  if (selectedOrder.value)
    await order.updateOrderStatus(selectedOrder.value.orderId, selectedUpdateStatus.value)

  closeOrderModal()
}

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

onBeforeMount(async () => {
  await order.fetchAllOrders()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AdminHeader />

    <!-- Main Content -->
    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8 min-h-[calc(100vh-5rem)]">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Order Management</h1>
        <p class="text-gray-600 mt-2">Monitor and manage all customer orders</p>
      </div>

      <!-- Status Tabs -->
      <div class="flex flex-wrap gap-6 mb-6">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          @click="selectedStatus = tab.key"
          :class="[
            'text-sm font-medium transition-colors flex items-center gap-2 pb-1',
            selectedStatus === tab.key
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-gray-700 border-b-2 border-transparent hover:text-gray-900',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== null"
            class="px-2 py-1 rounded-full text-xs font-bold"
            :class="getTabCountClass(tab.key)"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Search and Controls -->
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
          <Select v-model="sortBy">
            <SelectTrigger
              class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white w-40"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="total_desc">Total: High to Low</SelectItem>
              <SelectItem value="total_asc">Total: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Order ID
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Items
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Order Time
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in filteredOrders" :key="order.orderId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ORDER#{{ order.orderId }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ order.firstName + ' ' + order.lastName }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{
                    order.orderLists
                      ?.map((item) => {
                        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                        return p ? p.pizzaName : ''
                      })
                      .filter((pizza) => pizza)
                      .join(', ')
                  }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₱{{ order.orderTotal }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getStatusBadgeClass(order.orderStatus!)"
                  >
                    {{ formatStatus(order.orderStatus!) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ toDate(order.dateCreated as Date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    v-if="order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered'"
                    @click="openOrderModal(order)"
                    class="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <Eye class="h-4 w-4 text-blue-500" />
                    Update Status
                    <ChevronDown class="h-3 w-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Order Details Modal -->
    <Dialog v-model:open="isOrderModalOpen">
      <DialogContent class="lg:max-w-4xl max-h-[75vh] flex flex-col p-0">
        <DialogHeader class="px-4 py-3 border-b border-gray-200">
          <DialogTitle class="text-xl font-bold text-gray-900">
            Order #{{ selectedOrder?.orderId }}
          </DialogTitle>
        </DialogHeader>

        <div class="p-4 space-y-4 pb-4 flex-1 overflow-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Column -->
            <div class="space-y-3">
              <Card class="bg-gray-50 border border-gray-200 py-2">
                <CardContent class="p-3">
                  <CardTitle class="text-sm font-semibold text-gray-900 mb-2">
                    Customer Information
                  </CardTitle>
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <svg
                          class="h-3 w-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span class="text-xs text-gray-900 font-medium">{{
                        selectedOrder?.firstName + ' ' + selectedOrder?.lastName
                      }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <svg
                          class="h-3 w-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <span class="text-xs text-gray-900">{{ selectedOrder?.phoneNumber }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <svg
                          class="h-3 w-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span class="text-xs text-gray-900">{{ selectedOrder?.dateCreated }}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card class="bg-gray-50 border border-gray-200 py-2">
                <CardContent class="p-3">
                  <CardTitle class="text-sm font-semibold text-gray-900 mb-2">
                    Delivery Address
                  </CardTitle>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5"
                    >
                      <svg
                        class="h-3 w-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span class="text-xs text-gray-900">
                      {{ useLocationStore().mapLocation(selectedOrder?.location!) }}</span
                    >
                  </div>
                </CardContent>
              </Card>

              <Card class="bg-gray-50 border border-gray-200 py-2">
                <CardContent class="p-3">
                  <CardTitle class="text-sm font-semibold text-gray-900 mb-2">
                    Special Instructions
                  </CardTitle>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5"
                    >
                      <svg
                        class="h-3 w-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <span class="text-xs text-gray-900">{{
                      selectedOrder?.orderInstruction || 'Customer left no instructions.'
                    }}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Right Column -->
            <div class="space-y-3">
              <Card class="bg-gray-50 border border-gray-200 py-2">
                <CardContent class="p-3">
                  <CardTitle class="text-sm font-semibold text-gray-900 mb-2">
                    Order Details
                  </CardTitle>
                  <div class="space-y-2">
                    <div
                      v-for="pizzaOrder in selectedPizzaOrders"
                      :key="pizzaOrder.pizzaId!"
                      class="flex justify-between items-center py-1 border-b border-gray-100"
                    >
                      <div class="flex-1">
                        <span class="text-xs font-medium text-gray-900">{{
                          pizzaOrder.pizzaName
                        }}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500">Qty: {{ pizzaOrder.quantity }}</span>
                        <span class="text-xs font-semibold text-gray-900"
                          >P{{ pizzaOrder.pizzaPrice * pizzaOrder.quantity }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="flex justify-between items-center py-1">
                      <span class="text-xs text-gray-600">Subtotal</span>
                      <span class="text-xs font-semibold text-gray-900"
                        >P{{
                          selectedPizzaOrders?.reduce(
                            (sum, o) => sum + o.quantity * o.pizzaPrice,
                            0,
                          )
                        }}</span
                      >
                    </div>
                    <div class="flex justify-between items-center py-1">
                      <span class="text-xs text-gray-600">Delivery Fee</span>
                      <span class="text-xs font-semibold text-gray-900">P50</span>
                    </div>
                    <div
                      class="flex justify-between items-center py-1 text-sm font-bold border-t border-gray-200 pt-1"
                    >
                      <span class="text-gray-900">Total</span>
                      <span class="text-gray-900"
                        >P{{
                          Number(
                            selectedPizzaOrders?.reduce(
                              (sum, o) => sum + o.quantity * o.pizzaPrice,
                              0,
                            ),
                          ) + 50
                        }}</span
                      >
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card class="bg-gray-50 border border-gray-200 py-2">
                <CardContent class="p-3">
                  <CardTitle class="text-sm font-semibold text-gray-900 mb-2">
                    Status Management
                  </CardTitle>
                  <div class="space-y-2">
                    <Label class="text-xs font-medium text-gray-700">Update Status:</Label>
                    <Select v-model="selectedUpdateStatus">
                      <SelectTrigger
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-if="selectedOrder?.orderStatus === 'pending'"
                          value="cancelled"
                          >Cancelled</SelectItem
                        >
                        <SelectItem v-if="selectedOrder?.orderStatus === 'pending'" value="pending"
                          >Pending</SelectItem
                        >
                        <SelectItem
                          v-if="
                            selectedOrder?.orderStatus === 'pending' ||
                            selectedOrder?.orderStatus === 'preparing'
                          "
                          value="preparing"
                          >Preparing</SelectItem
                        >
                        <SelectItem
                          v-if="
                            selectedOrder?.orderStatus === 'pending' ||
                            selectedOrder?.orderStatus === 'ready' ||
                            selectedOrder?.orderStatus === 'preparing'
                          "
                          value="ready"
                          >Ready</SelectItem
                        >
                        <SelectItem
                          v-if="
                            selectedOrder?.orderStatus === 'ready' ||
                            selectedOrder?.orderStatus === 'out for delivery'
                          "
                          value="out for delivery"
                          >Out for Delivery</SelectItem
                        >
                        <SelectItem
                          v-if="selectedOrder?.orderStatus === 'out for delivery'"
                          value="delivered"
                          >Delivered</SelectItem
                        >
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-2 pt-4">
            <Button
              @click="updateOrderStatus"
              class="px-3 py-1.5 text-xs text-white flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Update Status
            </Button>
            <Button @click="closeOrderModal" variant="outline" class="px-3 py-1.5 text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <Footer />
  </div>
</template>
