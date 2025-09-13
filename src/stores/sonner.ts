// stores/sonner.ts
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'

export const useSonnerStore = defineStore('sonner', () => {
  const error = (message: string) => {
    toast.error('Error', {
      description: message,
    })
  }

  const success = (message: string) => {
    toast.success('Success', {
      description: message,
    })
  }
  const message = (title: string, message: string) => {
    toast.message(title, {
      description: message,
    })
  }

  return {
    error,
    success,
    message,
  }
})
