import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
})

export function getAuthHeaders() {
  const key = import.meta.env.VITE_API_KEY ?? ''
  return key ? { Authorization: `Bearer ${key}` } : {}
}
