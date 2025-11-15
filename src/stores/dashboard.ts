import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useFetch } from '@/plugins/api'
import { toBase64, toDate } from '@/plugins/convert'
import type { Order } from '@/models/order'
import type { Pizza } from '@/models/pizza'

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  menuItems: number
  ordersGrowth: number
  revenueGrowth: number
  avgOrderGrowth: number
}

export interface PopularMenuItem {
  id: string
  name: string
  description: string
  image: string
  orders: number
}

export interface OrderStatus {
  pending: number
  preparing: number
  ready: number
  outForDelivery: number
  delivered: number
  cancelled: number
}

export interface RecentOrder {
  id: string
  customer: string
  items: string
  total: number
  status: string
  orderTime: string
}

export interface ChartData {
  month: string
  orders: number
  revenue: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  outfordelivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const normalizeStatus = (status?: string | null) =>
  status ? status.toLowerCase().replace(/\s+/g, '_') : 'pending'

const formatStatusLabel = (status?: string | null) =>
  STATUS_LABELS[normalizeStatus(status)] ?? (status ?? 'Unknown')

const monthLabel = (year: number, monthIndex: number) =>
  new Date(year, monthIndex).toLocaleString('en-US', { month: 'short', year: '2-digit' })

const percentChange = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export const useDashboardStore = defineStore('dashboard', () => {
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const stats = ref<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    menuItems: 0,
    ordersGrowth: 0,
    revenueGrowth: 0,
    avgOrderGrowth: 0,
  })

  const popularMenuItems = ref<PopularMenuItem[]>([])
  const orderStatus = ref<OrderStatus>({
    pending: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  })
  const recentOrders = ref<RecentOrder[]>([])
  const ordersChartData = ref<ChartData[]>([])
  const revenueChartData = ref<ChartData[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const filteredPopularItems = computed(() => popularMenuItems.value.slice(0, 5))
  const filteredRecentOrders = computed(() => recentOrders.value.slice(0, 5))

  const fetchDashboardData = async () => {
    isLoading.value = true
    error.value = null

    try {
      const [ordersRes, pizzasRes] = await Promise.all([
        useFetch(`${URL}/order`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        useFetch(`${URL}/pizza`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ])

      const [ordersData, pizzasData] = await Promise.all([ordersRes.json(), pizzasRes.json()])

      if (!ordersRes.ok) throw new Error(ordersData.message ?? 'Failed to load orders')
      if (!pizzasRes.ok) throw new Error(pizzasData.message ?? 'Failed to load pizzas')

      const pizzas: Pizza[] = Array.isArray(pizzasData) ? pizzasData : []
      const pizzaMap = new Map<number, Pizza>()
      pizzas.forEach((pizza) => pizzaMap.set(pizza.pizzaId as number, pizza))

      const orders: (Order & { orderTotal: number })[] = (Array.isArray(ordersData) ? ordersData : []).map(
        (order: Order) => {
          const total = order.orderLists.reduce((sum, item) => {
            const pizza = pizzaMap.get(item.pizzaId)
            return sum + (pizza?.pizzaPrice ?? 0) * item.quantity
          }, 0)
          return {
            ...order,
            orderTotal: total,
          }
        },
      )

      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.orderTotal ?? 0), 0)
      const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
      const activeMenuItems = pizzas.filter((pizza) => !pizza.isDeleted).length

      // Monthly aggregation (last 6 months)
      const monthlyMap = new Map<string, { orders: number; revenue: number }>()
      orders.forEach((order) => {
        const date = order.dateCreated ? new Date(order.dateCreated) : new Date()
        const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
        const current = monthlyMap.get(key) ?? { orders: 0, revenue: 0 }
        current.orders += 1
        current.revenue += order.orderTotal ?? 0
        monthlyMap.set(key, current)
      })

      const sortedMonthlyKeys = Array.from(monthlyMap.keys()).sort()
      const lastSixKeys = sortedMonthlyKeys.slice(-6)
      const monthlyData = lastSixKeys.map((key) => {
        const [year, month] = key.split('-').map(Number)
        const payload = monthlyMap.get(key)!
        return {
          month: monthLabel(year, month),
          orders: payload.orders,
          revenue: payload.revenue,
        }
      })

      ordersChartData.value = monthlyData
      revenueChartData.value = monthlyData

      const currentMonthData = monthlyData[monthlyData.length - 1] ?? { orders: 0, revenue: 0 }
      const previousMonthData = monthlyData[monthlyData.length - 2] ?? { orders: 0, revenue: 0 }
      const currentAvg = currentMonthData.orders
        ? currentMonthData.revenue / currentMonthData.orders
        : 0
      const prevAvg = previousMonthData.orders
        ? previousMonthData.revenue / previousMonthData.orders
        : 0

      stats.value = {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        menuItems: activeMenuItems,
        ordersGrowth: percentChange(currentMonthData.orders, previousMonthData.orders),
        revenueGrowth: percentChange(currentMonthData.revenue, previousMonthData.revenue),
        avgOrderGrowth: percentChange(currentAvg, prevAvg),
      }

      const statusCounts: OrderStatus = {
        pending: 0,
        preparing: 0,
        ready: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
      }

      orders.forEach((order) => {
        const normalized = normalizeStatus(order.orderStatus)
        switch (normalized) {
          case 'preparing':
            statusCounts.preparing += 1
            break
          case 'ready':
            statusCounts.ready += 1
            break
          case 'out_for_delivery':
          case 'outfordelivery':
            statusCounts.outForDelivery += 1
            break
          case 'delivered':
            statusCounts.delivered += 1
            break
          case 'cancelled':
            statusCounts.cancelled += 1
            break
          default:
            statusCounts.pending += 1
            break
        }
      })

      orderStatus.value = statusCounts

      const pizzaOrderCount = new Map<number, number>()
      orders.forEach((order) => {
        order.orderLists.forEach((item) => {
          const prev = pizzaOrderCount.get(item.pizzaId) ?? 0
          pizzaOrderCount.set(item.pizzaId, prev + item.quantity)
        })
      })

      popularMenuItems.value = Array.from(pizzaOrderCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pizzaId, count]) => {
          const pizza = pizzaMap.get(pizzaId)
          return {
            id: String(pizzaId),
            name: pizza?.pizzaName ?? `Pizza #${pizzaId}`,
            description: pizza?.pizzaDescription ?? 'No description available',
            image: pizza?.pizzaImage ? toBase64(pizza.pizzaImage as string) : '/placeholder.png',
            orders: count,
          }
        })

      recentOrders.value = orders
        .slice()
        .sort((a, b) => {
          const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
          const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
          return dateB - dateA
        })
        .slice(0, 5)
        .map((order) => ({
          id: `#${order.orderId}`,
          customer: `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim() || 'Guest User',
          items:
            order.orderLists
              .map((item) => pizzaMap.get(item.pizzaId)?.pizzaName ?? `Pizza #${item.pizzaId}`)
              .join(', ') || 'No items',
          total: order.orderTotal ?? 0,
          status: formatStatusLabel(order.orderStatus),
          orderTime: order.dateCreated ? toDate(order.dateCreated) : '',
        }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      error.value = message
      console.error('[Dashboard]', message)
    } finally {
      isLoading.value = false
    }
  }

  const refreshData = async () => {
    await fetchDashboardData()
  }

  return {
    stats,
    popularMenuItems,
    orderStatus,
    recentOrders,
    ordersChartData,
    revenueChartData,
    filteredPopularItems,
    filteredRecentOrders,
    fetchDashboardData,
    refreshData,
    isLoading,
    error,
  }
})
