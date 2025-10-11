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
        localStorage.setItem('email', fetchedUser.email)
        localStorage.setItem('firstname', fetchedUser.given_name)
        localStorage.setItem('lastname', fetchedUser.family_name)
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      sonner.error(errorMessage)
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      sonner.error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  const update = async (updates: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    phoneNo?: string
    profileImage?: string
    oldPassword?: string
    newPassword?: string
    confirmPassword?: string
  }) => {
    isLoading.value = true
    try {
      console.log('Updating user with ID:', userInfo.value.userId)
      console.log('Updates being sent:', updates)

      // Try different possible API endpoints
      const possibleEndpoints = [
        `${URL}/account/${userInfo.value.userId}`,
        `${URL}/account/update`,
        `${URL}/account/profile`,
        `${URL}/user/${userInfo.value.userId}`,
        `${URL}/user/update`,
      ]

      let res: Response | null = null
      let lastError: string = ''

      for (const endpoint of possibleEndpoints) {
        try {
          console.log('Trying endpoint:', endpoint)
          res = await useFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
            credentials: 'include',
          })

          if (res.ok) {
            console.log('Success with endpoint:', endpoint)
            break
          } else {
            lastError = `Endpoint ${endpoint} returned ${res.status}: ${res.statusText}`
            console.log(lastError)
          }
        } catch (err) {
          lastError = `Endpoint ${endpoint} failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          console.log(lastError)
        }
      }

      if (!res || !res.ok) {
        sonner.error(`Failed to update profile. ${lastError}`)
        return false
      }

      // Try to parse JSON response
      let data
      try {
        data = await res.json()
        console.log('Response data:', data)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        // If we can't parse JSON but the request was successful, assume it worked
        data = { message: 'Profile updated successfully' }
      }

      // Show success message
      if (data.message) {
        sonner.success(data.message)
      } else {
        sonner.success('Profile updated successfully')
      }

      // Update user data in store
      if (data.user) {
        user.value = { ...user.value, ...data.user }
        localStorage.setItem('user', JSON.stringify(user.value))
      } else {
        // Update local user data with the updates we sent
        user.value = { ...user.value, ...updates }
        localStorage.setItem('user', JSON.stringify(user.value))
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
    continueWithGoogle,
    setToken,
    update,
  }
})
