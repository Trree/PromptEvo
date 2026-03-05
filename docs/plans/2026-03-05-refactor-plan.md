# OpenPrompt 重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 OpenPrompt 从单文件原型重构为分层架构，补全 API、添加认证、支持版本历史。

**Architecture:** 后端采用 routes/services/middlewares 三层分离，前端拆分为 types/hooks/components 三层，通过环境变量解耦配置。

**Tech Stack:** Fastify 5 + Zod + Prisma 6 + SQLite（后端），React 19 + TanStack Query 5 + Tailwind 4（前端），tsx（开发运行时）

---

## Task 1: Prisma Schema 迁移

**Files:**
- Modify: `prisma/schema.prisma`
- Run migration

**Step 1: 修改 schema.prisma**

将文件改为：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Prompt {
  id          String          @id @default(uuid())
  name        String          @unique
  title       String
  content     String
  description String?
  category    String?
  version     Int             @default(1)
  variables   String          @default("[]")
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  versions    PromptVersion[]
}

model PromptVersion {
  id        String   @id @default(uuid())
  promptId  String
  version   Int
  content   String
  variables String   @default("[]")
  savedAt   DateTime @default(now())
  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
}

model Skill {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  manifest    String
  codePath    String?
  type        String   @default("local")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Step 2: 运行迁移**

```bash
cd /root/workspace/gemini/prompt/manager
npx prisma migrate dev --name add_prompt_versions_remove_tags
npx prisma generate
```

Expected: Migration applied, client regenerated.

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add PromptVersion table, remove unused tags field"
```

---

## Task 2: 后端 config.ts + auth middleware

**Files:**
- Create: `server/src/config.ts`
- Create: `server/src/middlewares/auth.ts`

**Step 1: 创建 config.ts**

```typescript
// server/src/config.ts
export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  apiKey: process.env.API_KEY ?? '',
}
```

**Step 2: 创建 auth.ts**

```typescript
// server/src/middlewares/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { config } from '../config'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!config.apiKey) return // 未配置 API_KEY 时跳过认证（开发环境）
  const auth = request.headers.authorization
  if (!auth || auth !== `Bearer ${config.apiKey}`) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
}
```

**Step 3: 在根目录 .env 中添加变量**

打开 `/root/workspace/gemini/prompt/manager/.env`，添加（如果不存在则创建）：

```
PORT=3000
HOST=0.0.0.0
API_KEY=your-secret-key-here
```

**Step 4: Commit**

```bash
git add server/src/config.ts server/src/middlewares/auth.ts
git commit -m "feat(server): add config module and auth middleware"
```

---

## Task 3: Prompt Service

**Files:**
- Create: `server/src/services/promptService.ts`

**Step 1: 创建 promptService.ts**

```typescript
// server/src/services/promptService.ts
import { prisma } from '../lib/prisma'

function extractVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1])))
}

export const promptService = {
  async findAll() {
    return prisma.prompt.findMany({ orderBy: { updatedAt: 'desc' } })
  },

  async findById(id: string) {
    return prisma.prompt.findUnique({ where: { id } })
  },

  async upsert(data: {
    name: string
    title: string
    content: string
    description?: string
    category?: string
  }) {
    const variables = JSON.stringify(extractVariables(data.content))

    // 查找现有记录
    const existing = await prisma.prompt.findUnique({ where: { name: data.name } })

    if (existing) {
      // 先保存当前版本快照
      await prisma.promptVersion.create({
        data: {
          promptId: existing.id,
          version: existing.version,
          content: existing.content,
          variables: existing.variables,
        },
      })
      // 更新 prompt，版本号 +1
      return prisma.prompt.update({
        where: { name: data.name },
        data: { ...data, variables, version: { increment: 1 } },
      })
    }

    return prisma.prompt.create({
      data: { ...data, variables },
    })
  },

  async deleteById(id: string) {
    return prisma.prompt.delete({ where: { id } })
  },

  async findVersions(id: string) {
    return prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { version: 'desc' },
    })
  },
}
```

**Step 2: 验证编译**

```bash
cd /root/workspace/gemini/prompt/manager
npx tsc --noEmit
```

Expected: 无错误

**Step 3: Commit**

```bash
git add server/src/services/promptService.ts
git commit -m "feat(server): add promptService with version snapshot logic"
```

---

## Task 4: Prompt Routes

**Files:**
- Create: `server/src/routes/prompts.ts`

**Step 1: 创建 routes/prompts.ts**

```typescript
// server/src/routes/prompts.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { promptService } from '../services/promptService'
import { requireAuth } from '../middlewares/auth'

