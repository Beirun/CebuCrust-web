// stores/favorite.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'

export const useFavoriteStore = defineStore('favorite', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const favorites = ref<number[]>([])
  const isLoading = ref(false)

  const fetchFavorites = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/favorite/me`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      console.table('12', data)

      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch favorites')
      favorites.value = data.map((item: { pizzaId: number }) => item.pizzaId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching favorites'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const addFavorite = async (item: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pizzaId: item }),
        credentials: 'include',
      })
      if (res.status === 409) return sonner.error('Favorite already exists')
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to add favorite')
      favorites.value.push(item)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding favorite'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const removeFavorite = async (pizzaId: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/favorite/${pizzaId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.status === 404) return sonner.error('Favorite not found')
      if (!res.ok) return sonner.error('Failed to remove favorite')
      favorites.value = favorites.value.filter((f) => f !== pizzaId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing favorite'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    favorites,
    isLoading,
    fetchFavorites,
    addFavorite,
    removeFavorite,
  }
})
