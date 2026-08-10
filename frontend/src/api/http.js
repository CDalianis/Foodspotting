import axios from 'axios'
import { clearAuthToken, getAuthToken } from '../services/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken()
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.description ||
    error?.response?.data?.message ||
    fallback
  )
}
