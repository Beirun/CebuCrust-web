import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref<Array<any>>(JSON.parse(localStorage.getItem('cart') || '[]'))

  const save = () => {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  const itemCount = computed(() => items.value.reduce((s, i) => s + (i.quantity || 1), 0))
  const subTotal = computed(() => items.value.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0))
  const deliveryFee = computed(() => (items.value.length > 0 ? 50 : 0))
  const total = computed(() => subTotal.value + deliveryFee.value)

  const findIndex = (payload: any) => items.value.findIndex(i => i.id === payload.id)

  const addItem = (payload: any) => {
    const idx = findIndex(payload)
    if (idx === -1) {
      items.value.push({ ...payload, quantity: payload.quantity ?? 1 })
    } else {
      items.value[idx].quantity = (items.value[idx].quantity || 1) + (payload.quantity ?? 1)
    }
    save()
  }

  const removeItem = (id: any) => {
    items.value = items.value.filter(i => i.id !== id)
    save()
  }

  const updateQuantity = (id: any, qty: number) => {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    items.value[idx].quantity = Math.max(0, qty)
    if (items.value[idx].quantity === 0) removeItem(id)
    save()
  }

  const clear = () => {
    items.value = []
    save()
  }

  return {
    items,
    itemCount,
    subTotal,
    deliveryFee,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  }
})