export async function promptRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.get('/api/prompts', async () => {
    return promptService.findAll()
  })

  server.get('/api/prompts/:id', {
    schema: { params: z.object({ id: z.string() }) },
  }, async (request, reply) => {
    const prompt = await promptService.findById(request.params.id)
    if (!prompt) return reply.code(404).send({ error: 'Not found' })
    return prompt
  })

  server.get('/api/prompts/:id/versions', {
    schema: { params: z.object({ id: z.string() }) },
  }, async (request, reply) => {
    const versions = await promptService.findVersions(request.params.id)
    return versions
  })

  server.post('/api/prompts', {
    onRequest: [requireAuth],
    schema: {
      body: z.object({
        name: z.string(),
        title: z.string(),
        content: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
      }),
    },
  }, async (request) => {
    return promptService.upsert(request.body)
  })

  server.delete('/api/prompts/:id', {
    onRequest: [requireAuth],
    schema: { params: z.object({ id: z.string() }) },
  }, async (request, reply) => {
    await promptService.deleteById(request.params.id)
    reply.code(204).send()
  })
}
```

**Step 2: Commit**

```bash
git add server/src/routes/prompts.ts
git commit -m "feat(server): add prompt routes with auth protection"
```

---

## Task 5: Skill Service

**Files:**
- Create: `server/src/services/skillService.ts`

**Step 1: 创建 skillService.ts**

```typescript
// server/src/services/skillService.ts
import { prisma } from '../lib/prisma'

export const skillService = {
  async findAll() {
    return prisma.skill.findMany({ orderBy: { updatedAt: 'desc' } })
  },

  async findById(id: string) {
    return prisma.skill.findUnique({ where: { id } })
  },

  async upsert(data: {
    name: string
    description: string
    manifest: string
    codePath?: string
    type?: string
    isActive?: boolean
  }) {
    return prisma.skill.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    })
  },

  async deleteById(id: string) {
    return prisma.skill.delete({ where: { id } })
  },
}
```

**Step 2: Commit**

```bash
git add server/src/services/skillService.ts
git commit -m "feat(server): add skillService"
```

---

## Task 6: Skill Routes

**Files:**
- Create: `server/src/routes/skills.ts`

**Step 1: 创建 routes/skills.ts**

```typescript
// server/src/routes/skills.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { skillService } from '../services/skillService'
import { requireAuth } from '../middlewares/auth'

