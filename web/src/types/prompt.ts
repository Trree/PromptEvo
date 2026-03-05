export interface Prompt {
  id: string
  name: string
  title: string
  content: string
  description?: string
  category?: string
  version: number
  variables: string
  createdAt: string
  updatedAt: string
}

export interface PromptVersion {
  id: string
  promptId: string
  version: number
  content: string
  variables: string
  savedAt: string
}
