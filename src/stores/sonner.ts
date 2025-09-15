// stores/sonner.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

export const useSonnerStore = defineStore('sonner', () => {
  const theme = ref<'light' | 'dark'>('light')

  const setTheme = (newTheme: typeof theme.value) => (theme.value = newTheme)
  const error = (message: string) => {
    toast.error('Error', {
      description: message,
    })
  }

  const success = (message: string) => {
    toast.success('Success', {
      style: {
        background: '',
      },
      description: message,
    })
  }
  const message = (title: string, message: string) => {
    toast.message(title, {
      description: message,
    })
  }

  return {
    theme,
    setTheme,
    error,
    success,
    message,
  }
})
