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
            <router-link to="/admin" class="text-orange-300 font-medium px-3 py-2">Dashboard</router-link>
            <router-link to="/admin/menu" class="text-gray-300 hover:text-white font-medium px-3 py-2">Menu</router-link>
            <router-link to="/admin/orders" class="text-gray-300 hover:text-white font-medium px-3 py-2">Orders</router-link>
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Orders</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalOrders.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <ArrowUp class="h-4 w-4 text-green-600 mr-1" />
                <span class="text-green-600 text-sm font-medium">+{{ stats.ordersGrowth }}%</span>
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
              <p class="text-2xl font-bold text-gray-900">₱{{ stats.totalRevenue.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <ArrowUp class="h-4 w-4 text-green-600 mr-1" />
                <span class="text-green-600 text-sm font-medium">+{{ stats.revenueGrowth }}%</span>
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
              <p class="text-2xl font-bold text-gray-900">₱{{ stats.avgOrderValue.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <ArrowDown class="h-4 w-4 text-red-600 mr-1" />
                <span class="text-red-600 text-sm font-medium">{{ stats.avgOrderGrowth }}%</span>
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
          <div>
            <template v-for="(item, index) in filteredPopularItems" :key="item.id">
              <div class="flex justify-between items-center py-3">
                <div class="flex items-center space-x-3">
                  <img
                    :src="item.image"
                    :alt="item.name"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-200"
                    @error="$event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0Y5RjBGMSIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+UtTwvdGV4dD4KPC9zdmc+'"
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
              <div v-if="index < filteredPopularItems.length - 1" class="border-t border-gray-200"></div>
            </template>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Order Status Overview</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-orange-50">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-orange-400"></span>
                <span class="font-medium text-gray-700">Pending</span>
              </div>
              <span class="font-bold text-orange-400">2</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-blue-50">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                <span class="font-medium text-gray-700">Preparing</span>
              </div>
              <span class="font-bold text-blue-600">1</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-green-50">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                <span class="font-medium text-gray-700">Ready</span>
              </div>
              <span class="font-bold text-green-600">1</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-purple-50">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-purple-500"></span>
                <span class="font-medium text-gray-700">Out for Delivery</span>
              </div>
              <span class="font-bold text-purple-600">1</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-gray-100">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-gray-500"></span>
                <span class="font-medium text-gray-700">Delivered</span>
              </div>
              <span class="font-bold text-gray-600">18</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3 rounded-md bg-red-50">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-red-500"></span>
                <span class="font-medium text-gray-700">Cancelled</span>
              </div>
              <span class="font-bold text-red-600">3</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <a href="#" class="text-sm text-orange-400 hover:text-orange-500 font-medium">View All Orders</a>
          </div>
        </div>
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
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in filteredRecentOrders" :key="order.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{{ order.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ order.customer }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ order.items }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{ order.total }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(order.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.orderTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Bell, ChevronDown, ShoppingCart, DollarSign, BarChart3, Utensils, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import OrdersOverview from '@/components/charts/OrdersOverview.vue'
import RevenueTrend from '@/components/charts/RevenueTrend.vue'

const dashboardStore = useDashboardStore()
const {
  stats,
  filteredPopularItems,
  orderStatus,
  filteredRecentOrders,
  ordersChartData,
  revenueChartData,
  fetchDashboardData
} = dashboardStore

const getStatusBadgeClass = (status: string) => {
  const statusClasses = {
    'Ready': 'bg-green-100 text-green-800',
    'Preparing': 'bg-yellow-100 text-yellow-800',
    'Pending': 'bg-orange-100 text-orange-600',
    'Out for Delivery': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  fetchDashboardData()
})
</script>