export async function skillRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.get('/api/skills', async () => {
    return skillService.findAll()
  })

  server.get('/api/skills/:id', {
    schema: { params: z.object({ id: z.string() }) },
  }, async (request, reply) => {
    const skill = await skillService.findById(request.params.id)
    if (!skill) return reply.code(404).send({ error: 'Not found' })
    return skill
  })

  server.post('/api/skills', {
    onRequest: [requireAuth],
    schema: {
      body: z.object({
        name: z.string(),
        description: z.string(),
        manifest: z.string(),
        codePath: z.string().optional(),
        type: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request) => {
    return skillService.upsert(request.body)
  })

  server.delete('/api/skills/:id', {
    onRequest: [requireAuth],
    schema: { params: z.object({ id: z.string() }) },
  }, async (request, reply) => {
    await skillService.deleteById(request.params.id)
    reply.code(204).send()
  })
}
```

**Step 2: Commit**

```bash
git add server/src/routes/skills.ts
git commit -m "feat(server): add skill routes with auth protection"
```

---

## Task 7: 重构 server/src/index.ts

**Files:**
- Modify: `server/src/index.ts`

**Step 1: 将 index.ts 改写为入口注册文件**

```typescript
// server/src/index.ts
import fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { config } from './config'
import { promptRoutes } from './routes/prompts'
import { skillRoutes } from './routes/skills'

const server = fastify()

server.register(cors, { origin: '*' })
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(promptRoutes)
server.register(skillRoutes)

const start = async () => {
  try {
    await server.listen({ port: config.port, host: config.host })
    console.log(`Server is running on http://localhost:${config.port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
```

**Step 2: 验证编译**

```bash
cd /root/workspace/gemini/prompt/manager
npx tsc --noEmit
```

Expected: 无错误

**Step 3: 启动服务器做冒烟测试**

```bash
npm run dev:server &
sleep 3
curl http://localhost:3000/api/prompts
curl http://localhost:3000/api/skills
```

Expected: 返回 `[]`（空数组）

**Step 4: 验证认证**

```bash
# 未带 token 的写操作应返回 401
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -d '{"name":"test","title":"Test","content":"Hello"}'
# Expected: {"error":"Unauthorized"}

# 带 token 的写操作应成功
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-here" \
  -d '{"name":"test","title":"Test","content":"Hello {{name}}"}'
# Expected: {"id":"...","name":"test",...}
```

**Step 5: 停止服务器并 Commit**

```bash
kill %1
git add server/src/index.ts
git commit -m "refactor(server): extract routes to separate modules, use config"
```

---

## Task 8: 前端类型定义

**Files:**
- Create: `web/src/types/prompt.ts`
- Create: `web/src/types/skill.ts`

**Step 1: 创建 prompt.ts**

```typescript
// web/src/types/prompt.ts
export interface Prompt {
  id: string
  name: string
  title: string
  content: string
  description?: string
  category?: string
  version: number
  variables: string   // JSON 数组字符串
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
```

**Step 2: 创建 skill.ts**

```typescript
// web/src/types/skill.ts
export interface Skill {
  id: string
  name: string
  description: string
  manifest: string
  codePath?: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**Step 3: Commit**

```bash
git add web/src/types/
git commit -m "feat(web): add TypeScript type definitions for Prompt and Skill"
```

---

## Task 9: 前端 config.ts + constants.ts

**Files:**
- Create: `web/src/config.ts`
- Create: `web/src/constants.ts`

**Step 1: 创建 config.ts**

```typescript
// web/src/config.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
})

export function getAuthHeaders() {
  const key = import.meta.env.VITE_API_KEY ?? ''
  return key ? { Authorization: `Bearer ${key}` } : {}
}
```

**Step 2: 创建 constants.ts**

```typescript
// web/src/constants.ts
export const CATEGORIES = ['All', 'Coding', 'Marketing', 'Business', 'Creative', 'General'] as const
export const CATEGORY_OPTIONS = ['Coding', 'Marketing', 'Business', 'Creative', 'General'] as const
```

**Step 3: 在 web/.env（开发）中配置**

创建文件 `web/.env.local`：

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your-secret-key-here
```

**Step 4: Commit**

```bash
git add web/src/config.ts web/src/constants.ts
git commit -m "feat(web): add config module with env-based API URL and constants"
```

---

## Task 10: 前端 API Hooks

**Files:**
- Create: `web/src/hooks/usePrompts.ts`
- Create: `web/src/hooks/useSkills.ts`

**Step 1: 创建 usePrompts.ts**

```typescript
// web/src/hooks/usePrompts.ts
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
```

**Step 2: 创建 useSkills.ts**

```typescript
// web/src/hooks/useSkills.ts
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
```

**Step 3: Commit**

```bash
git add web/src/hooks/
git commit -m "feat(web): add typed API hooks for prompts and skills"
```

---

## Task 11: 公共组件

**Files:**
- Create: `web/src/components/common/EmptyState.tsx`
- Create: `web/src/components/common/CategoryTabs.tsx`
- Create: `web/src/components/common/ContentTypeToggle.tsx`
- Create: `web/src/components/layout/Sidebar.tsx`
- Create: `web/src/lib/cn.ts`

**Step 1: 创建 cn.ts（工具函数）**

```typescript
// web/src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: 创建 EmptyState.tsx**

```tsx
// web/src/components/common/EmptyState.tsx
import { Layout } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Layout className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-400">No templates yet</p>
      <p className="text-xs text-gray-300 mt-1">Create your first one</p>
    </div>
  )
}
```

**Step 3: 创建 CategoryTabs.tsx**

```tsx
// web/src/components/common/CategoryTabs.tsx
import { cn } from '../../lib/cn'
import { CATEGORIES } from '../../constants'

interface Props {
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-7 gap-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'relative px-3.5 py-2.5 text-sm transition-all whitespace-nowrap',
            active === cat
              ? 'text-gray-900 font-semibold'
              : 'text-gray-500 hover:text-gray-700 font-medium'
          )}
        >
          {cat}
          {active === cat && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  )
}
```

**Step 4: 创建 ContentTypeToggle.tsx**

```tsx
// web/src/components/common/ContentTypeToggle.tsx
import { Layers, Code2 } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  value: 'prompts' | 'skills'
  onChange: (v: 'prompts' | 'skills') => void
}

