// stores/location.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSonnerStore } from './sonner'
import { useFetch } from '@/plugins/api'
import type { Location } from '@/models/location'

export const useLocationStore = defineStore('location', () => {
  const sonner = useSonnerStore()
  const URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5135/api'
  const locations = ref<Location[]>([])
  const isLoading = ref(false)

  const selectedLocation = ref<Location>(
    locations.value.find((l) => l.isDefault === true) ?? locations.value[0],
  )

  const fetchLocations = async () => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/location/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to fetch locations')
      locations.value = data
      selectedLocation.value =
        locations.value.find((l) => l.isDefault === true) ?? locations.value[0]
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching locations'
      sonner.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const addLocation = async (loc: Partial<Location>) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to add location')

      console.table('data', data)
      sonner.success('Location added')
      if (loc.isDefault) {
        locations.value.forEach((l) => (l.isDefault = false))
      }
      locations.value.push(data)
      // Update selectedLocation: if it's the first address or marked as default, select it
      if (locations.value.length === 1 || loc.isDefault) {
        selectedLocation.value = data
      }
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding location'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateLocation = async (id: number, loc: Partial<Location>) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/location/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) return sonner.error(data.message ?? 'Failed to update location')
      sonner.success('Location updated')
      if (loc.isDefault) {
        locations.value.forEach((l) => (l.isDefault = false))
      }
      const i = locations.value.findIndex((l: Location) => l.locationId === id)
      if (i !== -1) locations.value[i] = data
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating location'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const removeLocation = async (id: number) => {
    isLoading.value = true
    try {
      const res = await useFetch(`${URL}/location/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        return sonner.error(data.message ?? 'Failed to delete location')
      }
      sonner.success('Location deleted')
      locations.value = locations.value.filter((l: Location) => l.locationId !== id)
      
      // If the deleted address was the selected one, update selectedLocation
      if (selectedLocation.value?.locationId === id) {
        selectedLocation.value = locations.value.find((l) => l.isDefault === true) ?? locations.value[0] ?? null
      }
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting location'
      sonner.error(msg)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const mapLocation = (a: Location) => {
    if (a === null) return null
    return (
      a.locationHouseNo +
      ', ' +
      a.locationStreet +
      ', ' +
      a.locationBrgy +
      ', ' +
      a.locationCity +
      (a.locationPostal ? ', ' + a.locationPostal : '') +
      ' ' +
      (a.locationLandmark ? `(${a.locationLandmark})` : '')
    )
  }

  return {
    locations,
    isLoading,
    fetchLocations,
    addLocation,
    updateLocation,
    removeLocation,
    mapLocation,
    selectedLocation,
  }
})
