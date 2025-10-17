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
<<<<<<< Updated upstream
=======
import { useLocationStore } from '@/stores/location'
import ModifyOrder from '@/views/User/ModifyOrder.vue'
import ProductDetail from '@/views/User/ProductDetail.vue'
>>>>>>> Stashed changes

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: Landing,
    },
    {
      path: '/signin',
      name: 'SignIn',
      component: SignIn,
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp,
    },
    {
      path: '/forgot',
      name: 'ForgotPassword',
      component: ForgotPassword,
    },
    {
      path: '/reset/:code',
      name: 'ResetPassword',
      component: ResetPassword,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
    },
    // Admin routes - all prefixed with /admin
    {
      path: '/dashboard/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
    },
    {
      path: '/admin/menu',
      name: 'AdminMenu',
      component: AdminMenu,
    },
    {
      path: '/admin/orders',
      name: 'AdminOrders',
      component: AdminOrders,
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: Favorites,
    },
    {
      path: '/menu',
      name: 'Menu',
      component: Menu,
    },
    {
      path: '/orders',
      name: 'Orders',
      component: Orders,
    },
    {
      path: '/cart',
      name: 'Cart',
      component: Cart,
    },
    {
      path: '/completeOrder',
      name: 'CompleteOrder',
      component: CompleteOrder,
    },
<<<<<<< Updated upstream
=======
    {
      path: '/order/modify/:id',
      name: 'ModifyOrder',
      component: ModifyOrder,
    },
    {
      path: '/product/:id',
      name: 'ProductDetail',
      component: ProductDetail,
    },
>>>>>>> Stashed changes
  ],
})

router.beforeEach(async () => {
  const auth = useAuthStore()

  if (auth.isAuthenticated) {
    await useCartStore().fetchCart()
    await usePizzaStore().fetchAll()
    await useFavoriteStore().fetchFavorites()
  }
})

export default router