export function ContentTypeToggle({ value, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg gap-0.5">
      <button
        onClick={() => onChange('prompts')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
          value === 'prompts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Layers className="w-3 h-3" /> Prompts
      </button>
      <button
        onClick={() => onChange('skills')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1',
          value === 'skills' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Code2 className="w-3 h-3" /> Skills
      </button>
    </div>
  )
}
```

**Step 5: 创建 Sidebar.tsx**

```tsx
// web/src/components/layout/Sidebar.tsx
import { Plus } from 'lucide-react'

interface Props {
  onCreateClick: () => void
}

export function Sidebar({ onCreateClick }: Props) {
  return (
    <aside className="w-52 border-r border-[#E8E5E0] flex flex-col h-screen sticky top-0 bg-[#F6F4F1] shrink-0">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" />
          </svg>
        </div>
        <span className="font-bold text-[15px] tracking-tight text-gray-900">OpenPrompt</span>
      </div>
      <div className="flex-1" />
      <div className="p-4">
        <button
          onClick={onCreateClick}
          className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>
    </aside>
  )
}
```

**Step 6: Commit**

```bash
git add web/src/lib/ web/src/components/
git commit -m "feat(web): add common components and layout sidebar"
```

---

## Task 12: PromptCard + SkillCard

**Files:**
- Create: `web/src/components/prompts/PromptCard.tsx`
- Create: `web/src/components/skills/SkillCard.tsx`

**Step 1: 创建 PromptCard.tsx**

```tsx
// web/src/components/prompts/PromptCard.tsx
import { Trash2 } from 'lucide-react'
import type { Prompt } from '../../types/prompt'

interface Props {
  item: Prompt
  onClick: () => void
  onDelete: (id: string) => void
}

export function PromptCard({ item, onClick, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5E0] bg-[#EDEAE6] group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">
            {item.category || 'Prompt'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-md shadow-sm hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
            {item.content}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#EDEAE6] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">
            Open
          </span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: 创建 SkillCard.tsx**

```tsx
// web/src/components/skills/SkillCard.tsx
import { Trash2 } from 'lucide-react'
import type { Skill } from '../../types/skill'

interface Props {
  item: Skill
  onClick: () => void
  onDelete: (id: string) => void
}

export function SkillCard({ item, onClick, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2.5 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#E8E5E0] bg-[#EDEAE6] group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">
            Skill
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-md shadow-sm hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
        <div className="absolute inset-0 pt-10 px-4 pb-4 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-gray-500 font-mono whitespace-pre-wrap break-words">
            {item.manifest || item.description}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#EDEAE6] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg scale-95 group-hover:scale-100 transition-transform duration-200">
            Open
          </span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add web/src/components/prompts/PromptCard.tsx web/src/components/skills/SkillCard.tsx
git commit -m "feat(web): add PromptCard and SkillCard with delete button"
```

---

## Task 13: VersionHistory 组件

**Files:**
- Create: `web/src/components/prompts/VersionHistory.tsx`

**Step 1: 创建 VersionHistory.tsx**

```tsx
// web/src/components/prompts/VersionHistory.tsx
import { X } from 'lucide-react'
import { usePromptVersions } from '../../hooks/usePrompts'
import type { PromptVersion } from '../../types/prompt'

interface Props {
  promptId: string
  onClose: () => void
  onRestore: (content: string) => void
}

export function VersionHistory({ promptId, onClose, onRestore }: Props) {
  const { data: versions = [], isLoading } = usePromptVersions(promptId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Version History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && <p className="text-sm text-gray-400 text-center py-8">Loading...</p>}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No history yet</p>
          )}
          {versions.map((v: PromptVersion) => (
            <div key={v.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">v{v.version}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(v.savedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono line-clamp-3">{v.content}</p>
              <button
                onClick={() => onRestore(v.content)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Restore this version
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/src/components/prompts/VersionHistory.tsx
git commit -m "feat(web): add VersionHistory slide-over component"
```

---

## Task 14: PromptEditor + SkillEditor

**Files:**
- Create: `web/src/components/prompts/PromptEditor.tsx`
- Create: `web/src/components/skills/SkillEditor.tsx`

**Step 1: 创建 PromptEditor.tsx**

```tsx
// web/src/components/prompts/PromptEditor.tsx
import { useState } from 'react'
import { ChevronLeft, Save, History } from 'lucide-react'
import { VersionHistory } from './VersionHistory'
import { CATEGORY_OPTIONS } from '../../constants'
import type { Prompt } from '../../types/prompt'

interface Props {
  item: Partial<Prompt>
  onBack: () => void
  onSave: (data: Partial<Prompt>) => void
}

export function PromptEditor({ item, onBack, onSave }: Props) {
  const [draft, setDraft] = useState(item)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
            {draft.title || 'Untitled'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.id && (
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <button
            onClick={() => onSave(draft)}
            className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input
          value={draft.title || ''}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200"
          placeholder="Give it a title..."
        />
        <select
          value={draft.category || 'General'}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea
          value={draft.content || ''}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          placeholder="Write your prompt here... Use {{variable}} syntax for variables."
          className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none"
        />
      </main>
      {showHistory && item.id && (
        <VersionHistory
          promptId={item.id}
          onClose={() => setShowHistory(false)}
          onRestore={(content) => {
            setDraft({ ...draft, content })
            setShowHistory(false)
          }}
        />
      )}
    </div>
  )
}
```

**Step 2: 创建 SkillEditor.tsx**

```tsx
// web/src/components/skills/SkillEditor.tsx
import { useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import type { Skill } from '../../types/skill'

interface Props {
  item: Partial<Skill>
  onBack: () => void
  onSave: (data: Partial<Skill>) => void
}

export function SkillEditor({ item, onBack, onSave }: Props) {
  const [draft, setDraft] = useState(item)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
            {draft.name || 'New Skill'}
          </span>
        </div>
        <button
          onClick={() => onSave(draft)}
          className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-10 space-y-5">
        <input
          value={draft.name || ''}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="text-3xl font-black text-gray-900 border-none outline-none w-full placeholder:text-gray-200"
          placeholder="Skill name (e.g. get_weather)..."
        />
        <input
          value={draft.description || ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 w-full"
          placeholder="Short description for the LLM..."
        />
        <textarea
          value={draft.manifest || ''}
          onChange={(e) => setDraft({ ...draft, manifest: e.target.value })}
          placeholder="Paste the full JSON manifest here..."
          className="w-full min-h-[480px] bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:bg-white focus:border-gray-300 transition-all font-mono text-sm leading-relaxed resize-none"
        />
      </main>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add web/src/components/prompts/PromptEditor.tsx web/src/components/skills/SkillEditor.tsx
git commit -m "feat(web): add PromptEditor with version history and SkillEditor"
```

---

## Task 15: 重构 App.tsx

**Files:**
- Modify: `web/src/App.tsx`

**Step 1: 将 App.tsx 改写**

```tsx
// web/src/App.tsx
import { useState, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/layout/Sidebar'
import { CategoryTabs } from './components/common/CategoryTabs'
import { ContentTypeToggle } from './components/common/ContentTypeToggle'
import { EmptyState } from './components/common/EmptyState'
import { PromptCard } from './components/prompts/PromptCard'
import { PromptEditor } from './components/prompts/PromptEditor'
import { SkillCard } from './components/skills/SkillCard'
import { SkillEditor } from './components/skills/SkillEditor'
import { usePrompts, useSavePrompt, useDeletePrompt } from './hooks/usePrompts'
import { useSkills, useSaveSkill, useDeleteSkill } from './hooks/useSkills'
import type { Prompt } from './types/prompt'
import type { Skill } from './types/skill'

const queryClient = new QueryClient()

function MainApp() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [contentType, setContentType] = useState<'prompts' | 'skills'>('prompts')
  const [selectedPrompt, setSelectedPrompt] = useState<Partial<Prompt> | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Partial<Skill> | null>(null)

  const { data: prompts = [] } = usePrompts()
  const { data: skills = [] } = useSkills()
  const savePrompt = useSavePrompt()
  const deletePrompt = useDeletePrompt()
  const saveSkill = useSaveSkill()
  const deleteSkill = useDeleteSkill()

  const filteredItems = useMemo(() => {
    const items = contentType === 'prompts' ? prompts : skills
    if (activeCategory === 'All') return items
    return items.filter((item) => (item as Prompt).category === activeCategory)
  }, [contentType, prompts, skills, activeCategory])

  const handleCreate = () => {
    if (contentType === 'prompts') {
      setSelectedPrompt({ name: `prompt-${Date.now()}`, title: '', content: '', category: 'General' })
    } else {
      setSelectedSkill({ name: '', description: '', manifest: '' })
    }
  }

  if (selectedPrompt) {
    return (
      <PromptEditor
        item={selectedPrompt}
        onBack={() => setSelectedPrompt(null)}
        onSave={(data) => {
          savePrompt.mutate(data, { onSuccess: () => setSelectedPrompt(null) })
        }}
      />
    )
  }

  if (selectedSkill) {
    return (
      <SkillEditor
        item={selectedSkill}
        onBack={() => setSelectedSkill(null)}
        onSave={(data) => {
          saveSkill.mutate(data, { onSuccess: () => setSelectedSkill(null) })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F4F1] flex text-gray-900 font-sans">
      <Sidebar onCreateClick={handleCreate} />
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="px-8 py-7">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight" />
            <ContentTypeToggle value={contentType} onChange={setContentType} />
          </div>
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {contentType === 'prompts'
              ? (filteredItems as Prompt[]).map((item) => (
                  <PromptCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedPrompt(item)}
                    onDelete={(id) => deletePrompt.mutate(id)}
                  />
                ))
              : (filteredItems as Skill[]).map((item) => (
                  <SkillCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedSkill(item)}
                    onDelete={(id) => deleteSkill.mutate(id)}
                  />
                ))}
            {filteredItems.length === 0 && <EmptyState />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  )
}
```

**Step 2: 删除不再需要的旧文件**

```bash
rm web/src/counter.ts web/src/style.css web/src/typescript.svg
```

**Step 3: 验证 TypeScript 编译**

```bash
cd /root/workspace/gemini/prompt/manager/web
npx tsc --noEmit
```

Expected: 无错误

**Step 4: Commit**

```bash
git add web/src/App.tsx
git rm web/src/counter.ts web/src/style.css web/src/typescript.svg
git commit -m "refactor(web): decompose App.tsx into typed components and hooks"
```

---

## Task 16: 验收测试

**Step 1: 启动完整开发环境**

```bash
cd /root/workspace/gemini/prompt/manager
npm run dev
```

**Step 2: 后端冒烟测试**

```bash
API_KEY=your-secret-key-here

# 创建 Prompt
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"name":"hello","title":"Hello World","content":"Hello {{name}}","category":"Coding"}'

# 查看列表
curl http://localhost:3000/api/prompts

# 更新（触发版本快照）
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"name":"hello","title":"Hello World v2","content":"Hi {{name}}, welcome!","category":"Coding"}'

# 查看版本历史（替换 <id> 为实际 ID）
curl http://localhost:3000/api/prompts/<id>/versions

# 删除
curl -X DELETE http://localhost:3000/api/prompts/<id> \
  -H "Authorization: Bearer $API_KEY"

# 认证失败场景
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -d '{"name":"test","title":"Test","content":"Test"}'
# Expected: {"error":"Unauthorized"}
```

**Step 3: 前端验收**

打开浏览器访问 `http://localhost:5173`，验证：

- [ ] 列表正常展示
- [ ] 新建 Prompt，填写内容，保存成功
- [ ] 再次编辑同一 Prompt，版本历史图标可见，点击展示历史
- [ ] 历史条目可以 Restore
- [ ] 卡片 hover 时删除按钮出现，点击后卡片消失
- [ ] 切换 Skills 标签，新建 Skill 正常
- [ ] 分类 Tab 过滤正常

**Step 4: 最终 Commit**

```bash
git add .
git commit -m "chore: finalize refactor, all features verified"
```
