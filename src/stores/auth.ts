// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import router from '@/router'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { CallbackTypes } from 'vue3-google-login'
// import { useNotificationStore } from "./notification"
export const useAuthStore = defineStore('auth', () => {
  const sonner = useSonnerStore()
  //   const notification = useNotificationStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  // Check both localStorage and sessionStorage for token/user
  const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token')
  const getStoredUser = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : {}
  }
  
  const token = ref(getStoredToken())
  const user = ref(getStoredUser())
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      sonner.error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  const continueWithGoogle = async (object: CallbackTypes.TokenPopupResponse) => {
    isLoading.value = true
    try {
      const result = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${object.access_token}`,
        },
      })
      const fetchedUser = await result.json()

      console.log('fetchedUser', fetchedUser)
      const credentials = {
        email: fetchedUser.email,
        password: 'password',
      }

      const res = await useFetch(URL + '/account/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.isSignedUp === false) {
        localStorage.setItem('email', fetchedUser.email || '')
        localStorage.setItem('firstname', fetchedUser.given_name || '')
        localStorage.setItem('lastname', fetchedUser.family_name || '')
        sonner.message(`You're Almost There`, data.message)
        router.push('/signup')
        return
      }
      sonner.success(data.message)
      token.value = data.token
      user.value = data.user

      // await notification.fetchNotifications(user.value.userId)
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
    } catch (err: unknown) {
      if (err instanceof Error) sonner.error(err.message)
    } finally {
      isLoading.value = false
    }
  }

  const login = async (credentials: { email: string; password: string }, rememberMe: boolean = false) => {
    isLoading.value = true
    try {
      const res = await useFetch(URL + '/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      })
      
      let data
      try {
        data = await res.json()
      } catch (jsonError) {
        // If JSON parsing fails, show default error message
        return sonner.error('Account does not exist. Please check your credentials.')
      }
      
      if (!res.ok) {
        // Display error message from backend, or default message
        let errorMessage = data?.message || data?.error || 'Account does not exist. Please check your credentials.'
        
        // Replace generic "Invalid Credentials" with more helpful message
        if (errorMessage.toLowerCase().includes('invalid credentials')) {
          errorMessage = 'Account does not exist. Please check your email and password.'
        }
        
        return sonner.error(errorMessage)
      }

      sonner.success(data.message)
      token.value = data.token
      user.value = data.user

      //   await notification.fetchNotifications(user.value.userId)

      // Use localStorage if rememberMe is true, otherwise use sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage
      
      // Clear the other storage to avoid conflicts
      if (rememberMe) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      
      storage.setItem('token', data.token)
      storage.setItem('user', JSON.stringify(data.user))
      
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
    } catch (err: unknown) {
      // Handle network errors or other unexpected errors
      if (err instanceof Error) {
        // Check if it's a network error
        if (err.message.includes('fetch') || err.message.includes('network')) {
          sonner.error('Network error. Please check your connection and try again.')
        } else {
          sonner.error('Account does not exist. Please check your credentials.')
        }
      } else {
        sonner.error('Account does not exist. Please check your credentials.')
      }
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
      // Clear both localStorage and sessionStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      router.push('/signin')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      sonner.error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  const update = async (updates: {
    userFName?: string
    userLName?: string
    userEmail?: string
    userPhoneNo?: string
    image?: File | string
    removeImage?: boolean
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }) => {
    isLoading.value = true
    try {
      console.log('Updating user with ID:', userInfo.value.userId)
      console.log('Updates being sent:', updates)
      const fd = new FormData()
      if (updates.userFName) fd.append('UserFName', updates.userFName)
      if (updates.userLName) fd.append('UserLName', updates.userLName)
      if (updates.userEmail) fd.append('UserEmail', updates.userEmail)
      if (updates.userPhoneNo) fd.append('UserPhoneNo', updates.userPhoneNo)
      if (updates.image instanceof File) fd.append('Image', updates.image)
      else if (typeof updates.image === 'string') fd.append('Image', updates.image)
      if (updates.currentPassword) fd.append('CurrentPassword', updates.currentPassword)
      if (updates.newPassword) fd.append('NewPassword', updates.newPassword)
      if (updates.confirmPassword) fd.append('ConfirmPassword', updates.confirmPassword)

      const res = await useFetch(`${URL}/user/${userInfo.value.userId}`, {
        method: 'PUT',
        body: fd,
        credentials: 'include',
      })
      const data = await res.json()
      console.log('Backend response:', data)
      console.log('removeImage flag was set:', updates.removeImage)
      if (!res.ok) {
        sonner.error(`${data.message}`)
        return false
      }

      // Determine which storage was used (check if token exists in localStorage or sessionStorage)
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage
      
      if (data.user) {
        user.value = { ...user.value, ...data.user }
        storage.setItem('user', JSON.stringify(user.value))
      } else {
        // Update local user data with the updates we sent
        user.value = { ...user.value, ...data }
        storage.setItem('user', JSON.stringify(user.value))
      }

      return true
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('Update error:', errorMessage)
      sonner.error(errorMessage)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const handleTokenExpiry = () => {
    token.value = null
    user.value = null
    // Clear both localStorage and sessionStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
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
    // Update token in the same storage that currently has a token
    // Default to localStorage if neither has it (for refresh token scenarios)
    const storage = localStorage.getItem('token') ? localStorage 
      : (sessionStorage.getItem('token') ? sessionStorage : localStorage)
    storage.setItem('token', newToken)
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
    continueWithGoogle,
    setToken,
    update,
  }
})
