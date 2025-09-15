// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import router from '@/router'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api' // <-- your custom fetch wrapper
// import type { CallbackTypes } from 'vue3-google-login';
// import { useNotificationStore } from "./notification"
export const useAuthStore = defineStore('auth', () => {
  const sonner = useSonnerStore()
  //   const notification = useNotificationStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isLoading = ref(false)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() =>
    token.value ? Object.values(jwtDecode(token.value))[2] === 'Admin' : false,
  )
  const userInfo = computed(() => user.value)

  const register = async (credentials: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    password: string
    confirmPassword: string
  }) => {
    isLoading.value = true
    try {
      const res = await useFetch(URL + '/account/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      sonner.success(data.message)

      token.value = data.token
      user.value = data.user

      //   await notification.fetchNotifications(user.value.userId)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // check if admin
      if (isAdmin.value) {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      sonner.error(err.message)
    } finally {
      isLoading.value = false
    }
  }

  //   const continueWithGoogle = async(object : CallbackTypes.TokenPopupResponse) =>{
  //     isLoading.value = true
  //     try {
  //       const result = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
  //         headers: {
  //           Authorization: `Bearer ${object.access_token}`
  //         }
  //       })
  //       const fetchedUser = await result.json();

  //       const credentials = {
  //         email: fetchedUser.email,
  //         username: fetchedUser.name
  //       }

  //       const res = await useFetch(URL + "/accounts/google", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(credentials),
  //         credentials: "include",
  //       })
  //       const data = await res.json()
  //       if (!res.ok) return sonner.error(data.message)
  //       console.log("user before", user.value)
  //       sonner.success(data.message)
  //       token.value = data.token
  //       user.value = data.user

  //       await notification.fetchNotifications(user.value.userId)
  //       console.log("user after", user.value)
  //       localStorage.setItem("token", data.token)
  //       localStorage.setItem("user", JSON.stringify(data.user))

  //       const redirectPath = sessionStorage.getItem("redirectAfterLogin")
  //       sessionStorage.removeItem("redirectAfterLogin")

  //       // check if admin
  //       if (redirectPath) {
  //         router.push(redirectPath)
  //       } else if (isAdmin.value) {
  //         router.push("/admin")
  //       } else {
  //         router.push("/dashboard")
  //       }
  //     } catch (err: any) {
  //       sonner.error(err.message)
  //     } finally {
  //       isLoading.value = false
  //       isFromLogin.value =true
  //     }
  //   }

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      const res = await useFetch(URL + '/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      sonner.success(data.message)
      token.value = data.token
      user.value = data.user

      //   await notification.fetchNotifications(user.value.userId)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      sessionStorage.removeItem('redirectAfterLogin')

      // check if admin
      if (redirectPath) {
        router.push(redirectPath)
      } else if (isAdmin.value) {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      sonner.error(err.message)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(URL + '/account/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      console.log('data', data)
      sonner.success(data.message)
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    } catch (err: any) {
      sonner.error(err.message)
    } finally {
      isLoading.value = false
    }
  }

  const update = async (updates: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    oldPassword?: string
    newPassword?: string
    confirmPassword?: string
  }) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/account/${userInfo.value.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      if (res.status === 200) {
        sonner.message('Profile Info', data.message)
        return true
      } else sonner.success(data.message)
      // update only non-sensitive info in store
      if (data.user.userName || data.user.userEmail || data.user.userDob) {
        user.value = { ...user.value, ...data.user }
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return true
    } catch (err: any) {
      sonner.error(err.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const handleTokenExpiry = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (router.currentRoute.value.path !== '/') {
      sessionStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
    }
    router.push('/')
  }

  const makeAuthenticatedRequest = async () => {
    if (!token.value) {
      sonner.error('No authentication token')
      return
    }

    const res = await useFetch(URL + '/account/refresh', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    if (res.status === 401 || res.status === 403) throw Error
    return res
  }
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    userInfo,
    register,
    login,
    logout,
    handleTokenExpiry,
    makeAuthenticatedRequest,
    //   continueWithGoogle,
    setToken,
    update,
  }
})
