import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PromptVersion } from './types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

function authHeaders(): HeadersInit {
  const key = import.meta.env.VITE_API_KEY ?? ''
  return key ? { Authorization: `Bearer ${key}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`)
  return r.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return r.json()
}

async function del(path: string): Promise<void> {
  await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() })
}

// Generic Hook for CRUD
export function useEntity<T>(key: string) {
  const qc = useQueryClient()
  const path = `/${key}`

  return {
    list: () => useQuery<T[]>({
      queryKey: [key],
      queryFn: () => get<T[]>(path),
    }),
    save: () => useMutation({
      mutationFn: (data: Partial<T>) => post<T>(path, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    }),
    remove: () => useMutation({
      mutationFn: (id: string) => del(`${path}/${id}`),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    }),
  }
}

// Specific Hook for versions
export function usePromptVersions(id: string | null) {
  return useQuery({
    queryKey: ['prompts', id, 'versions'],
    queryFn: () => get<PromptVersion[]>(`/prompts/${id}/versions`),
    enabled: !!id,
  })
}
