<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Check,
  ChefHat,
  Package,
  Bike,
  Home,
  MapPin,
  FileText,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-vue-next'
import { useOrderStore } from '@/stores/orders'
import { usePizzaStore } from '@/stores/pizza'
import { useLocationStore } from '@/stores/location'
import { useRatingStore } from '@/stores/rating'
import { useAuthStore } from '@/stores/auth'
import { toBase64, toDate } from '@/plugins/convert'
import type { Order } from '@/models/order'
import type { Pizza } from '@/models/pizza'
import type { Location } from '@/models/location'
import type { RatingRequest } from '@/models/rating'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const pizzaStore = usePizzaStore()
const locationStore = useLocationStore()
const ratingStore = useRatingStore()
const auth = useAuthStore()

// Get order ID from route params
const orderId = computed(() => parseInt(route.params.id as string))

// Order data
const order = ref<Order | null>(null)
const orderPizzas = ref<Pizza[]>([])
const deliveryLocation = ref<Location | null>(null)

// Rating modal state
const ratingModalOpen = ref(false)
const pizzaRatings = ref<Map<number, number>>(new Map()) // Track rating for each pizza (pizzaId -> rating)
const pizzaMessages = ref<Map<number, string>>(new Map()) // Track message for each pizza (pizzaId -> message)
const isSubmittingRating = ref(false)
const orderRatedStatus = ref<Map<number, boolean>>(new Map()) // Track which orders are fully rated

// Timer for updating remaining time
const updateTimer = ref<ReturnType<typeof setInterval> | null>(null)
const forceUpdate = ref(0) // Force reactivity update

// Order progress steps
const orderSteps = ref([
  {
    id: 'pending',
    label: 'Receive (Pending)',
    description: "We've received your order",
    icon: Check,
    completed: false,
    active: false,
    time: null, // Will be set based on actual order data
    color: 'green',
  },
  {
    id: 'preparing',
    label: 'Preparing Your Pizza',
    description: 'Our chefs are crafting your order',
    icon: ChefHat,
    completed: false,
    active: false,
    time: null, // Will be set based on actual order data
    color: 'orange',
  },
  {
    id: 'ready',
    label: 'Ready for Delivery',
    description: 'Your order is packed and ready',
    icon: Package,
    completed: false,
    active: false,
    time: null, // Will be set based on actual order data
    color: 'blue',
  },
  {
    id: 'out for delivery',
    label: 'Out for Delivery',
    description: 'Your order is on the way',
    icon: Bike,
    completed: false,
    active: false,
    time: null, // Will be set based on actual order data
    color: 'purple',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your delicious pizza!',
    icon: Home,
    completed: false,
    active: false,
    time: null, // Will be set based on actual order data
    color: 'gray',
  },
])

// Helper function to parse estimate string like "25-35 mins" or "15-25 mins"
const parseEstimate = (estimate: string): { min: number; max: number } | null => {
  const match = estimate.match(/(\d+)-(\d+)\s*mins?/)
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) }
  }
  return null
}

// Helper function to convert UTC date to Manila time (+8 hours)
const toManilaTime = (date: Date): Date => {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000)
}

// Computed properties
const estimatedDelivery = computed(() => {
  // Just show the estimate range (e.g., "25-35 mins")
  if (!order.value?.orderEstimate) return 'TBD'
  return order.value.orderEstimate
})

