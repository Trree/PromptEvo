import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

// --- Prompt Logic ---

export function extractVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1])))
}

export const promptDb = {
  async findAll() {
    return prisma.prompt.findMany({ orderBy: { updatedAt: 'desc' } })
  },

  async findById(id: string) {
    return prisma.prompt.findUnique({ where: { id } })
  },

  async findVersions(id: string) {
    return prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { version: 'desc' },
    })
  },

  async upsert(data: {
    name: string
    title: string
    content: string
    description?: string
    category?: string
  }) {
    const variables = JSON.stringify(extractVariables(data.content))

    return prisma.$transaction(async (tx) => {
      const existing = await tx.prompt.findUnique({ where: { name: data.name } })

      if (existing) {
        await tx.promptVersion.create({
          data: {
            promptId: existing.id,
            version: existing.version,
            content: existing.content,
            variables: existing.variables,
          },
        })
        return tx.prompt.update({
          where: { name: data.name },
          data: { ...data, variables, version: { increment: 1 } },
        })
      }

      return tx.prompt.create({
        data: { ...data, variables },
      })
    })
  },

  async deleteById(id: string) {
    return prisma.prompt.delete({ where: { id } })
  },
}

// --- Skill Logic ---

export const skillDb = {
  async findAll() {
    return prisma.skill.findMany({ orderBy: { updatedAt: 'desc' } })
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
