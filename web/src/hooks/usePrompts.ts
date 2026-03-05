import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getAuthHeaders } from '../config'
import type { Prompt, PromptVersion } from '../types/prompt'

export function usePrompts() {
  return useQuery<Prompt[]>({
    queryKey: ['prompts'],
    queryFn: () => api.get('/prompts').then((r) => r.data),
  })
}

export function usePromptVersions(id: string | null) {
  return useQuery<PromptVersion[]>({
    queryKey: ['prompts', id, 'versions'],
    queryFn: () => api.get(`/prompts/${id}/versions`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useSavePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Prompt>) =>
      api.post('/prompts', data, { headers: getAuthHeaders() }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    },
  })
}

export function useDeletePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/prompts/${id}`, { headers: getAuthHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    },
  })
}
