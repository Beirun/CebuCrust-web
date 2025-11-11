// stores/notification.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import { type Notification } from '@/models/notification'

export const useNotificationStore = defineStore('notification', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)

  const fetchMyNotifications = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/notification/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch notifications')
      notifications.value = data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error fetching notifications'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const createNotification = async (payload: Partial<Notification>) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, notificationStatus: 'unread' }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to create notification')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error creating notification'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const updateNotificationStatus = async (id: number, status: string) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/notification/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update status')
      sonner.success('Status updated')
      const i = notifications.value.findIndex((n) => n.notificationId === id)
      if (i !== -1) notifications.value[i] = data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error updating status'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const deleteNotification = async (id: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/notification/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete notification')
      }
      sonner.success('Notification deleted')
      notifications.value = notifications.value.filter((n) => n.notificationId !== id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error deleting notification'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    notifications,
    isLoading,
    fetchMyNotifications,
    createNotification,
    updateNotificationStatus,
    deleteNotification,
  }
})