const remainingTime = computed(() => {
  // Force reactivity by referencing forceUpdate
  const _ = forceUpdate.value

  // If order is delivered or cancelled, don't show remaining time
  if (!order.value || order.value.orderStatus === 'delivered') {
    return 'Delivered'
  }
  if (order.value.orderStatus === 'cancelled') {
    return 'Cancelled'
  }

  if (!order.value.orderEstimate || !order.value.dateCreated) {
    return 'Calculating...'
  }

  const estimate = parseEstimate(order.value.orderEstimate)
  if (!estimate) return 'Calculating...'

  // Parse the order creation date - handle both string and Date objects
  // dateCreated is stored as UTC in the database, so we need to parse it correctly
  let orderTime: Date
  if (typeof order.value.dateCreated === 'string') {
    // If it's a string, parse it - if it doesn't have timezone info, assume UTC
    const dateStr = order.value.dateCreated
    // If the string doesn't end with Z or timezone, it might be interpreted as local time
    // So we'll explicitly parse it as UTC if needed
    orderTime = dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-', 10)
      ? new Date(dateStr)
      : new Date(dateStr + 'Z') // Add Z to indicate UTC if not present
  } else if (order.value.dateCreated instanceof Date) {
    orderTime = order.value.dateCreated
  } else {
    return 'Calculating...'
  }

  // Check if date is valid
  if (isNaN(orderTime.getTime())) {
    return 'Calculating...'
  }

  const now = new Date()
  const elapsedMs = now.getTime() - orderTime.getTime()
  
  // If order time is in the future (shouldn't happen, but handle edge case)
  if (elapsedMs < 0) {
    // Order is in the future, show full estimate
    return `${estimate.min}-${estimate.max} mins remaining`
  }
  
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

  // Calculate remaining time (how much time is left from the estimate)
  const remainingMin = Math.max(0, estimate.min - elapsedMinutes)
  const remainingMax = Math.max(0, estimate.max - elapsedMinutes)

  // Debug: Log the calculation (remove in production if needed)
  // console.log('Order time:', orderTime, 'Now:', now, 'Elapsed:', elapsedMinutes, 'Remaining:', remainingMin, '-', remainingMax)

  // Only show "Arriving soon" when BOTH min and max have passed (all time has elapsed)
  if (remainingMax <= 0 && remainingMin <= 0) {
    return 'Arriving soon'
  }

  // If min time has passed but max hasn't, show remaining max time
  if (remainingMin <= 0 && remainingMax > 0) {
    return `${remainingMax} min${remainingMax !== 1 ? 's' : ''} remaining`
  }

  // If both are still positive, show the range
  if (remainingMin > 0 && remainingMax > 0) {
    return `${remainingMin}-${remainingMax} mins remaining`
  }

  // Fallback
  return 'Calculating...'
})

const orderDate = computed(() => {
  if (!order.value?.dateCreated) return ''
  // Use toDate function which handles timezone conversion (UTC to Manila time +8 hours)
  const dateStr = toDate(order.value.dateCreated as Date)
  // Replace the comma before time with bullet point to match the design
  return dateStr.replace(', ', ' • ')
})

const subtotal = computed(() => {
  if (!order.value?.orderLists || !orderPizzas.value.length) return 0
  return order.value.orderLists.reduce((sum, item) => {
    const pizza = orderPizzas.value.find((p) => p.pizzaId === item.pizzaId)
    return sum + (pizza?.pizzaPrice || 0) * item.quantity
  }, 0)
})

const deliveryFee = computed(() => {
  return 50 // Fixed delivery fee
})

const totalAmount = computed(() => {
  return subtotal.value + deliveryFee.value
})

// Methods
const getStepColor = (step: any) => {
  if (step.completed) {
    return 'bg-green-500 text-white'
  } else if (step.active) {
    // Use different colors for active steps based on their assigned color
    switch (step.color) {
      case 'green':
        return 'bg-primary text-white' // Receive step uses primary color when active
      case 'orange':
        return 'bg-primary text-white' // Preparing step uses primary color when active
      case 'blue':
        return 'bg-blue-500 text-white' // Ready step uses blue when active
      case 'purple':
        return 'bg-purple-500 text-white' // Out for delivery uses purple when active
      case 'gray':
        return 'bg-gray-500 text-white' // Delivered uses gray when active
      default:
        return 'bg-primary text-white'
    }
  } else {
    return 'bg-gray-300 text-gray-600'
  }
}

const getStepIcon = (step: any) => {
  if (step.completed) {
    return Check // Show checkmark for completed steps
  } else {
    return step.icon // Show original icon for active/pending steps
  }
}

const getLineColor = (step: any) => {
  return step.completed ? 'bg-green-500' : 'bg-gray-300'
}

