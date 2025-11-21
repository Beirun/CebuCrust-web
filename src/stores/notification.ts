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
      // Sort by dateCreated descending (newest first)
      notifications.value = data.sort((a: Notification, b: Notification) => {
        const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
        const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
        return dateB - dateA // Descending order (newest first)
      })
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

  const updateNotificationStatus = async (id: number, status: string, silent = false) => {
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
      if (!silent) sonner.success('Status updated')
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

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.value.filter(
      (n) => n.notificationStatus !== 'read'
    )
    
    if (unreadNotifications.length === 0) {
      sonner.message('All notifications are already read')
      return
    }

    isLoading.value = true
    try {
      // Mark each unread notification as read (silent mode to avoid multiple success messages)
      const promises = unreadNotifications.map((notification) =>
        updateNotificationStatus(notification.notificationId!, 'read', true)
      )
      
      await Promise.all(promises)
      sonner.success(`Marked ${unreadNotifications.length} notification(s) as read`)
      
      // Refresh notifications to get updated status
      await fetchMyNotifications()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error marking notifications as read'
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
    markAllAsRead,
  }
})
