import { useAuthStore } from '@/stores/auth'
import { useSonnerStore } from '@/stores/sonner'
let isRefreshing = false
let url = import.meta.env.VITE_BASE_URL
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const auth = useAuthStore()
  const sonner = useSonnerStore()

  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true

  refreshPromise = (async () => {
    try {
      const res = await fetch(url + '/accounts/refresh', {
        method: 'POST',
        credentials: 'include', // send HttpOnly cookie
      })

      if (!res.ok) throw new Error('Session Expired')

      const data = await res.json()
      localStorage.setItem('token', data.token)
      auth.setToken(data.token)
      return data.token
    } catch (err: any) {
      sonner.message(err.message, 'Please Log-In again')
      auth.handleTokenExpiry()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function useFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore()
  if (!init.headers) init.headers = {}
  if (auth.token) {
    ;(init.headers as Record<string, string>)['Authorization'] = `Bearer ${auth.token}`
  }
  console.log(input)
  console.log('init', init)
  let res = await fetch(input, init)
  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      ;(init.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
      res = await fetch(input, init)
    }
  }

  return res
}
