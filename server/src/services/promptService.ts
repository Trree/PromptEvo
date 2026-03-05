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
