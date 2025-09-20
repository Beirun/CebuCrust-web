import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import SignIn from '@/views/SignIn.vue'
import SignUp from '@/views/SignUp.vue'
import Settings from '@/views/Settings.vue'
import AdminDashboard from '@/views/Admin/Dashboard.vue'
import AdminMenu from '@/views/Admin/Menu.vue'
import AdminOrders from '@/views/Admin/Orders.vue'
import Dashboard from '@/views/User/Dashboard.vue'
import Favorites from '@/views/User/Favorites.vue'
import Menu from '@/views/User/Menu.vue'
import Orders from '@/views/User/Orders.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'

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
    {
      path: '/dashboard/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
    },
    {
      path: '/menu/admin',
      name: 'AdminMenu',
      component: AdminMenu,
    },
    {
      path: '/orders/admin',
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
  ],
})

// router.beforeEach(async () => {})

export default router
