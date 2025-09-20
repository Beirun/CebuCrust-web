// stores/reset.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'

export const useResetStore = defineStore('reset', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const isLoading = ref(false)
  const verified = ref(false)

  const requestReset = async (email: string) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      sonner.success(data.message)
      return true
    } catch (err: any) {
      sonner.error(err.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const verifyReset = async (code: string) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/reset/verify/${code}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()

        verified.value = false
        sonner.error(data.message)
        router.replace('/forgot')
        return false
      }
      verified.value = true
      return true
    } catch (err: any) {
      sonner.error(err.message)
      verified.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (
    resetCode: string,
    password: { newPassword: string; confirmPassword: string },
  ) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/reset/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetCode,
          newPassword: password.newPassword,
          confirmPassword: password.confirmPassword,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message)

      sonner.success(data.message)
      return true
    } catch (err: any) {
      sonner.error(err.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearState = () => {
    isLoading.value = false
    verified.value = false
  }

  return {
    isLoading,
    verified,
    requestReset,
    verifyReset,
    resetPassword,
    clearState,
  }
})
