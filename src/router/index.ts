import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import Settings from '@/views/User/AccountSettings.vue'
import SignIn from '@/views/SignIn.vue'
import SignUp from '@/views/SignUp.vue'
import AdminDashboard from '@/views/Admin/Dashboard.vue'
import AdminMenu from '@/views/Admin/Menu.vue'
import AdminOrders from '@/views/Admin/Orders.vue'
import Dashboard from '@/views/User/Dashboard.vue'
import Favorites from '@/views/User/Favorites.vue'
import Menu from '@/views/User/Menu.vue'
import Orders from '@/views/User/Orders.vue'
import Cart from '@/views/User/Cart.vue'
import CompleteOrder from '@/views/User/CompleteOrder.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { usePizzaStore } from '@/stores/pizza'
import { useFavoriteStore } from '@/stores/favorite'
import { useLocationStore } from '@/stores/location'
import ModifyOrder from '@/views/User/ModifyOrder.vue'
import ProductDetail from '@/views/User/ProductDetail.vue'
import TrackOrder from '@/views/User/TrackOrder.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: Landing,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/signin',
      name: 'SignIn',
      component: SignIn,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/forgot',
      name: 'ForgotPassword',
      component: ForgotPassword,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/reset/:code',
      name: 'ResetPassword',
      component: ResetPassword,
      meta: {
        requiresGuest: true,
      },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      meta: {
        requiresAuth: true,
      },
    },
    // Admin routes - all prefixed with /admin
    {
      path: '/dashboard/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: {
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/menu',
      name: 'AdminMenu',
      component: AdminMenu,
      meta: {
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/orders',
      name: 'AdminOrders',
      component: AdminOrders,
      meta: {
        requiresAdmin: true,
      },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: Favorites,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/menu',
      name: 'Menu',
      component: Menu,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/orders',
      name: 'Orders',
      component: Orders,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/cart',
      name: 'Cart',
      component: Cart,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/order/complete',
      name: 'CompleteOrder',
      component: CompleteOrder,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/order/modify/:id',
      name: 'ModifyOrder',
      component: ModifyOrder,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/product/:id',
      name: 'ProductDetail',
      component: ProductDetail,
      meta: {
        requiresUser: true,
      },
    },
    {
      path: '/order/track/:id',
      name: 'TrackOrder',
      component: TrackOrder,
      meta: {
        requiresUser: true,
      },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresGuest) {
    if (auth.isAuthenticated) {
      if (auth.isAdmin) {
        next('/dashboard/admin')
      } else next('/dashboard')
    }
  }
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) next('/signin')
  }
  if (to.meta.requiresAdmin) {
    if (!auth.isAdmin) {
      next('/dashboard')
    }
  }
  if (to.meta.requiresUser) {
    if (auth.isAdmin) {
      next('/dashboard/admin')
    }
  }
  if (auth.isAuthenticated) {
    await useCartStore().fetchCart()
    await usePizzaStore().fetchAll()
    await useFavoriteStore().fetchFavorites()
    await useLocationStore().fetchLocations()
  }
  next()
})

export default router
