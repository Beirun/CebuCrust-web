<script setup lang="ts">
import { ref, computed, onMounted, reactive, onBeforeMount, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import UserHeader from '@/components/UserHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Clock, ConciergeBell, CookingPot, Pizza, Truck, X } from 'lucide-vue-next'
import { Search, Filter, ChevronDown } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import { toBase64, toDate } from '@/plugins/convert'
import { useLocationStore } from '@/stores/location'
import { barangays } from '@/data/barangay'
import { useOrderStore } from '@/stores/orders'
import { useRatingStore } from '@/stores/rating'
import { useAuthStore } from '@/stores/auth'
import type { Order } from '@/models/order'
import type { Cart } from '@/models/cart'
import type { RatingRequest } from '@/models/rating'
import router from '@/router'
import { sanitizePostalCode } from '@/lib/utils'

const cart = useCartStore()
const pizza = usePizzaStore()
const location = useLocationStore()
const order = useOrderStore()
const ratingStore = useRatingStore()
const auth = useAuthStore()
const cartItems = ref<
  {
    pizzaId: number
    quantity: number
  }[]
>([])

const selectedStatus = ref('all')
const searchQuery = ref('')
const sortBy = ref('')
const categoryFilter = ref('all')

const selectedAddressId = ref(0)
const showAddressModal = ref(false)
const isEdit = ref(false)
const cancelConfirmationOpen = ref(false)

// Rating modal state
const ratingModalOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const pizzaRatings = ref<Map<number, number>>(new Map()) // Track rating for each pizza (pizzaId -> rating)
const pizzaMessages = ref<Map<number, string>>(new Map()) // Track message for each pizza (pizzaId -> message)
const isSubmittingRating = ref(false)
const orderRatedStatus = ref<Map<number, boolean>>(new Map()) // Track which orders are fully rated
const locationForm = reactive({
  locationId: 0,
  locationCity: 'Cebu City',
  locationBrgy: '',
  locationStreet: '',
  locationHouseNo: '',
  locationPostal: '',
  locationLandmark: '',
  isDefault: false,
})

const onPostalInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  locationForm.locationPostal = sanitizePostalCode(target.value)
}

const saveAddress = async () => {
  if (isEdit.value) {
    const res = await location.updateLocation(locationForm.locationId, locationForm)
    if (res) {
      showAddressModal.value = false
      isEdit.value = false
      // Update selectedAddressId if the edited address was selected or is now default
      if (locationForm.isDefault) {
        selectedAddressId.value = locationForm.locationId
      }
    }
  } else {
    const res = await location.addLocation(locationForm)
    if (res) {
      showAddressModal.value = false
      // Update selectedAddressId to the newly added address or the newly set default
      const newLocation = location.locations[location.locations.length - 1]
      if (newLocation) {
        selectedAddressId.value = newLocation.locationId
      }
    }
  }
}

