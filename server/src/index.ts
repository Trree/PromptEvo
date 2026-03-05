import fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from './lib/prisma'

const server = fastify().withTypeProvider<ZodTypeProvider>()

server.register(cors, {
  origin: '*', // 在本地开发环境下允许所有来源
})

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

// 辅助函数：从文本中提取 {{variable}}
function extractVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1])))
}

// ---------------------------------------------------------
// Prompts 路由
// ---------------------------------------------------------

// 获取所有 Prompt
server.get('/api/prompts', async () => {
  return await prisma.prompt.findMany({
    orderBy: { updatedAt: 'desc' },
  })
})

// 创建/更新 Prompt
server.post('/api/prompts', {
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
  const { name, title, content, description, category } = request.body
  const variables = JSON.stringify(extractVariables(content))

  return await prisma.prompt.upsert({
    where: { name },
    update: { title, content, description, category, variables },
    create: { name, title, content, description, category, variables },
  })
})

// ---------------------------------------------------------
// Skills 路由
// ---------------------------------------------------------

server.get('/api/skills', async () => {
  return await prisma.skill.findMany({
    orderBy: { updatedAt: 'desc' },
  })
})

server.post('/api/skills', {
  schema: {
    body: z.object({
      name: z.string(),
      description: z.string(),
      manifest: z.string(), // 暂存 JSON 字符串
      codePath: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  },
}, async (request) => {
  const data = request.body
  return await prisma.skill.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  })
})

// 启动服务
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server is running on http://localhost:3000')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
