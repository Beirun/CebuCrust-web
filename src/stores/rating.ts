// stores/rating.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { Rating, RatingRequest, RatingResponse, PizzaRating } from '@/models/rating'

export const useRatingStore = defineStore('rating', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const ratings = ref<Rating[]>([])
  const pizzaRatings = ref<Map<number, PizzaRating>>(new Map())
  const isLoading = ref(false)

  const fetchAllRatings = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/rating`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch ratings')
      ratings.value = data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching ratings'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const fetchRatingsByPizzaId = async (pizzaId: number) => {
    try {
      const res = await useFetch(`${URL}/rating/pizza/${pizzaId}`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch pizza ratings')

      // Calculate average rating and total count
      const ratings = data as RatingResponse[]
      const averageRating =
        ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length : 0

      const pizzaRating: PizzaRating = {
        pizzaId,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings: ratings.length,
        ratings,
      }

      pizzaRatings.value.set(pizzaId, pizzaRating)
      return pizzaRating
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching pizza ratings'
      sonner.error(msg)
      return null
    }
  }

  const createRating = async (request: RatingRequest) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to create rating')

      // Refresh ratings for this pizza
      await fetchRatingsByPizzaId(request.pizzaId)
      sonner.success('Rating submitted successfully!')
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating rating'
      sonner.error(msg)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateRating = async (ratingId: number, request: RatingRequest) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/rating/${ratingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update rating')

      // Refresh ratings for this pizza
      await fetchRatingsByPizzaId(request.pizzaId)
      sonner.success('Rating updated successfully!')
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating rating'
      sonner.error(msg)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteRating = async (ratingId: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/rating/${ratingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete rating')
      }

      sonner.success('Rating deleted successfully!')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting rating'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const getPizzaRating = (pizzaId: number): PizzaRating | null => {
    return pizzaRatings.value.get(pizzaId) || null
  }

  const getAverageRating = (pizzaId: number): number => {
    const pizzaRating = pizzaRatings.value.get(pizzaId)
    return pizzaRating?.averageRating || 0
  }

  const getTotalRatings = (pizzaId: number): number => {
    const pizzaRating = pizzaRatings.value.get(pizzaId)
    return pizzaRating?.totalRatings || 0
  }

  return {
    ratings,
    pizzaRatings,
    isLoading,
    fetchAllRatings,
    fetchRatingsByPizzaId,
    createRating,
    updateRating,
    deleteRating,
    getPizzaRating,
    getAverageRating,
    getTotalRatings,
  }
})
