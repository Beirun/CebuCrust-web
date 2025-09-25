<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrdersStore, type Order } from '@/stores/orders'
import { Search, Filter, ChevronDown, Bell, Eye } from 'lucide-vue-next'

const ordersStore = useOrdersStore()

// Sample data for the orders
const sampleOrders = ref<Order[]>([
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    phone: '+63 912 345 6789',
    dateTime: 'Oct 15, 2024 2:30 PM',
    address: '123 Main Street, Cebu City',
    instructions: 'Please ring the doorbell twice',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 450 },
      { name: 'Garlic Bread', quantity: 2, price: 150 }
    ],
    subtotal: 600,
    deliveryFee: 50,
    total: 650,
    status: 'ready',
    createdAt: '2024-10-15T14:30:00Z',
    updatedAt: '2024-10-15T14:30:00Z'
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    phone: '+63 917 123 4567',
    dateTime: 'Oct 15, 2024 3:15 PM',
    address: '456 Oak Avenue, Mandaue City',
    instructions: 'Leave at the gate',
    items: [
      { name: 'Pepperoni Pizza', quantity: 1, price: 520 },
      { name: 'Caesar Salad', quantity: 1, price: 180 }
    ],
    subtotal: 700,
    deliveryFee: 50,
    total: 750,
    status: 'preparing',
    createdAt: '2024-10-15T15:15:00Z',
    updatedAt: '2024-10-15T15:15:00Z'
  },
  {
    id: 'ORD-003',
    customerName: 'Carlos Santos',
    phone: '+63 918 987 6543',
    dateTime: 'Oct 15, 2024 4:00 PM',
    address: '789 Pine Street, Lapu-Lapu City',
    instructions: 'Call when arriving',
    items: [
      { name: 'Supreme Pizza', quantity: 1, price: 680 },
      { name: 'Pasta Carbonara', quantity: 1, price: 320 }
    ],
    subtotal: 1000,
    deliveryFee: 50,
    total: 1050,
    status: 'pending',
    createdAt: '2024-10-15T16:00:00Z',
    updatedAt: '2024-10-15T16:00:00Z'
  },
  {
    id: 'ORD-004',
    customerName: 'Maria Garcia',
    phone: '+63 919 555 1234',
    dateTime: 'Oct 15, 2024 4:45 PM',
    address: '321 Elm Street, Talisay City',
    instructions: 'No special instructions',
    items: [
      { name: 'Hawaiian Pizza', quantity: 2, price: 900 },
      { name: 'Chicken Wings', quantity: 1, price: 250 }
    ],
    subtotal: 1150,
    deliveryFee: 50,
    total: 1200,
    status: 'out_for_delivery',
    createdAt: '2024-10-15T16:45:00Z',
    updatedAt: '2024-10-15T16:45:00Z'
  },
  {
    id: 'ORD-005',
    customerName: 'Robert Johnson',
    phone: '+63 920 777 8888',
    dateTime: 'Oct 15, 2024 5:30 PM',
    address: '654 Maple Drive, Consolacion',
    instructions: 'Gate code: 1234',
    items: [
      { name: 'BBQ Chicken Pizza', quantity: 1, price: 580 },
      { name: 'Mushroom Pizza', quantity: 1, price: 520 }
    ],
    subtotal: 1100,
    deliveryFee: 50,
    total: 1150,
    status: 'delivered',
    createdAt: '2024-10-15T17:30:00Z',
    updatedAt: '2024-10-15T17:30:00Z'
  }
])

// Initialize orders with sample data
ordersStore.orders = sampleOrders.value

const selectedStatus = ref('all')
const searchQuery = ref('')
const isOrderModalOpen = ref(false)
const selectedOrder = ref<Order | null>(null)

// Computed status counts based on actual orders data
const statusCounts = computed(() => {
  const counts = {
    all: ordersStore.orders.length,
    pending: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  }

  ordersStore.orders.forEach(order => {
    counts[order.status as keyof typeof counts]++
  })

  return counts
})

const statusTabs = computed(() => [
  { key: 'all', label: 'All Orders', count: null },
  { key: 'pending', label: 'Pending', count: statusCounts.value.pending },
  { key: 'preparing', label: 'Preparing', count: statusCounts.value.preparing },
  { key: 'ready', label: 'Ready', count: statusCounts.value.ready },
  { key: 'out_for_delivery', label: 'Out for Delivery', count: statusCounts.value.out_for_delivery },
  { key: 'delivered', label: 'Delivered', count: statusCounts.value.delivered },
  { key: 'cancelled', label: 'Cancelled', count: statusCounts.value.cancelled }
])

