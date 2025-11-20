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

  // Helper function to clean empty/null image fields from user data
  const cleanImageFields = (userData: any): any => {
    if (!userData) return userData
    const cleaned = { ...userData }
    // Remove image fields if they're empty, null, undefined, or whitespace-only
    if (!cleaned.profileImage || (typeof cleaned.profileImage === 'string' && cleaned.profileImage.trim() === '')) {
      delete cleaned.profileImage
    }
    if (!cleaned.profileImageUrl || (typeof cleaned.profileImageUrl === 'string' && cleaned.profileImageUrl.trim() === '')) {
      delete cleaned.profileImageUrl
    }
    return cleaned
  }

  const token = ref(localStorage.getItem('token'))
  // Clean image fields on initial load if they're empty/null
  const initialUserData = JSON.parse(localStorage.getItem('user') || '{}')
  const user = ref(cleanImageFields(initialUserData))
  const isLoading = ref(false)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() =>
    token.value ? Object.values(jwtDecode(token.value))[2] === 'Admin' : false,
  )
  const userInfo = computed(() => user.value)

  // Helper function to safely store user data without image fields if needed
  const storeUserData = (userData: any, removeImageFields: boolean = false) => {
    if (removeImageFields) {
      const cleanedUser = { ...userData }
      delete cleanedUser.profileImage
      delete cleanedUser.profileImageUrl
      user.value = cleanedUser
      localStorage.setItem('user', JSON.stringify(cleanedUser))
      // Set flag that image was removed
      localStorage.setItem('profileImageRemoved', 'true')
    } else {
      // Always clean empty/null image fields before storing
      const cleanedUser = cleanImageFields(userData)
      user.value = cleanedUser
      localStorage.setItem('user', JSON.stringify(cleanedUser))
      // If both image fields are missing, mark as removed
      if (!cleanedUser.profileImage && !cleanedUser.profileImageUrl) {
        localStorage.setItem('profileImageRemoved', 'true')
      } else {
        localStorage.removeItem('profileImageRemoved')
      }
    }
  }

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
      // Clean image fields from register response if they're empty/null
      const cleanedUser = cleanImageFields(data.user)
      user.value = cleanedUser

      //   await notification.fetchNotifications(user.value.userId)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(cleanedUser))

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
      
      // Clean image fields from Google login response if they're empty/null
      const cleanedUser = cleanImageFields(data.user)
      // If profileImageRemoved flag exists, remove image fields even if backend returned them
      if (localStorage.getItem('profileImageRemoved') === 'true') {
        delete cleanedUser.profileImage
        delete cleanedUser.profileImageUrl
      }
      user.value = cleanedUser

      // await notification.fetchNotifications(user.value.userId)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(cleanedUser))

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
      
      // Clean image fields from login response if they're empty/null
      const cleanedUser = cleanImageFields(data.user)
      // If profileImageRemoved flag exists, remove image fields even if backend returned them
      if (localStorage.getItem('profileImageRemoved') === 'true') {
        delete cleanedUser.profileImage
        delete cleanedUser.profileImageUrl
      }
      user.value = cleanedUser

      //   await notification.fetchNotifications(user.value.userId)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(cleanedUser))
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
  }): Promise<{ ok: boolean; message?: string }> => {
    isLoading.value = true
    try {
      console.log('Updating user with ID:', userInfo.value.userId)
      console.log('Updates being sent:', updates)
      const fd = new FormData()
      if (updates.userFName) fd.append('UserFName', updates.userFName)
      if (updates.userLName) fd.append('UserLName', updates.userLName)
      if (updates.userEmail) fd.append('UserEmail', updates.userEmail)
      if (updates.userPhoneNo) fd.append('UserPhoneNo', updates.userPhoneNo)

      // Handle image removal or update
      if (updates.removeImage) {

        // Send removal flag to backend - do NOT send empty Image field
        fd.append('RemoveImage', 'true')
        console.log('Setting RemoveImage flag to true')
      } else if (updates.image instanceof File) {
        fd.append('Image', updates.image)
        console.log('Sending new image file')
      } else if (typeof updates.image === 'string' && updates.image) {
        fd.append('Image', updates.image)
        console.log('Sending image string')
      }

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
        const message = data?.message || 'Failed to update profile.'
        sonner.error(message)
        return { ok: false, message }
      }
      
      // CRITICAL: If removeImage was requested, filter out image fields from backend response
      let responseData = data.user || data
      if (updates.removeImage) {
        console.log('REMOVING IMAGE: Filtering image fields from backend response')
        // Create a clean copy without image fields
        const { profileImage, profileImageUrl, ...cleanData } = responseData
        responseData = cleanData
      }
      
      // Merge updates with filtered response data
      user.value = { ...user.value, ...responseData }
      
      // CRITICAL: If removeImage was requested, explicitly remove image fields before storing
      if (updates.removeImage) {
        console.log('REMOVING IMAGE: Explicitly removing image fields from user data')
        // Explicitly delete image fields to prevent them from being restored
        delete user.value.profileImage
        delete user.value.profileImageUrl
        // Use helper to ensure clean storage and set removal flag
        storeUserData(user.value, true)
      } else {
        // Always clean empty/null image fields before storing
        const cleanedUser = cleanImageFields(user.value)
        user.value = cleanedUser
        // Normal storage (will also clean and set/remove flag)
        storeUserData(user.value, false)
      }

      return { ok: true }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('Update error:', errorMessage)
      sonner.error(errorMessage)
      return { ok: false, message: errorMessage }
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
