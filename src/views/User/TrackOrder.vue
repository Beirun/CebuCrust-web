<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserHeader from '@/components/UserHeader.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  X
} from 'lucide-vue-next'
import { useOrderStore } from '@/stores/orders'
import { usePizzaStore } from '@/stores/pizza'
import { useLocationStore } from '@/stores/location'
import { toBase64 } from '@/plugins/convert'
import type { Order } from '@/models/order'
import type { Pizza } from '@/models/pizza'
import type { Location } from '@/models/location'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const pizzaStore = usePizzaStore()
const locationStore = useLocationStore()

// Get order ID from route params
const orderId = computed(() => parseInt(route.params.id as string))

// Order data
const order = ref<Order | null>(null)
const orderPizzas = ref<Pizza[]>([])
const deliveryLocation = ref<Location | null>(null)

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
    color: 'green'
  },
  { 
    id: 'preparing', 
    label: 'Preparing Your Pizza', 
    description: 'Our chefs are crafting your order',
    icon: ChefHat,
    completed: false, 
    active: false,
    time: null, // Will be set based on actual order data
    color: 'orange'
  },
  { 
    id: 'ready', 
    label: 'Ready for Delivery', 
    description: 'Your order is packed and ready',
    icon: Package,
    completed: false, 
    active: false,
    time: null, // Will be set based on actual order data
    color: 'blue'
  },
  { 
    id: 'out_for_delivery', 
    label: 'Out for Delivery', 
    description: 'Your order is on the way',
    icon: Bike,
    completed: false, 
    active: false,
    time: null, // Will be set based on actual order data
    color: 'purple'
  },
  { 
    id: 'delivered', 
    label: 'Delivered', 
    description: 'Enjoy your delicious pizza!',
    icon: Home,
    completed: false, 
    active: false,
    time: null, // Will be set based on actual order data
    color: 'gray'
  },
])

// Computed properties
const estimatedDelivery = computed(() => {
  if (!order.value?.orderEstimate) return '3:15 PM'
  return order.value.orderEstimate
})

const remainingTime = computed(() => {
  // Mock calculation - in real app, calculate based on order time and estimated delivery
  return '25-30 mins remaining'
})

const orderDate = computed(() => {
  if (!order.value?.dateCreated) return 'October 15, 2024 • 2:30 PM'
  const date = new Date(order.value.dateCreated)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }) + ' • ' + date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
})