const filteredOrders = computed(() => {
  let filtered = ordersStore.orders

  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(order => order.status === selectedStatus.value)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(order =>
      order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
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
    case 'out_for_delivery':
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
    case 'out_for_delivery':
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
  isOrderModalOpen.value = true
}

const closeOrderModal = () => {
  isOrderModalOpen.value = false
  selectedOrder.value = null
}

const updateOrderStatus = (orderId: string, newStatus: string) => {
  const order = ordersStore.orders.find(o => o.id === orderId)
  if (order) {
    order.status = newStatus as Order['status']
  }
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
    case 'out_for_delivery':
      return 'bg-green-100 text-green-800'
    case 'delivered':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-[#121A1D] text-white">
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="flex justify-between items-center h-20 py-4">
          <!-- Logo -->
          <div class="flex items-center">
            <div>
              <img src="@/assets/logo.png" alt="Cebu Crust" />
            </div>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-10">
            <router-link to="/admin" class="text-gray-300 hover:text-white font-medium px-3 py-2">Dashboard</router-link>
            <router-link to="/admin/menu" class="text-gray-300 hover:text-white font-medium px-3 py-2">Menu</router-link>
            <router-link to="/admin/orders" class="text-orange-400 font-medium px-3 py-2">Orders</router-link>
          </nav>

          <!-- User & Notifications -->
          <div class="flex items-center space-x-6">
            <div class="relative">
              <button class="text-gray-300 hover:text-white relative p-2">
                <Bell class="h-6 w-6" />
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </button>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium">MS</span>
              </div>
              <span class="text-gray-300 font-medium">Maria Santos</span>
              <ChevronDown class="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
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
              : 'text-gray-700 hover:text-gray-900'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.count !== null" class="px-2 py-1 rounded-full text-xs font-bold" :class="getTabCountClass(tab.key)">
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
          <button class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter class="h-4 w-4" />
            Filter
          </button>
          <button class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronDown class="h-4 w-4" />
            Sort
          </button>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="order in filteredOrders"
                :key="order.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{{ order.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ order.customerName }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ order.items.map(item => item.name).join(', ') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₱{{ order.total }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getStatusBadgeClass(order.status)"
                  >
                    {{ formatStatus(order.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ order.dateTime }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
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

    <!-- Footer from Landing Page -->
    <div class="bg-[#121A1D] h-70 w-screen flex flex-col px-30 pt-8 text-[#797B78] justify-between">
      <div class="flex w-full justify-between gap-40">
        <div class="w-150 flex flex-col gap-2">
          <div>
            <img src="@/assets/logo.png" alt="" />
          </div>
          <div>
            Lorem ipsum dolor sit amet consectetur. Tristique cursus morbi nibh nec et vulputate.
            Turpis tortor nisi imperdiet quis accumsan. Ligula netus amet leo ultricies. Neque
            venenatis magnis amet eget sagittis leo enim.
          </div>
        </div>

        <div class="flex flex-col w-120 gap-6">
          <div class="text-white text-xl font-bold">Opening Time</div>
          <div>Mon - Wed: 09:00am - 10:00pm</div>
          <div>Thu - Sat: 09:00am - 9:00pm</div>
          <div>Sun: Closed</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">User Link</div>
          <div>About Us</div>
          <div>Contact Us</div>
          <div>Order Delivery</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">Contact Us</div>
          <div>
            <div>543 Country Club Ave</div>
            <div>NC 27587, London, UK</div>
          </div>

          <div>+1257 6541120</div>
        </div>
      </div>
    </div>
    <div class="bg-[#121A1D] flex justify-between px-30 py-8 text-[#797B78]">
      <div class="flex w-full justify-between">
        <div>©2024 ARR, All right reserved</div>
        <div class="flex gap-8">
          <button>Privacy Policy</button>
          <button>Terms of Use</button>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div
      v-if="isOrderModalOpen && selectedOrder"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[75vh] shadow-lg flex flex-col">
        <!-- Modal Header -->
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">Order #{{ selectedOrder.id }}</h2>
            <button
              @click="closeOrderModal"
              class="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-4 space-y-4 pb-4 flex-1">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left Column -->
            <div class="space-y-3">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span class="text-xs text-gray-900 font-medium">{{ selectedOrder.customerName }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span class="text-xs text-gray-900">{{ selectedOrder.phone }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span class="text-xs text-gray-900">{{ selectedOrder.dateTime }}</span>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Delivery Address</h3>
                <div class="flex items-start space-x-2">
                  <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg class="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span class="text-xs text-gray-900">123 Lahug Street, Barangay Lahug, Cebu City, 6000</span>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Special Instructions</h3>
                <div class="flex items-start space-x-2">
                  <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg class="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span class="text-xs text-gray-900">Ring doorbell twice. Leave at front door if no answer.</span>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-3">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Order Details</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center py-1 border-b border-gray-100">
                    <div class="flex-1">
                      <span class="text-xs font-medium text-gray-900">Classic Margherita</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-xs text-gray-500">Qty: 1</span>
                      <span class="text-xs font-semibold text-gray-900">P695</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center py-1 border-b border-gray-100">
                    <div class="flex-1">
                      <span class="text-xs font-medium text-gray-900">Supreme Pepperoni</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-xs text-gray-500">Qty: 1</span>
                      <span class="text-xs font-semibold text-gray-900">P459</span>
                    </div>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-gray-200">
                  <div class="flex justify-between items-center py-1">
                    <span class="text-xs text-gray-600">Subtotal</span>
                    <span class="text-xs font-semibold text-gray-900">P1,154</span>
                  </div>
                  <div class="flex justify-between items-center py-1">
                    <span class="text-xs text-gray-600">Delivery Fee</span>
                    <span class="text-xs font-semibold text-gray-900">P50</span>
                  </div>
                  <div class="flex justify-between items-center py-1 text-sm font-bold border-t border-gray-200 pt-1">
                    <span class="text-gray-900">Total</span>
                    <span class="text-gray-900">P1,204</span>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Status Management</h3>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700">Update Status:</label>
                  <div class="relative">
                    <select
                      :value="selectedOrder.status"
                      @change="updateOrderStatus(selectedOrder.id, ($event.target as HTMLSelectElement).value)"
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-2 pt-4">
            <button
              @click="updateOrderStatus(selectedOrder.id, selectedOrder.status)"
              class="px-3 py-1.5 text-xs bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Status
            </button>
            <button
              @click="closeOrderModal"
              class="px-3 py-1.5 text-xs bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
