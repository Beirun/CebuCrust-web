<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AdminHeader />

    <!-- Main Content -->
    <div class="w-screen px-4 sm:px-8 lg:px-30 py-8">
      <div
        v-if="error"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-4"
      >
        <span>{{ error }}</span>
        <button
          class="rounded-md border border-red-300 px-3 py-2 text-red-600 transition-colors hover:bg-red-100"
          @click="fetchDashboardData"
        >
          Retry
        </button>
      </div>

      <div v-if="isLoading" class="mb-6 text-sm text-gray-500">
        Refreshing dashboard data...
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Orders</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ formatNumber(stats.totalOrders) }}
              </p>
              <div
                class="flex items-center mt-1"
                :class="stats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                <ArrowUp v-if="stats.ordersGrowth >= 0" class="h-4 w-4 mr-1" />
                <ArrowDown v-else class="h-4 w-4 mr-1" />
                <span class="text-sm font-medium">{{ formatPercent(stats.ordersGrowth) }}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart class="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ formatPeso(stats.totalRevenue) }}
              </p>
              <div
                class="flex items-center mt-1"
                :class="stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                <ArrowUp v-if="stats.revenueGrowth >= 0" class="h-4 w-4 mr-1" />
                <ArrowDown v-else class="h-4 w-4 mr-1" />
                <span class="text-sm font-medium">{{ formatPercent(stats.revenueGrowth) }}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign class="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ formatPeso(stats.avgOrderValue) }}
              </p>
              <div
                class="flex items-center mt-1"
                :class="stats.avgOrderGrowth >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                <ArrowUp v-if="stats.avgOrderGrowth >= 0" class="h-4 w-4 mr-1" />
                <ArrowDown v-else class="h-4 w-4 mr-1" />
                <span class="text-sm font-medium">{{ formatPercent(stats.avgOrderGrowth) }}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 class="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Menu Items</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.menuItems }}</p>
              <p class="text-gray-500 text-sm mt-1">Currently available</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Utensils class="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts and Lists Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Orders Overview</h3>
          <OrdersOverview :data="ordersChartData" />
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <RevenueTrend :data="revenueChartData" />
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Popular Menu Items</h2>
          <div v-if="filteredPopularItems.length">
            <template v-for="(item, index) in filteredPopularItems" :key="item.id">
              <div class="flex justify-between items-center py-3">
                <div class="flex items-center space-x-3">
                  <img
                    :src="item.image"
                    :alt="item.name"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-200"
                    @error="
                      (e: Event) => {
                        const img = e.target as HTMLImageElement
                        img.src =
                          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0Y5RjBGMSIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+UtTwvdGV4dD4KPC9zdmc+'
                      }
                    "
                  />
                  <div>
                    <p class="font-semibold text-gray-900">{{ item.name }}</p>
                    <p class="text-sm text-gray-500">{{ item.description }}</p>
                  </div>
                </div>
                <div class="flex items-center">
                  <span class="font-bold text-orange-400">{{ item.orders }}</span>
                  <span class="text-gray-400 ml-1">orders</span>
                </div>
              </div>
              <div
                v-if="index < filteredPopularItems.length - 1"
                class="border-t border-gray-200"
              ></div>
            </template>
          </div>
          <div v-else class="py-6 text-center text-sm text-gray-500">
            No menu activity yet. Recent orders will appear here once customers start ordering.
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Order Status Overview</h2>
          <div class="space-y-3">
            <div
              v-for="status in statusBreakdown"
              :key="status.key"
              class="flex justify-between items-center px-4 py-3 rounded-md"
              :class="status.container"
            >
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full" :class="status.dot"></span>
                <span class="font-medium text-gray-700">{{ status.label }}</span>
              </div>
              <span class="font-bold" :class="status.text">
                {{ formatNumber(status.value) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <router-link
              to="/admin/orders"
              class="text-sm text-orange-400 hover:text-orange-500 font-medium"
            >
              View All Orders
            </router-link>
          </div>
        </div>
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
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in filteredRecentOrders" :key="order.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{{ order.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ order.customer }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ order.items }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatPeso(order.total) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusBadgeClass(order.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ order.orderTime }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ShoppingCart, DollarSign, BarChart3, Utensils, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import OrdersOverview from '@/components/charts/OrdersOverview.vue'
import RevenueTrend from '@/components/charts/RevenueTrend.vue'
import AdminHeader from '@/components/AdminHeader.vue'
import Footer from '@/components/Footer.vue'

const dashboardStore = useDashboardStore()
const {
  stats,
  filteredPopularItems,
  filteredRecentOrders,
  ordersChartData,
  revenueChartData,
  orderStatus,
  isLoading,
  error,
} = storeToRefs(dashboardStore)

const { fetchDashboardData } = dashboardStore

const getStatusBadgeClass = (status: string) => {
  const statusClasses = {
    Ready: 'bg-green-100 text-green-800',
    Preparing: 'bg-yellow-100 text-yellow-800',
    Pending: 'bg-orange-100 text-orange-600',
    'Out for Delivery': 'bg-purple-100 text-purple-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  }
  return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
}

const statusBreakdown = computed(() => {
  const counts = orderStatus.value ?? {
    pending: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  }
  return [
    {
      key: 'pending',
      label: 'Pending',
      value: counts.pending,
      container: 'bg-orange-50',
      dot: 'bg-orange-400',
      text: 'text-orange-400',
    },
    {
      key: 'preparing',
      label: 'Preparing',
      value: counts.preparing,
      container: 'bg-blue-50',
      dot: 'bg-blue-500',
      text: 'text-blue-600',
    },
    {
      key: 'ready',
      label: 'Ready',
      value: counts.ready,
      container: 'bg-green-50',
      dot: 'bg-green-500',
      text: 'text-green-600',
    },
    {
      key: 'outForDelivery',
      label: 'Out for Delivery',
      value: counts.outForDelivery,
      container: 'bg-purple-50',
      dot: 'bg-purple-500',
      text: 'text-purple-600',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: counts.delivered,
      container: 'bg-gray-100',
      dot: 'bg-gray-500',
      text: 'text-gray-600',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: counts.cancelled,
      container: 'bg-red-50',
      dot: 'bg-red-500',
      text: 'text-red-600',
    },
  ]
})

const formatPeso = (value: number) =>
  `₱${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatNumber = (value: number) => Number(value ?? 0).toLocaleString()

const formatPercent = (value: number) => {
  const numeric = Number.isFinite(value) ? value : 0
  const prefix = numeric >= 0 ? '+' : ''
  return `${prefix}${numeric.toFixed(1)}%`
}

onMounted(() => {
  fetchDashboardData()
})
</script>