onMounted(() => {
  cartItems.value = cart.cart
  console.log('locs', location.locations)
  selectedAddressId.value = location.selectedLocation?.locationId ?? 0
})

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
const filteredOrders = computed(() => {
  let filtered = order.orders

  // Filter by pizza category
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter((order) => 
      order.orderLists.some((item) => {
        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
        const cat = (p?.pizzaCategory || '').toString().toLowerCase()
        return cat === categoryFilter.value.toLowerCase()
      })
    )
  }

  // Filter by status tabs (existing functionality)
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((order) => order.orderStatus === selectedStatus.value)
  }

  if (searchQuery.value) {
    filtered = filtered.filter(
      (order) =>
        order.orderId.toString().includes(searchQuery.value.toLowerCase()) ||
        (order.firstName + ' ' + order.lastName)
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase()) ||
        order.orderLists.some((item) => {
          const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
          return p?.pizzaName.toLowerCase().includes(searchQuery.value.toLowerCase())
        }),
    )
  }

  // Sort orders
  if (sortBy.value) {
    switch (sortBy.value) {
      case 'order-number':
        filtered.sort((a, b) => (b.orderId || 0) - (a.orderId || 0)) // Newest first
        break
      case 'order-date':
        filtered.sort((a, b) => {
          const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
          const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
          return dateB - dateA // Newest first
        })
        break
      case 'price-low':
        filtered.sort((a, b) => (a.orderTotal || 0) - (b.orderTotal || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.orderTotal || 0) - (a.orderTotal || 0))
        break
    }
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return ConciergeBell
    case 'preparing':
      return CookingPot
    case 'pending':
      return Clock
    case 'out for delivery':
      return Truck
    case 'delivered':
      return Check
    case 'cancelled':
      return X
    default:
      return Pizza
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

const handleCancelOrder = async (id: number) => {
  await order.updateOrderStatus(id, 'cancelled')
  cancelConfirmationOpen.value = false
}

const handleModifyOrder = (currentOrder: Order) => {
  order.setPendingOrder(currentOrder.orderLists as Cart[])
  router.push('/order/modify/' + currentOrder.orderId)
}

const handleReorder = (currentOrder: Order) => {
  // Set the pending order with the same items from the previous order
  order.setPendingOrder(currentOrder.orderLists as Cart[])
  // Navigate to complete order page
  router.push('/order/complete')
}

// Computed property to check if an order is fully rated
const isOrderFullyRated = (order: Order) => {
  return orderRatedStatus.value.get(order.orderId) || false
}

// Check and cache rating status for an order
const checkOrderRatingStatus = async (order: Order) => {
  if (orderRatedStatus.value.has(order.orderId)) {
    return orderRatedStatus.value.get(order.orderId)
  }
  
  const isRated = await hasUserRatedAllPizzas(order)
  orderRatedStatus.value.set(order.orderId, isRated)
  return isRated
}

// Check if user has already rated all pizzas from an order
const hasUserRatedAllPizzas = async (targetOrder: Order): Promise<boolean> => {
  if (!auth.user?.userId || !targetOrder.orderLists) return false
  
  // Ensure orders are loaded
  if (!order.orders || order.orders.length === 0) {
    await order.fetchUserOrders()
  }
  
  // Get all pizza IDs from the order
  const orderPizzaIds = targetOrder.orderLists.map(item => item.pizzaId)
  
  // Check if user has rated all pizzas in this order
  for (const pizzaId of orderPizzaIds) {
    const pizzaRating = await ratingStore.fetchRatingsByPizzaId(pizzaId)
    if (!pizzaRating) return false
    
    // Check if current user has a rating for this pizza that belongs to this order
    const userRatings = pizzaRating.ratings.filter(rating => rating.userId === auth.user?.userId)
    if (userRatings.length === 0) return false
    
    // Check if any rating belongs to this order
    let hasRatingForThisOrder = false
    for (const rating of userRatings) {
      const ratingDate = new Date(rating.dateCreated)
      if (ratingBelongsToOrder(ratingDate, targetOrder, pizzaId)) {
        hasRatingForThisOrder = true
        break
      }
    }
    
    if (!hasRatingForThisOrder) return false
  }
  
  return true
}

// Check if user has already rated any pizza from an order
const hasUserRatedAnyPizza = async (order: Order): Promise<boolean> => {
  if (!auth.user?.userId || !order.orderLists) return false
  
  // Get all pizza IDs from the order
  const orderPizzaIds = order.orderLists.map(item => item.pizzaId)
  
  // Check if user has rated any pizza in this order
  for (const pizzaId of orderPizzaIds) {
    const pizzaRating = await ratingStore.fetchRatingsByPizzaId(pizzaId)
    if (!pizzaRating) continue
    
    // Check if current user has rated this pizza
    const userRated = pizzaRating.ratings.some(rating => rating.userId === auth.user?.userId)
    if (userRated) return true
  }
  
  return false
}

// Helper function to find which order a rating belongs to
// SIMPLE RULE: If preferredOrderId is provided, assign to that order (if valid and doesn't have rating)
// Otherwise, find the most recent order without a rating
const findOrderForRatingByDate = (ratingDate: Date, pizzaId: number, preferredOrderId?: number, checkingExistingRating: boolean = false): number | null => {
  if (!order.orders || order.orders.length === 0) return null
  
  // If preferredOrderId is provided and we're creating a NEW rating, ALWAYS assign to it if valid
  // (hasUserRatedPizza should have already checked if it has a rating)
  if (preferredOrderId && !checkingExistingRating) {
    const preferredOrder = order.orders.find(o => o.orderId === preferredOrderId)
    if (preferredOrder) {
      // Check if order is delivered and contains the pizza
      if (preferredOrder.orderStatus === 'delivered' && 
          preferredOrder.orderLists?.some(item => item.pizzaId === pizzaId)) {
        const preferredOrderDate = preferredOrder.dateCreated ? (typeof preferredOrder.dateCreated === 'string' ? new Date(preferredOrder.dateCreated) : preferredOrder.dateCreated) : null
        
        // Check if order was delivered before rating date
        if (preferredOrderDate && preferredOrderDate <= ratingDate) {
          // For NEW ratings, just return preferredOrderId - hasUserRatedPizza already verified it doesn't have a rating
          return preferredOrderId
        }
      }
    }
  }
  
  // Fallback: find most recent order without rating (for checking where existing ratings belong)
  const candidateOrders = order.orders
    .filter(o => {
      if (!o.dateCreated || o.orderStatus !== 'delivered') return false
      const oDate = typeof o.dateCreated === 'string' ? new Date(o.dateCreated) : o.dateCreated
      return oDate <= ratingDate && o.orderLists?.some(item => item.pizzaId === pizzaId)
    })
    .sort((a, b) => {
      const dateA = typeof a.dateCreated === 'string' ? new Date(a.dateCreated).getTime() : (a.dateCreated?.getTime() || 0)
      const dateB = typeof b.dateCreated === 'string' ? new Date(b.dateCreated).getTime() : (b.dateCreated?.getTime() || 0)
      if (dateB !== dateA) return dateB - dateA
      return (b.orderId || 0) - (a.orderId || 0)
    })
  
  if (candidateOrders.length === 0) return null
  
  // Get existing ratings (excluding the one we're checking)
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  const userRatings = pizzaRating ? pizzaRating.ratings.filter(r => r.userId === auth.user?.userId) : []
  
  // Create a map to track which orders have ratings
  // Process ratings chronologically to assign them correctly
  const orderHasRating = new Map<number, boolean>()
  
  // Sort ratings by date (oldest first) to process them in order
  const sortedRatings = [...userRatings].sort((a, b) => 
    new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
  )
  
  for (const rating of sortedRatings) {
    const rDate = new Date(rating.dateCreated)
    if (rDate > ratingDate) continue // Skip ratings after target date
    
    // Find the most recent order (by date, then orderId) that:
    // 1. Was delivered before this rating
    // 2. Doesn't already have a rating assigned
    let assignedOrderId: number | null = null
    for (const candidateOrder of candidateOrders) {
      const candidateOrderDate = candidateOrder.dateCreated ? (typeof candidateOrder.dateCreated === 'string' ? new Date(candidateOrder.dateCreated) : candidateOrder.dateCreated) : null
      if (!candidateOrderDate || candidateOrderDate > rDate) continue
      
      if (!orderHasRating.get(candidateOrder.orderId)) {
        assignedOrderId = candidateOrder.orderId
        break
      }
    }
    
    if (assignedOrderId) {
      orderHasRating.set(assignedOrderId, true)
    }
  }
  
  // Find the first order (newest first) that doesn't have a rating
  for (const candidateOrder of candidateOrders) {
    if (!orderHasRating.get(candidateOrder.orderId)) {
      return candidateOrder.orderId
    }
  }
  
  // All orders have ratings, return the most recent one
  return candidateOrders[0].orderId
}

// Helper function to determine which order a rating belongs to
// A rating belongs to a target order if it's the order that the rating should be assigned to
// IMPORTANT: This checks where an EXISTING rating (with ratingDate) belongs, not where a new rating would go
const ratingBelongsToOrder = (ratingDate: Date, targetOrder: Order, pizzaId: number): boolean => {
  // Don't pass preferredOrderId when checking existing ratings - we want to know where it actually belongs
  const orderId = findOrderForRatingByDate(ratingDate, pizzaId)
  return orderId === targetOrder.orderId
}

// Check if user has already rated a specific pizza for this order
const hasUserRatedPizza = (pizzaId: number, targetOrder: Order): boolean => {
  if (!auth.user?.userId || !targetOrder) return false
  
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  if (!pizzaRating) return false
  
  // Check if current user has rated this pizza
  const userRatings = pizzaRating.ratings.filter(rating => rating.userId === auth.user?.userId)
  if (userRatings.length === 0) return false
  
  // Check if any rating belongs to this order
  for (const rating of userRatings) {
    const ratingDate = new Date(rating.dateCreated)
    if (ratingBelongsToOrder(ratingDate, targetOrder, pizzaId)) {
      return true
    }
  }
  
  return false
}

// Get user's rating for a specific pizza for this order
const getUserRatingForPizza = (pizzaId: number, targetOrder: Order) => {
  if (!auth.user?.userId || !targetOrder) return null
  
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  if (!pizzaRating) return null
  
  // Find current user's ratings for this pizza
  const userRatings = pizzaRating.ratings.filter(rating => rating.userId === auth.user?.userId)
  if (userRatings.length === 0) return null
  
  // Find the rating that belongs to this order
  for (const rating of userRatings) {
    const ratingDate = new Date(rating.dateCreated)
    if (ratingBelongsToOrder(ratingDate, targetOrder, pizzaId)) {
      return rating
    }
  }
  
  return null
}

// Rating functions
const handleRateReviewClick = async (order: Order) => {
  // Check rating status first
  await checkOrderRatingStatus(order)
  
  // If not fully rated, open modal
  if (!isOrderFullyRated(order)) {
    await openRatingModal(order)
  }
}

const openRatingModal = async (order: Order) => {
  selectedOrder.value = order
  
  // Fetch ratings for all pizzas in the order to show "already rated" status
  if (order.orderLists) {
    for (const item of order.orderLists) {
      await ratingStore.fetchRatingsByPizzaId(item.pizzaId)
      // Initialize rating and message for each pizza
      if (!pizzaRatings.value.has(item.pizzaId)) {
        pizzaRatings.value.set(item.pizzaId, 0)
      }
      if (!pizzaMessages.value.has(item.pizzaId)) {
        pizzaMessages.value.set(item.pizzaId, '')
      }
    }
  }
  
  ratingModalOpen.value = true
}

const closeRatingModal = () => {
  ratingModalOpen.value = false
  selectedOrder.value = null
  pizzaRatings.value.clear()
  pizzaMessages.value.clear()
}

// Find which order a rating should belong to when submitting
// Returns the most recent order with this pizza that doesn't have a rating yet
const findOrderForRating = (pizzaId: number): Order | null => {
  if (!order.orders || order.orders.length === 0) return null
  
  // Get all delivered orders with this pizza, sorted by date (newest first)
  const candidateOrders = order.orders
    .filter(o => {
      if (!o.dateCreated || o.orderStatus !== 'delivered') return false
      return o.orderLists?.some(item => item.pizzaId === pizzaId)
    })
    .sort((a, b) => {
      const dateA = typeof a.dateCreated === 'string' ? new Date(a.dateCreated).getTime() : (a.dateCreated?.getTime() || 0)
      const dateB = typeof b.dateCreated === 'string' ? new Date(b.dateCreated).getTime() : (b.dateCreated?.getTime() || 0)
      if (dateB !== dateA) return dateB - dateA
      return (b.orderId || 0) - (a.orderId || 0)
    })
  
  if (candidateOrders.length === 0) return null
  
  // Check which order doesn't have a rating yet
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  const userRatings = pizzaRating ? pizzaRating.ratings.filter(r => r.userId === auth.user?.userId) : []
  
  for (const candidateOrder of candidateOrders) {
    const candidateOrderDate = candidateOrder.dateCreated ? (typeof candidateOrder.dateCreated === 'string' ? new Date(candidateOrder.dateCreated) : candidateOrder.dateCreated) : null
    if (!candidateOrderDate) continue
    
    // Check if this order already has a rating
    const hasRating = userRatings.some(rating => {
      const ratingDate = new Date(rating.dateCreated)
      // Simulate: if we create a rating now, would it belong to this order?
      const now = new Date()
      return ratingBelongsToOrder(ratingDate, candidateOrder, pizzaId)
    })
    
    if (!hasRating) {
      return candidateOrder
    }
  }
  
  // All orders have ratings, return the most recent one (shouldn't happen in practice)
  return candidateOrders[0]
}

const submitRating = async (pizzaId: number) => {
  const rating = pizzaRatings.value.get(pizzaId) || 0
  if (rating === 0) {
    alert('Please select a rating')
    return
  }

  if (!selectedOrder.value) return

  // Ensure orders are loaded
  if (!order.orders || order.orders.length === 0) {
    await order.fetchUserOrders()
  }

  // Check if current order already has a rating for this pizza
  if (hasUserRatedPizza(pizzaId, selectedOrder.value)) {
    alert('This pizza has already been rated for this order.')
    return
  }

  // Verify that the rating will be assigned to the current order
  // We do this by checking what order findOrderForRatingByDate would assign it to
  const now = new Date()
  const targetOrderId = findOrderForRatingByDate(now, pizzaId, selectedOrder.value.orderId)
  
  // If it would be assigned to a different order, that means the current order already has a rating
  // (This shouldn't happen if hasUserRatedPizza is working correctly, but double-check)
  if (targetOrderId && targetOrderId !== selectedOrder.value.orderId) {
    alert('This pizza has already been rated for this order.')
    return
  }

  isSubmittingRating.value = true
  try {
    const ratingRequest: RatingRequest = {
      pizzaId,
      ratingValue: rating,
      ratingMessage: pizzaMessages.value.get(pizzaId) || undefined
    }

    await ratingStore.createRating(ratingRequest)
    
    // Small delay to ensure backend has processed the rating
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Refresh ratings for this pizza to update the UI immediately
    await ratingStore.fetchRatingsByPizzaId(pizzaId)
    
    // Clear the cached rating status for this order to force a refresh
    orderRatedStatus.value.delete(selectedOrder.value.orderId)
    
    // Refresh rating status for the current order
    await checkOrderRatingStatus(selectedOrder.value)
    
    // Clear rating and message for this pizza to show the preview
    // The UI will automatically update to show "Already rated" status
    pizzaRatings.value.set(pizzaId, 0)
    pizzaMessages.value.set(pizzaId, '')
    
    // Check if all pizzas are now rated
    if (isOrderFullyRated(selectedOrder.value)) {
      closeRatingModal()
    }
    // Otherwise, keep modal open to show the preview and allow rating other items
  } catch (error) {
    console.error('Error submitting rating:', error)
  } finally {
    isSubmittingRating.value = false
  }
}

const handleTrackOrder = (orderId: number) => {
  router.push(`/order/track/${orderId}`)
}

const handleViewOrder = (orderId: number) => {
  router.push(`/order/track/${orderId}`)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = 'all' // Reset status tabs
  categoryFilter.value = 'all' // Reset category filter
  sortBy.value = ''
}

onBeforeMount(async () => {
  await order.fetchUserOrders()
  // Check rating status for all delivered orders
  await checkAllDeliveredOrdersRatingStatus()
})

// Check rating status for all delivered orders
const checkAllDeliveredOrdersRatingStatus = async () => {
  const deliveredOrders = order.orders.filter(o => o.orderStatus === 'delivered')
  
  // Check rating status for each delivered order
  for (const orderItem of deliveredOrders) {
    await checkOrderRatingStatus(orderItem)
  }
}

// Watch for orders changes and check rating status
watch(() => order.orders, async (newOrders) => {
  if (newOrders && newOrders.length > 0) {
    await checkAllDeliveredOrdersRatingStatus()
  }
}, { immediate: false })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserHeader />

    <div class="py-8 px-4 sm:px-8 lg:px-30 min-h-[calc(100vh-5rem)]">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">My Orders</h1>
        <p class="text-gray-600 mt-2">Track and manage all your pizza orders</p>
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
           <select
             v-model="categoryFilter"
             class="px-4 py-2 h-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-transparent"
           >
             <option value="all">All Categories</option>
             <option value="veggie">Veggie</option>
             <option value="meat-lovers">Meat Lovers</option>
             <option value="premium-specials">Premium Specials</option>
             <option value="seasonal-picks">Seasonal Picks</option>
           </select>
           <div class="lg:w-48">
             <select
               v-model="sortBy"
               class="w-full px-4 py-2 h-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-transparent"
             >
               <option value="" disabled>Sort by</option>
               <option value="order-number">Order Number</option>
               <option value="order-date">Order Date</option>
               <option value="price-low">Price: Low to High</option>
               <option value="price-high">Price: High to Low</option>
             </select>
           </div>
         </div>
       </div>

       <!-- Empty State - No Orders Found -->
       <div v-if="order.orders.length > 0 && filteredOrders.length === 0" class="text-center py-16">
         <div class="max-w-md mx-auto">
           <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
             <Search class="w-12 h-12 text-gray-400" />
           </div>
           <h3 class="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
           <p class="text-gray-600 mb-6">
             We couldn't find any orders matching your search criteria. Try adjusting your filters.
           </p>
           <button
             @click="clearAllFilters"
             class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
           >
             Clear Filters
           </button>
         </div>
       </div>

      <div class="space-y-6">
        <div v-for="o in filteredOrders" :key="o.orderId" class="bg-white rounded-lg shadow">
          <Card 
            @click="handleViewOrder(o.orderId)"
            class="w-full rounded-xl shadow-sm border-0 bg-white cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-sm">ORDER #{{ o.orderId }}</p>
                <p class="text-xs text-gray-500">{{ toDate(o.dateCreated as Date) }}</p>
              </div>
              <Badge
                :class="[
                  getStatusBadgeClass(o.orderStatus!),
                  'px-4 py-2 rounded-full flex items-center space-x-1 ',
                ]"
              >
                <component :is="getStatusIcon(o.orderStatus!)" class="w-3 h-3 mr-1" />
                {{ formatStatus(o.orderStatus!) }}
              </Badge>
            </CardHeader>

            <CardContent
              v-for="po in o.orderLists?.map((item) => {
                const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                return {
                  pizzaId: item.pizzaId,
                  pizzaName: p?.pizzaName,
                  quantity: item.quantity,
                  pizzaPrice: p?.pizzaPrice,
                  pizzaImage: p?.pizzaImage,
                }
              })"
              :key="po.pizzaId"
              class="flex items-center gap-2 py-2"
            >
              <img
                v-if="po.pizzaImage"
                :src="toBase64(po.pizzaImage as string)"
                alt="Hawaiian Delight"
                class="size-20 rounded-md object-cover"
              />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ po.pizzaName }}</p>
                <p class="text-xs text-gray-500">Qty: {{ po.quantity }}</p>
                <p class="text-sm font-semibold mt-1">₱{{ po.quantity * po.pizzaPrice! }}</p>
              </div>
            </CardContent>

            <div class="w-full grid place-items-center">
              <Separator class="max-w-[97%]" />
            </div>
            <CardFooter class="flex justify-between items-center py-3">
              <div>
                <p class="text-xs text-gray-500">{{ o.orderLists.length }} item</p>
                <p
                  class="font-semibold"
                  :class="o.orderStatus === 'cancelled' ? 'line-through' : ''"
                >
                  ₱{{
                    o.orderLists.reduce((total, item) => {
                      const p = pizza.pizzas.find((el) => el.pizzaId === item.pizzaId)
                      if (!p) return total
                      return total + p.pizzaPrice * item.quantity
                    }, 0)
                  }}
                </p>
              </div>
              <div v-if="o.orderStatus === 'pending'" class="space-x-4" @click.stop>
                <!-- Confirm Cancel Dialog -->
                <Dialog v-model:open="cancelConfirmationOpen">
                  <DialogTrigger>
                    <Button variant="outline" class="h-12 rounded-md px-4 py-2"> Cancel </Button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                      </DialogHeader>
                    <div>Are you sure you want to cancel this order?</div>
                    <div
                      v-for="po in o.orderLists?.map((item) => {
                        const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                        return {
                          pizzaId: item.pizzaId,
                          pizzaName: p?.pizzaName,
                          quantity: item.quantity,
                          pizzaPrice: p?.pizzaPrice,
                          pizzaImage: p?.pizzaImage,
                        }
                      })"
                      :key="po.pizzaId"
                      class="flex items-center gap-4 py-2"
                    >
                      <img
                        v-if="po.pizzaImage"
                        :src="toBase64(po.pizzaImage as string)"
                        alt="Hawaiian Delight"
                        class="size-16 rounded-md object-cover"
                      />
                      <div class="flex-1">
                        <p class="font-medium text-sm">{{ po.pizzaName }}</p>
                        <p class="text-xs text-gray-500">Qty: {{ po.quantity }}</p>
                        <p class="text-sm font-semibold mt-1">
                          ₱{{ po.quantity * po.pizzaPrice! }}
                        </p>
                      </div>
                    </div>
                    <DialogFooter class="flex justify-end space-x-2">
                      <Button variant="outline" @click="cancelConfirmationOpen = false">No</Button>
                      <Button @click="handleCancelOrder(o.orderId)">Yes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button @click="handleModifyOrder(o)" class="h-12 rounded-md px-4 py-2">
                  Modify Order
                </Button>
              </div>
              <div
                v-else-if="o.orderStatus === 'delivered' || o.orderStatus === 'cancelled'"
                class="space-x-4"
                @click.stop
              >
                 <Button 
                   v-if="o.orderStatus === 'delivered'"
                   variant="outline"
                   class="h-12 rounded-md px-4 py-2"
                   :disabled="isOrderFullyRated(o)"
                   @click="handleRateReviewClick(o)"
                 >
                   {{ isOrderFullyRated(o) ? 'Already Rated' : 'Rate & Review' }}
                 </Button>
                 <Button 
                   @click="handleReorder(o)" 
                   class="h-12 rounded-md px-4 py-2"
                 > 
                   Reorder 
                 </Button>
              </div>
              <div v-else class="space-x-4" @click.stop>
                <Button 
                  @click="handleTrackOrder(o.orderId)"
                  class="h-12 rounded-md px-4 py-2"
                > 
                  Track Order 
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Change address modal -->
      <Dialog v-model:open="showAddressModal">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{{ !isEdit ? 'Add' : 'Update' }} Delivery Address</DialogTitle>
            <DialogDescription>
              Enter your complete address for delivery within Cebu City.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <!-- First Row: City and Barangay -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="city">City *</Label>
                <Input
                  id="city"
                  v-model="locationForm.locationCity"
                  class="h-12 col-span-3"
                  disabled
                />
              </div>
              <div class="space-y-2">
                <Label for="barangay">Barangay *</Label>
                <Select v-model="locationForm.locationBrgy">
                  <SelectTrigger class="w-full py-5.5">
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="barangay in barangays" :key="barangay" :value="barangay">
                      {{ barangay }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Second Row: Street and House No -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="street">Street *</Label>
                <Input
                  class="h-12"
                  id="street"
                  v-model="locationForm.locationStreet"
                  placeholder="Enter street name"
                />
              </div>
              <div class="space-y-2">
                <Label for="houseNo">House No *</Label>
                <Input
                  class="h-12"
                  id="houseNo"
                  v-model="locationForm.locationHouseNo"
                  placeholder="Enter house number"
                />
              </div>
            </div>

            <!-- Third Row: Postal Code and Landmark (Optional) -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="postalCode">Postal Code</Label>
                <Input
                  class="h-12"
                  id="postalCode"
                  v-model="locationForm.locationPostal"
                  maxlength="4"
                  inputmode="numeric"
                  pattern="\d*"
                  @input="onPostalInput"
                  placeholder="Enter postal code"
                />
              </div>
              <div class="space-y-2">
                <Label for="landmark">Landmark</Label>
                <Input
                  class="h-12"
                  id="landmark"
                  v-model="locationForm.locationLandmark"
                  placeholder="Enter nearby landmark"
                />
              </div>
            </div>

            <!-- Save as default checkbox -->
            <div class="flex items-center space-x-2">
              <Checkbox id="saveDefault" v-model="locationForm.isDefault" />
              <Label for="saveDefault" class="text-sm font-normal"> Save as default address </Label>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-between gap-3">
            <Button
              class="w-[calc(50%-6px)] h-12"
              variant="outline"
              @click="showAddressModal = false"
            >
              Cancel
            </Button>
            <Button
              :disabled="location.isLoading"
              @click="saveAddress"
              class="w-[calc(50%-6px)] h-12 bg-primary hover:bg-primary/90"
            >
              <span v-if="location.isLoading">Saving...</span>
              <span v-else>Save Address</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Rating Modal -->
    <Dialog v-model:open="ratingModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate & Review Your Order</DialogTitle>
          <DialogDescription>
            Share your experience with the pizzas from this order
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedOrder" class="space-y-6">
          <!-- Order Items -->
          <div class="space-y-4">
            <h3 class="font-semibold text-gray-900">Rate each pizza:</h3>
            
            <div 
              v-for="orderItem in selectedOrder.orderLists?.map((item) => {
                const p = pizza.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                const userRating = getUserRatingForPizza(item.pizzaId, selectedOrder)
                return {
                  pizzaId: item.pizzaId,
                  pizzaName: p?.pizzaName || 'Unknown Pizza',
                  quantity: item.quantity,
                  pizzaPrice: p?.pizzaPrice || 0,
                  pizzaImage: p?.pizzaImage,
                  alreadyRated: hasUserRatedPizza(item.pizzaId, selectedOrder),
                  userRating: userRating
                }
              })"
              :key="orderItem.pizzaId"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-center gap-4 mb-4">
                <img
                  v-if="orderItem.pizzaImage"
                  :src="toBase64(orderItem.pizzaImage as string)"
                  :alt="orderItem.pizzaName"
                  class="w-16 h-16 rounded-lg object-cover"
                />
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ orderItem.pizzaName }}</h4>
                  <p class="text-sm text-gray-600">Qty: {{ orderItem.quantity }}</p>
                  <p v-if="orderItem.alreadyRated" class="text-sm text-green-600 font-medium">
                    ✓ Already rated ({{ orderItem.userRating?.ratingValue }} stars)
                  </p>
                </div>
              </div>
              
              <!-- Star Rating -->
              <div class="space-y-2" v-if="!orderItem.alreadyRated">
                <label class="text-sm font-medium text-gray-700">Rating:</label>
                <div class="flex gap-1">
                  <button
                    v-for="star in 5"
                    :key="star"
                    @click="pizzaRatings.set(orderItem.pizzaId, star)"
                    :class="[
                      'text-2xl transition-colors',
                      star <= (pizzaRatings.get(orderItem.pizzaId) || 0) ? 'text-yellow-400' : 'text-gray-300'
                    ]"
                  >
                    ★
                  </button>
                </div>
              </div>
              
              <!-- Show existing rating if already rated -->
              <div v-else class="space-y-2">
                <label class="text-sm font-medium text-gray-700">Your Rating:</label>
                <div class="flex gap-1">
                  <span
                    v-for="star in 5"
                    :key="star"
                    :class="[
                      'text-2xl',
                      star <= (orderItem.userRating?.ratingValue || 0) ? 'text-yellow-400' : 'text-gray-300'
                    ]"
                  >
                    ★
                  </span>
                </div>
                <p v-if="orderItem.userRating?.ratingMessage" class="text-sm text-gray-600 mt-2">
                  "{{ orderItem.userRating.ratingMessage }}"
                </p>
              </div>
              
              <!-- Review Message -->
              <div class="space-y-2" v-if="!orderItem.alreadyRated">
                <label class="text-sm font-medium text-gray-700">Review (optional):</label>
                <textarea
                  :value="pizzaMessages.get(orderItem.pizzaId) || ''"
                  @input="pizzaMessages.set(orderItem.pizzaId, ($event.target as HTMLTextAreaElement).value)"
                  placeholder="Share your thoughts about this pizza..."
                  class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows="3"
                ></textarea>
              </div>
              
              <!-- Submit Button -->
              <div class="flex justify-end" v-if="!orderItem.alreadyRated">
                <Button
                  @click="submitRating(orderItem.pizzaId)"
                  :disabled="isSubmittingRating || (pizzaRatings.get(orderItem.pizzaId) || 0) === 0"
                  class="bg-primary hover:bg-primary/90"
                >
                  {{ isSubmittingRating ? 'Submitting...' : 'Submit Rating' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="closeRatingModal">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Footer />
  </div>
</template>