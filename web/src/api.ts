import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

const getHeaders = () => {
  const key = import.meta.env.VITE_API_KEY ?? ''
  return key ? { Authorization: `Bearer ${key}` } : {}
}

// Generic Hook for CRUD
export function useEntity<T>(key: string) {
  const qc = useQueryClient()
  const path = `/${key}`

  return {
    list: () => useQuery<T[]>({
      queryKey: [key],
      queryFn: () => instance.get(path).then(r => r.data)
    }),
    save: () => useMutation({
      mutationFn: (data: Partial<T>) => instance.post(path, data, { headers: getHeaders() }).then(r => r.data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] })
    }),
    remove: () => useMutation({
      mutationFn: (id: string) => instance.delete(`${path}/${id}`, { headers: getHeaders() }),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] })
    })
  }
}

// Specific Hook for versions
export function usePromptVersions(id: string | null) {
  return useQuery({
    queryKey: ['prompts', id, 'versions'],
    queryFn: () => instance.get(`/prompts/${id}/versions`).then(r => r.data),
    enabled: !!id
  })
}

export const api = instance
