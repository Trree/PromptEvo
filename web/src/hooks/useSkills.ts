import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getAuthHeaders } from '../config'
import type { Skill } from '../types/skill'

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then((r) => r.data),
  })
}

export function useSaveSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Skill>) =>
      api.post('/skills', data, { headers: getAuthHeaders() }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/skills/${id}`, { headers: getAuthHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}