const subtotal = computed(() => {
  if (!order.value?.orderLists || !orderPizzas.value.length) return 0
  return order.value.orderLists.reduce((sum, item) => {
    const pizza = orderPizzas.value.find(p => p.pizzaId === item.pizzaId)
    return sum + ((pizza?.pizzaPrice || 0) * item.quantity)
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
      case 'green': return 'bg-primary text-white' // Receive step uses primary color when active
      case 'orange': return 'bg-primary text-white' // Preparing step uses primary color when active
      case 'blue': return 'bg-blue-500 text-white' // Ready step uses blue when active
      case 'purple': return 'bg-purple-500 text-white' // Out for delivery uses purple when active
      case 'gray': return 'bg-gray-500 text-white' // Delivered uses gray when active
      default: return 'bg-primary text-white'
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
    'pending': 0,
    'preparing': 1,
    'ready': 2,
    'out_for_delivery': 3,
    'delivered': 4,
    'cancelled': -1 // Special case for cancelled orders
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
    // Get order creation time
    const orderTime = order.value.dateCreated ? new Date(order.value.dateCreated) : new Date()
    
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
        // Calculate time based on step progression
        const stepTime = new Date(orderTime.getTime() + (index * 15 * 60 * 1000)) // Add 15 minutes per step
        step.time = stepTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
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
    const foundOrder = orderStore.orders.find(o => o.orderId === orderId.value)
    
    if (foundOrder) {
      order.value = foundOrder
      
      // Fetch pizza details for order items
      await pizzaStore.fetchAll()
      console.log('Pizza store pizzas:', pizzaStore.pizzas)
      console.log('Order lists:', foundOrder.orderLists)
      
      orderPizzas.value = foundOrder.orderLists.map(item => {
        const pizza = pizzaStore.pizzas.find(p => p.pizzaId === item.pizzaId)
        console.log('Looking for pizza ID:', item.pizzaId, 'Found:', pizza)
        return pizza || {
          pizzaId: item.pizzaId,
          pizzaName: 'Unknown Pizza',
          pizzaDescription: 'Pizza details not available',
          pizzaPrice: 0,
          pizzaImage: null
        }
      })
      
      console.log('Order pizzas:', orderPizzas.value)
      
      // Fetch delivery location
      if (foundOrder.locationId) {
        await locationStore.fetchLocations()
        deliveryLocation.value = locationStore.locations.find(loc => loc.locationId === foundOrder.locationId) || null
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

onMounted(() => {
  fetchOrderData()
})
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
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  getStepColor(step)
                ]"
              >
                <component :is="getStepIcon(step)" class="w-6 h-6" />
              </div>
              
              <!-- Step Content -->
              <div class="text-center max-w-[140px]">
                <h3 
                  :class="[
                    'text-sm font-semibold mb-1',
                    step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                  ]"
                >
                  {{ step.label }}
                </h3>
                <p 
                  :class="[
                    'text-xs mb-1 leading-tight',
                    step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                  ]"
                >
                  {{ step.description }}
                </p>
                <span 
                  v-if="step.time"
                  :class="[
                    'text-xs font-medium',
                    step.completed || step.active ? 'text-primary' : 'text-gray-400'
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
                  getLineColor(step)
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
              <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  v-if="orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaImage"
                  :src="toBase64(orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaImage as string)"
                  :alt="orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaName"
                  class="w-full h-full object-cover rounded-lg"
                />
                <div v-else class="w-full h-full bg-gray-300 rounded-lg"></div>
              </div>
              
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">
                  {{ orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaName || 'Pizza' }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  {{ orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaDescription || 'Premium ingredients...' }}
                </p>
                <p class="text-sm text-gray-500 mt-1">Qty: {{ orderItem.quantity }}</p>
              </div>
              
              <div class="text-right">
                <p class="font-semibold text-primary">
                  ₱{{ ((orderPizzas.find(p => p.pizzaId === orderItem.pizzaId)?.pizzaPrice || 0) * orderItem.quantity).toFixed(0) }}
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
                    {{ deliveryLocation ? 
                      `${deliveryLocation.locationHouseNo} ${deliveryLocation.locationStreet}, Barangay ${deliveryLocation.locationBrgy} ${deliveryLocation.locationCity}, ${deliveryLocation.locationPostal}` :
                      '123 Lahug Street, Barangay Lahug Cebu City, 6000'
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
                    {{ order?.orderInstruction || 'Please ring the doorbell twice. Leave at front door if no answer.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions - Only show when actions are available -->
          <div 
            v-if="order?.orderStatus === 'pending' || order?.orderStatus === 'delivered' || order?.orderStatus === 'cancelled'"
            class="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            
            <div class="space-y-3">
              <!-- Actions for pending orders only -->
              <template v-if="order?.orderStatus === 'pending'">
                <Button 
                  @click="handleModifyOrder"
                  class="w-full h-12 rounded-md px-4 py-2"
                >
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
                >
                  Rate & Review
                </Button>
                <Button 
                  @click="handleReorder"
                  class="w-full h-12 rounded-md px-4 py-2"
                >
                  Reorder
                </Button>
              </template>
              
              <!-- Actions for cancelled orders -->
              <template v-else-if="order?.orderStatus === 'cancelled'">
                <Button 
                  @click="handleReorder"
                  class="w-full h-12 rounded-md px-4 py-2"
                >
                  Reorder
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>