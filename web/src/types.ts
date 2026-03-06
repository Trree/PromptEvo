export type AssetType = 'prompt' | 'skill'

export interface Asset {
  id: string
  key: string
  type: AssetType
  title: string
  summary: string
  content: string
  tags: string[]
  collection: string
  updatedAt: string
  version: number
}

export interface AssetDraft {
  id?: string
  type: AssetType
  key: string
  title: string
  summary: string
  content: string
  tags: string[]
  collection: string
  version: number
}

export interface Prompt {
  id: string
  name: string
  title: string
  content: string
  description?: string
  category?: string
  version: number
  variables: string
  isHidden: boolean
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

export interface Skill {
  id: string
  name: string
  description: string
  manifest: string
  codePath?: string
  type: string
  isActive: boolean
  isHidden: boolean
  createdAt: string
  updatedAt: string
}
