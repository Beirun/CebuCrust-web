import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import AboutUs from '@/views/AboutUs.vue'
import Contact from '@/views/Contact.vue'
import Settings from '@/views/User/AccountSettings.vue'
import AdminDashboard from '@/views/Admin/Dashboard.vue'
import AdminMenu from '@/views/Admin/Menu.vue'
import AdminOrders from '@/views/Admin/Orders.vue'
import Dashboard from '@/views/User/Dashboard.vue'
import Favorites from '@/views/User/Favorites.vue'
import Menu from '@/views/User/Menu.vue'
import Orders from '@/views/User/Orders.vue'
import Cart from '@/views/User/Cart.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: Landing,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/aboutus',
      name: 'AboutUs',
      component: AboutUs,
    },
    {
      path: '/contact',
      name: 'Contact',
      component: Contact,
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
    {
      path: '/cart',
      name: 'Cart',
      component: Cart,
    },
  ],
})

router.beforeEach(async () => {})

export default router
