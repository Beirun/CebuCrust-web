import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

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

export const useDashboardStore = defineStore('dashboard', () => {
  // Initialize with sample data matching the image
  const stats = ref<DashboardStats>({
    totalOrders: 2847,
    totalRevenue: 18450,
    avgOrderValue: 18450,
    menuItems: 24,
    ordersGrowth: 12,
    revenueGrowth: 8,
    avgOrderGrowth: -2.1
  })

  const popularMenuItems = ref<PopularMenuItem[]>([
    {
      id: '1',
      name: 'Classic Margherita',
      description: 'Fresh basil, mozzarella, tomato sauce',
      image: '/pizza-margherita.jpg',
      orders: 45
    },
    {
      id: '2',
      name: 'Supreme Pepperoni',
      description: 'Pepperoni, bell peppers, mushrooms',
      image: '/pizza-pepperoni.jpg',
      orders: 38
    },
    {
      id: '3',
      name: 'Hawaiian Special',
      description: 'Ham, pineapple, mozzarella',
      image: '/pizza-hawaiian.jpg',
      orders: 32
    },
    {
      id: '4',
      name: 'Meat Lovers',
      description: 'Pepperoni, sausage, bacon, ham',
      image: '/pizza-meat-lovers.jpg',
      orders: 28
    },
    {
      id: '5',
      name: 'Veggie Deluxe',
      description: 'Bell peppers, mushrooms, olives',
      image: '/pizza-veggie.jpg',
      orders: 24
    }
  ])

  const orderStatus = ref<OrderStatus>({
    pending: 2,
    preparing: 1,
    ready: 1,
    outForDelivery: 1,
    delivered: 18,
    cancelled: 3
  })

  const recentOrders = ref<RecentOrder[]>([
    {
      id: 'ORD-001',
      customer: 'John Doe',
      items: 'Margherita Pizza',
      total: 450,
      status: 'Ready',
      orderTime: 'Oct 15, 2024 2:30 PM'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      items: 'Pepperoni Pizza',
      total: 450,
      status: 'Preparing',
      orderTime: 'Oct 15, 2024 2:30 PM'
    },
    {
      id: 'ORD-003',
      customer: 'Carlos Santos',
      items: 'Supreme Pizza, Pasta',
      total: 780,
      status: 'Pending',
      orderTime: 'Oct 15, 2024 2:30 PM'
    },
    {
      id: 'ORD-004',
      customer: 'Carlos Santos',
      items: 'Supreme Pizza, Pasta',
      total: 780,
      status: 'Out for Delivery',
      orderTime: 'Oct 15, 2024 2:30 PM'
    },
    {
      id: 'ORD-005',
      customer: 'Carlos Santos',
      items: 'Supreme Pizza, Pasta',
      total: 780,
      status: 'Delivered',
      orderTime: 'Oct 15, 2024 2:30 PM'
    }
  ])

  const ordersChartData = ref<ChartData[]>([
    { month: 'Jan', orders: 120, revenue: 15000 },
    { month: 'Feb', orders: 150, revenue: 18000 },
    { month: 'Mar', orders: 180, revenue: 22000 },
    { month: 'Apr', orders: 220, revenue: 24000 },
    { month: 'May', orders: 260, revenue: 28000 },
    { month: 'Jun', orders: 300, revenue: 30000 }
  ])

  const revenueChartData = ref<ChartData[]>([
    { month: 'Jan', orders: 120, revenue: 15000 },
    { month: 'Feb', orders: 150, revenue: 18000 },
    { month: 'Mar', orders: 180, revenue: 22000 },
    { month: 'Apr', orders: 220, revenue: 24000 },
    { month: 'May', orders: 260, revenue: 28000 },
    { month: 'Jun', orders: 300, revenue: 30000 }
  ])

  // Computed properties for filtered data
  const filteredPopularItems = computed(() => {
    return popularMenuItems.value.slice(0, 5) // Show top 5
  })

  const filteredRecentOrders = computed(() => {
    return recentOrders.value.slice(0, 5) // Show latest 5
  })

  // Actions for API integration
  const fetchDashboardData = async () => {
    try {
      // For now, we're using the sample data already initialized above
      // In a real app, this would fetch from an API
      console.log('Dashboard data loaded with sample data')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
    refreshData
  }
})