const updateOrderProgress = () => {
  if (!order.value?.orderStatus) return

  // Map order status to step index
  const statusMap: { [key: string]: number } = {
    pending: 0,
    preparing: 1,
    ready: 2,
    'out for delivery': 3,
    delivered: 4,
    cancelled: -1, // Special case for cancelled orders
  }

  const statusIndex = statusMap[order.value.orderStatus] ?? 0

  if (statusIndex === -1) {
    // For cancelled orders, show all steps as incomplete
    orderSteps.value.forEach((step, index) => {
      step.completed = false
      step.active = false
      step.time = null
    })
  } else {
    // Get order creation time and convert to Manila time (+8 hours)
    const orderTime = order.value.dateCreated ? new Date(order.value.dateCreated) : new Date()
    const manilaOrderTime = toManilaTime(orderTime)

    orderSteps.value.forEach((step, index) => {
      // Special case for delivered status - all steps are completed
      if (order.value?.orderStatus === 'delivered') {
        step.completed = true
        step.active = false
      } else {
        // Mark steps as completed if they come before the current status
        step.completed = index < statusIndex
        // Mark the current step as active
        step.active = index === statusIndex
      }

      // Set time only for completed and active steps
      if (step.completed || step.active) {
        // Calculate time based on step progression (using Manila time)
        const stepTime = new Date(manilaOrderTime.getTime() + index * 15 * 60 * 1000) // Add 15 minutes per step
        step.time = stepTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      } else {
        step.time = null // No time for pending steps
      }
    })
  }
}

const fetchOrderData = async () => {
  try {
    // Fetch order details
    await orderStore.fetchUserOrders()
    const foundOrder = orderStore.orders.find((o) => o.orderId === orderId.value)

    if (foundOrder) {
      order.value = foundOrder

      // Fetch pizza details for order items
      await pizzaStore.fetchAll()
      console.log('Pizza store pizzas:', pizzaStore.pizzas)
      console.log('Order lists:', foundOrder.orderLists)

      orderPizzas.value = foundOrder.orderLists.map((item) => {
        const pizza = pizzaStore.pizzas.find((p) => p.pizzaId === item.pizzaId)
        console.log('Looking for pizza ID:', item.pizzaId, 'Found:', pizza)
        return (
          pizza || {
            pizzaId: item.pizzaId,
            pizzaName: 'Unknown Pizza',
            pizzaDescription: 'Pizza details not available',
            pizzaPrice: 0,
            pizzaImage: null,
          }
        )
      })

      console.log('Order pizzas:', orderPizzas.value)

      // Fetch delivery location
      if (foundOrder.locationId) {
        await locationStore.fetchLocations()
        deliveryLocation.value =
          locationStore.locations.find((loc) => loc.locationId === foundOrder.locationId) || null
      }

      updateOrderProgress()
    }
  } catch (error) {
    console.error('Error fetching order data:', error)
  }
}

const handleModifyOrder = () => {
  if (order.value) {
    router.push(`/order/modify/${order.value.orderId}`)
  }
}

const handleCancelOrder = () => {
  // Implement cancel order logic
  console.log('Cancel order:', order.value?.orderId)
}

const handleReorder = () => {
  if (!order.value) return
  // Set the pending order with the same items from the previous order
  orderStore.setPendingOrder(order.value.orderLists as any[])
  // Navigate to complete order page
  router.push('/order/complete')
}

const handleViewOnMap = () => {
  if (!deliveryLocation.value) return

  // Construct the full address
  const address = `${deliveryLocation.value.locationHouseNo} ${deliveryLocation.value.locationStreet}, Barangay ${deliveryLocation.value.locationBrgy}, ${deliveryLocation.value.locationCity}, ${deliveryLocation.value.locationPostal}`

  // Encode the address for URL
  const encodedAddress = encodeURIComponent(address)

  // Open Google Maps with the address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  window.open(googleMapsUrl, '_blank')
}

