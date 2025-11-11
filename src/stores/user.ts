// stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import router from '@/router'
import type { User } from '@/models/user'

export const useUserStore = defineStore('user', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const users = ref<User[]>([])
  const me = ref<User | null>(null)
  const isLoading = ref(false)

  const getAllUsers = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch users')
      users.value = data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error fetching users'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const fetchMe = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/user/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch user')
      me.value = data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error fetching user'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const deleteUser = async (id: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/user/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete user')
      }
      sonner.success('User deleted')
      users.value = users.value.filter((u) => u.userId !== id)
      if (me.value?.userId === id) {
        me.value = null
        await router.push('/login')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error deleting user'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    users,
    me,
    isLoading,
    getAllUsers,
    fetchMe,
    deleteUser,
  }
})
