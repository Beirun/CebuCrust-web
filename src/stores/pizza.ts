// stores/pizza.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { Pizza } from '@/models/pizza'
import { useRatingStore } from './rating'

export const usePizzaStore = defineStore('pizza', () => {
  const sonner = useSonnerStore()
  const ratingStore = useRatingStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'

  const pizzas = ref<Pizza[]>([])
  const isLoading = ref(false)

  const fetchAll = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/pizza`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch pizzas')

      // Fetch ratings for each pizza
      const pizzasWithRatings = await Promise.all(
        data.map(async (pizza: Pizza) => {
          if (pizza.pizzaId) {
            const pizzaRating = await ratingStore.fetchRatingsByPizzaId(pizza.pizzaId)
            return {
              ...pizza,
              averageRating: pizzaRating?.averageRating || 0,
              totalRatings: pizzaRating?.totalRatings || 0,
            }
          }
          return pizza
        }),
      )

      pizzas.value = pizzasWithRatings
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching pizzas'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const fetchById = async (id: number) => {
    try {
      const res = await useFetch(`${URL}/pizza/${id}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (res.status === 404) return null
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch pizza')
      return data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching pizza'
      sonner.error(msg)
      return null
    }
  }

  const createPizza = async (pizza: Partial<Pizza>) => {
    isLoading.value = true
    try {
      const formData = new FormData()
      formData.append('PizzaName', pizza.pizzaName!)
      formData.append('PizzaDescription', pizza.pizzaDescription!)
      formData.append('PizzaCategory', pizza.pizzaCategory!)
      formData.append('Stock', String(pizza.stock))
      formData.append('PizzaPrice', String(pizza.pizzaPrice!))
      if (pizza.pizzaImage) formData.append('Image', pizza.pizzaImage)

      const res = await useFetch(`${URL}/pizza`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        sonner.error(data.message ?? 'Failed to create pizza')
        return false
      }
      sonner.success('Pizza created')
      await fetchAll()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating pizza'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updatePizza = async (pizza: Partial<Pizza>) => {
    isLoading.value = true
    console.log('Pizza', pizza)
    try {
      const formData = new FormData()

      formData.append('PizzaName', pizza.pizzaName!)
      formData.append('PizzaDescription', pizza.pizzaDescription!)
      formData.append('PizzaCategory', pizza.pizzaCategory!)
      formData.append('Stock', String(pizza.stock))
      formData.append('PizzaPrice', String(pizza.pizzaPrice!))
      if (pizza.pizzaImage!) formData.append('Image', pizza.pizzaImage!)

      const res = await useFetch(`${URL}/pizza/${pizza.pizzaId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        sonner.error(data.message ?? 'Failed to update pizza')
        return false
      }
      sonner.success('Pizza updated')
      await fetchAll()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating pizza'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deletePizza = async (id: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/pizza/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete pizza')
      }
      sonner.success('Pizza deleted')
      pizzas.value = pizzas.value.filter((p: Pizza) => p.pizzaId !== id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting pizza'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  return {
    pizzas,
    isLoading,
    fetchAll,
    fetchById,
    createPizza,
    updatePizza,
    deletePizza,
  }
})