const goBack = () => {
  router.back()
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
  if (!orderStore.orders || orderStore.orders.length === 0) {
    await orderStore.fetchUserOrders()
  }

  // Get all pizza IDs from the order
  const orderPizzaIds = targetOrder.orderLists.map((item) => item.pizzaId)

  // Check if user has rated all pizzas in this order
  for (const pizzaId of orderPizzaIds) {
    const pizzaRating = await ratingStore.fetchRatingsByPizzaId(pizzaId)
    if (!pizzaRating) return false

    // Check if current user has a rating for this pizza that belongs to this order
    const userRatings = pizzaRating.ratings.filter((rating) => rating.userId === auth.user?.userId)
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

// Helper function to find which order a rating belongs to
// SIMPLE RULE: If preferredOrderId is provided, assign to that order (if valid and doesn't have rating)
// Otherwise, find the most recent order without a rating
const findOrderForRatingByDate = (
  ratingDate: Date,
  pizzaId: number,
  preferredOrderId?: number,
  checkingExistingRating: boolean = false,
): number | null => {
  if (!orderStore.orders || orderStore.orders.length === 0) return null

  // If preferredOrderId is provided and we're creating a NEW rating, ALWAYS assign to it if valid
  // (hasUserRatedPizza should have already checked if it has a rating)
  if (preferredOrderId && !checkingExistingRating) {
    const preferredOrder = orderStore.orders.find((o) => o.orderId === preferredOrderId)
    if (preferredOrder) {
      // Check if order is delivered and contains the pizza
      if (
        preferredOrder.orderStatus === 'delivered' &&
        preferredOrder.orderLists?.some((item) => item.pizzaId === pizzaId)
      ) {
        const preferredOrderDate = preferredOrder.dateCreated
          ? typeof preferredOrder.dateCreated === 'string'
            ? new Date(preferredOrder.dateCreated)
            : preferredOrder.dateCreated
          : null

        // Check if order was delivered before rating date
        if (preferredOrderDate && preferredOrderDate <= ratingDate) {
          // For NEW ratings, just return preferredOrderId - hasUserRatedPizza already verified it doesn't have a rating
          return preferredOrderId
        }
      }
    }
  }

  // Fallback: find most recent order without rating (for checking where existing ratings belong)
  const candidateOrders = orderStore.orders
    .filter((o) => {
      if (!o.dateCreated || o.orderStatus !== 'delivered') return false
      const oDate = typeof o.dateCreated === 'string' ? new Date(o.dateCreated) : o.dateCreated
      return oDate <= ratingDate && o.orderLists?.some((item) => item.pizzaId === pizzaId)
    })
    .sort((a, b) => {
      const dateA =
        typeof a.dateCreated === 'string'
          ? new Date(a.dateCreated).getTime()
          : a.dateCreated?.getTime() || 0
      const dateB =
        typeof b.dateCreated === 'string'
          ? new Date(b.dateCreated).getTime()
          : b.dateCreated?.getTime() || 0
      if (dateB !== dateA) return dateB - dateA
      return (b.orderId || 0) - (a.orderId || 0)
    })

  if (candidateOrders.length === 0) return null

  // Get existing ratings
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  const userRatings = pizzaRating
    ? pizzaRating.ratings.filter((r) => r.userId === auth.user?.userId)
    : []

  // Create a map to track which orders have ratings
  // Process ratings chronologically to assign them correctly
  const orderHasRating = new Map<number, boolean>()

  // Sort ratings by date (oldest first) to process them in order
  const sortedRatings = [...userRatings].sort(
    (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime(),
  )

  for (const rating of sortedRatings) {
    const rDate = new Date(rating.dateCreated)
    if (rDate > ratingDate) continue // Skip ratings after target date

    // Find the most recent order (by date, then orderId) that:
    // 1. Was delivered before this rating
    // 2. Doesn't already have a rating assigned
    let assignedOrderId: number | null = null
    for (const candidateOrder of candidateOrders) {
      const candidateOrderDate = candidateOrder.dateCreated
        ? typeof candidateOrder.dateCreated === 'string'
          ? new Date(candidateOrder.dateCreated)
          : candidateOrder.dateCreated
        : null
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
  const userRatings = pizzaRating.ratings.filter((rating) => rating.userId === auth.user?.userId)
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
  const userRatings = pizzaRating.ratings.filter((rating) => rating.userId === auth.user?.userId)
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
const handleRateReviewClick = async () => {
  if (!order.value) return

  // Check rating status first
  await checkOrderRatingStatus(order.value)

  // If not fully rated, open modal
  if (!isOrderFullyRated(order.value)) {
    await openRatingModal()
  }
}

const openRatingModal = async () => {
  if (!order.value) return

  // Fetch ratings for all pizzas in the order to show "already rated" status
  if (order.value.orderLists) {
    for (const item of order.value.orderLists) {
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
  pizzaRatings.value.clear()
  pizzaMessages.value.clear()
}

// Find which order a rating should belong to when submitting
// Returns the most recent order with this pizza that doesn't have a rating yet
const findOrderForRating = (pizzaId: number): Order | null => {
  if (!orderStore.orders || orderStore.orders.length === 0) return null

  // Get all delivered orders with this pizza, sorted by date (newest first)
  const candidateOrders = orderStore.orders
    .filter((o) => {
      if (!o.dateCreated || o.orderStatus !== 'delivered') return false
      return o.orderLists?.some((item) => item.pizzaId === pizzaId)
    })
    .sort((a, b) => {
      const dateA =
        typeof a.dateCreated === 'string'
          ? new Date(a.dateCreated).getTime()
          : a.dateCreated?.getTime() || 0
      const dateB =
        typeof b.dateCreated === 'string'
          ? new Date(b.dateCreated).getTime()
          : b.dateCreated?.getTime() || 0
      if (dateB !== dateA) return dateB - dateA
      return (b.orderId || 0) - (a.orderId || 0)
    })

  if (candidateOrders.length === 0) return null

  // Check which order doesn't have a rating yet
  const pizzaRating = ratingStore.getPizzaRating(pizzaId)
  const userRatings = pizzaRating
    ? pizzaRating.ratings.filter((r) => r.userId === auth.user?.userId)
    : []

  for (const candidateOrder of candidateOrders) {
    const candidateOrderDate = candidateOrder.dateCreated
      ? typeof candidateOrder.dateCreated === 'string'
        ? new Date(candidateOrder.dateCreated)
        : candidateOrder.dateCreated
      : null
    if (!candidateOrderDate) continue

    // Check if this order already has a rating
    const hasRating = userRatings.some((rating) => {
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

  if (!order.value) return

  // Ensure orders are loaded
  if (!orderStore.orders || orderStore.orders.length === 0) {
    await orderStore.fetchUserOrders()
  }

  // Check if current order already has a rating for this pizza
  if (hasUserRatedPizza(pizzaId, order.value)) {
    alert('This pizza has already been rated for this order.')
    return
  }

  // Verify that the rating will be assigned to the current order
  // We do this by checking what order findOrderForRatingByDate would assign it to
  const now = new Date()
  const targetOrderId = findOrderForRatingByDate(now, pizzaId, order.value.orderId)

  // If it would be assigned to a different order, that means the current order already has a rating
  // (This shouldn't happen if hasUserRatedPizza is working correctly, but double-check)
  if (targetOrderId && targetOrderId !== order.value.orderId) {
    alert('This pizza has already been rated for this order.')
    return
  }

  isSubmittingRating.value = true
  try {
    const ratingRequest: RatingRequest = {
      pizzaId,
      ratingValue: rating,
      ratingMessage: pizzaMessages.value.get(pizzaId) || undefined,
    }

    await ratingStore.createRating(ratingRequest)

    // Small delay to ensure backend has processed the rating
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Refresh ratings for this pizza to update the UI immediately
    await ratingStore.fetchRatingsByPizzaId(pizzaId)

    // Clear the cached rating status for this order to force a refresh
    orderRatedStatus.value.delete(order.value.orderId)

    // Refresh rating status for the current order
    await checkOrderRatingStatus(order.value)

    // Clear rating and message for this pizza to show the preview
    // The UI will automatically update to show "Already rated" status
    pizzaRatings.value.set(pizzaId, 0)
    pizzaMessages.value.set(pizzaId, '')

    // Check if all pizzas are now rated
    if (isOrderFullyRated(order.value)) {
      closeRatingModal()
    }
    // Otherwise, keep modal open to show the preview and allow rating other items
  } catch (error) {
    console.error('Error submitting rating:', error)
  } finally {
    isSubmittingRating.value = false
  }
}

onMounted(async () => {
  await fetchOrderData()
  // Check rating status if order is delivered
  if (order.value && order.value.orderStatus === 'delivered') {
    await checkOrderRatingStatus(order.value)
  }

  // Set up timer to update remaining time every minute
  updateTimer.value = setInterval(() => {
    forceUpdate.value++
  }, 60000) // Update every 60 seconds
})

onBeforeUnmount(() => {
  // Clean up timer
  if (updateTimer.value) {
    clearInterval(updateTimer.value)
    updateTimer.value = null
  }
})

// Watch for order changes and check rating status
watch(
  () => order.value,
  async (newOrder) => {
    if (newOrder && newOrder.orderStatus === 'delivered') {
      await checkOrderRatingStatus(newOrder)
    }
  },
  { immediate: false },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserHeader />

    <div class="py-8 px-4 sm:px-8 lg:px-30 min-h-[calc(100vh-5rem)]">
      <!-- Back Button -->
      <div class="mb-6">
        <Button
          variant="ghost"
          @click="goBack"
          class="flex items-center gap-2 text-gray-600 hover:text-white"
        >
          <ArrowLeft class="w-4 h-4" />
          Back to Orders
        </Button>
      </div>

      <!-- Track Your Order Header Card -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div class="flex justify-between items-start">
          <!-- Left Side - Title and Order Info -->
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-3">Track Your Order</h1>
            <p class="text-gray-600 text-lg font-medium mb-1">Order #CC{{ orderId }}</p>
            <p class="text-gray-600 text-sm">{{ orderDate }}</p>
          </div>

          <!-- Right Side - Estimated Delivery Box -->
          <div
            v-if="order?.orderStatus !== 'cancelled'"
            class="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center min-w-[200px]"
          >
            <p class="text-primary text-sm font-medium mb-2">Estimated Delivery</p>
            <p class="text-3xl font-bold text-gray-900 mb-2">{{ estimatedDelivery }}</p>
            <p class="text-gray-600 text-sm">{{ remainingTime }}</p>
          </div>

          <!-- Cancelled Order Box -->
          <div
            v-else
            class="bg-red-50 border border-red-200 rounded-lg p-4 text-center min-w-[200px]"
          >
            <p class="text-red-600 text-sm font-medium mb-2">Order Status</p>
            <p class="text-3xl font-bold text-gray-900 mb-2">Cancelled</p>
            <p class="text-gray-600 text-sm">No delivery scheduled</p>
          </div>
        </div>
      </div>

      <!-- Order Progress Section -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Order Progress</h2>

        <!-- Special message for cancelled orders -->
        <div v-if="order?.orderStatus === 'cancelled'" class="text-center py-8">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <X class="w-8 h-8 text-red-500" />
          </div>
          <h3 class="text-xl font-semibold text-red-600 mb-2">Order Cancelled</h3>
          <p class="text-gray-600">This order has been cancelled and will not be processed.</p>
        </div>

        <!-- Normal progress for other orders -->
        <div v-else class="w-full">
          <div class="flex items-start justify-between relative">
            <div
              v-for="(step, index) in orderSteps"
              :key="step.id"
              class="flex flex-col items-center relative z-10 flex-1"
            >
              <!-- Step Circle -->
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                  getStepColor(step),
                ]"
              >
                <component :is="getStepIcon(step)" class="w-6 h-6" />
              </div>

              <!-- Step Content -->
              <div class="text-center max-w-[140px]">
                <h3
                  :class="[
                    'text-sm font-semibold mb-1',
                    step.completed || step.active ? 'text-gray-900' : 'text-gray-500',
                  ]"
                >
                  {{ step.label }}
                </h3>
                <p
                  :class="[
                    'text-xs mb-1 leading-tight',
                    step.completed || step.active ? 'text-gray-600' : 'text-gray-400',
                  ]"
                >
                  {{ step.description }}
                </p>
                <span
                  v-if="step.time"
                  :class="[
                    'text-xs font-medium',
                    step.completed || step.active ? 'text-primary' : 'text-gray-400',
                  ]"
                >
                  {{ step.time }}
                </span>
              </div>

              <!-- Progress Line Segment - Only between steps -->
              <div
                v-if="index < orderSteps.length - 1"
                :class="[
                  'absolute top-6 h-0.5',
                  'left-1/2 transform translate-x-6',
                  getLineColor(step),
                ]"
                :style="{ width: 'calc(100% - 3rem)' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Order Details (2/3 width) -->
        <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Order Details</h2>

          <div class="space-y-4">
            <!-- Order Items -->
            <div
              v-for="orderItem in order?.orderLists"
              :key="orderItem.pizzaId"
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div
                class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)?.pizzaImage"
                  :src="
                    toBase64(
                      orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)
                        ?.pizzaImage as string,
                    )
                  "
                  :alt="orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)?.pizzaName"
                  class="w-full h-full object-cover rounded-lg"
                />
                <div v-else class="w-full h-full bg-gray-300 rounded-lg"></div>
              </div>

              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">
                  {{
                    orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)?.pizzaName || 'Pizza'
                  }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  {{
                    orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)?.pizzaDescription ||
                    'Premium ingredients...'
                  }}
                </p>
                <p class="text-sm text-gray-500 mt-1">Qty: {{ orderItem.quantity }}</p>
              </div>

              <div class="text-right">
                <p class="font-semibold text-primary">
                  ₱{{
                    (
                      (orderPizzas.find((p) => p.pizzaId === orderItem.pizzaId)?.pizzaPrice || 0) *
                      orderItem.quantity
                    ).toFixed(0)
                  }}
                </p>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="border-t pt-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span class="font-medium text-gray-600">₱{{ subtotal.toFixed(0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Delivery Fee</span>
                <span class="font-medium text-gray-600">₱{{ deliveryFee }}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span class="text-gray-900">Total Amount</span>
                <span class="text-gray-900">₱{{ totalAmount.toFixed(0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Delivery Info & Actions (1/3 width) -->
        <div class="space-y-6">
          <!-- Delivery Information -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>

            <div class="space-y-4">
              <!-- Delivery Address -->
              <div class="flex items-start gap-3">
                <MapPin class="w-5 h-5 text-primary mt-0.5" />
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">Delivery Address</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {{
                      deliveryLocation
                        ? `${deliveryLocation.locationHouseNo} ${deliveryLocation.locationStreet}, Barangay ${deliveryLocation.locationBrgy} ${deliveryLocation.locationCity}, ${deliveryLocation.locationPostal}`
                        : '123 Lahug Street, Barangay Lahug Cebu City, 6000'
                    }}
                  </p>
                  <button
                    @click="handleViewOnMap"
                    class="text-primary text-sm font-medium mt-1 hover:text-primary/80"
                  >
                    View on Map
                  </button>
                </div>
              </div>

              <!-- Special Instructions -->
              <div class="flex items-start gap-3">
                <FileText class="w-5 h-5 text-primary mt-0.5" />
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">Special Instructions</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {{
                      order?.orderInstruction ||
                      'Please ring the doorbell twice. Leave at front door if no answer.'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions - Only show when actions are available -->
          <div
            v-if="
              order?.orderStatus === 'pending' ||
              order?.orderStatus === 'delivered' ||
              order?.orderStatus === 'cancelled'
            "
            class="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>

            <div class="space-y-3">
              <!-- Actions for pending orders only -->
              <template v-if="order?.orderStatus === 'pending'">
                <Button @click="handleModifyOrder" class="w-full h-12 rounded-md px-4 py-2">
                  Modify Order
                </Button>
                <Button
                  @click="handleCancelOrder"
                  variant="outline"
                  class="w-full h-12 rounded-md px-4 py-2"
                >
                  Cancel
                </Button>
              </template>

              <!-- Actions for delivered orders -->
              <template v-else-if="order?.orderStatus === 'delivered'">
                <Button
                  variant="outline"
                  class="w-full h-12 rounded-md px-4 py-2"
                  :disabled="isOrderFullyRated(order!)"
                  @click="handleRateReviewClick"
                >
                  {{ isOrderFullyRated(order!) ? 'Already Rated' : 'Rate & Review' }}
                </Button>
                <Button @click="handleReorder" class="w-full h-12 rounded-md px-4 py-2">
                  Reorder
                </Button>
              </template>

              <!-- Actions for cancelled orders -->
              <template v-else-if="order?.orderStatus === 'cancelled'">
                <Button @click="handleReorder" class="w-full h-12 rounded-md px-4 py-2">
                  Reorder
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>
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

        <div v-if="order" class="space-y-6">
          <!-- Order Items -->
          <div class="space-y-4">
            <h3 class="font-semibold text-gray-900">Rate each pizza:</h3>

            <div
              v-for="orderItem in order.orderLists?.map((item) => {
                const p = pizzaStore.pizzas.find((pz) => pz.pizzaId === item.pizzaId)
                const userRating = getUserRatingForPizza(item.pizzaId, order)
                return {
                  pizzaId: item.pizzaId,
                  pizzaName: p?.pizzaName || 'Unknown Pizza',
                  quantity: item.quantity,
                  pizzaPrice: p?.pizzaPrice || 0,
                  pizzaImage: p?.pizzaImage,
                  alreadyRated: hasUserRatedPizza(item.pizzaId, order),
                  userRating: userRating,
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
                      star <= (pizzaRatings.get(orderItem.pizzaId) || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300',
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
                      star <= (orderItem.userRating?.ratingValue || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300',
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
                  @input="
                    pizzaMessages.set(
                      orderItem.pizzaId,
                      ($event.target as HTMLTextAreaElement).value,
                    )
                  "
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

    <!-- Footer -->
    <Footer />
  </div>
</template>
