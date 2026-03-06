import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

// --- Prompt Logic ---

export function extractVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1])))
}

export const promptDb = {
  async findAll() {
    return prisma.prompt.findMany({
      where: { isHidden: false },
      orderBy: { updatedAt: 'desc' },
    })
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
    id?: string
    name: string
    title: string
    content: string
    description?: string
    category?: string
    isHidden?: boolean
  }) {
    const variables = JSON.stringify(extractVariables(data.content))
    const { id, ...rest } = data

    return prisma.$transaction(async (tx) => {
      const existing = id 
        ? await tx.prompt.findUnique({ where: { id } })
        : await tx.prompt.findUnique({ where: { name: data.name } })

      if (existing) {
        // Only create a version if the content has changed
        if (existing.content !== data.content) {
          await tx.promptVersion.create({
            data: {
              promptId: existing.id,
              version: existing.version,
              content: existing.content,
              variables: existing.variables,
            },
          })
          return tx.prompt.update({
            where: { id: existing.id },
            data: { ...rest, variables, version: { increment: 1 } },
          })
        }
        return tx.prompt.update({
          where: { id: existing.id },
          data: { ...rest, variables },
        })
      }

      return tx.prompt.create({
        data: { ...rest, variables },
      })
    })
  },

  async deleteById(id: string) {
    return prisma.prompt.delete({ where: { id } })
  },

  async hideById(id: string) {
    return prisma.prompt.update({ where: { id }, data: { isHidden: true } })
  },
}

// --- Skill Logic ---

export const skillDb = {
  async findAll() {
    return prisma.skill.findMany({
      where: { isHidden: false },
      orderBy: { updatedAt: 'desc' },
    })
  },

  async upsert(data: {
    id?: string
    name: string
    description: string
    manifest: string
    codePath?: string
    type?: string
    isActive?: boolean
    isHidden?: boolean
  }) {
    const { id, ...rest } = data
    if (id) {
      return prisma.skill.update({ where: { id }, data: rest })
    }
    return prisma.skill.upsert({
      where: { name: data.name },
      update: rest,
      create: rest,
    })
  },

  async deleteById(id: string) {
    return prisma.skill.delete({ where: { id } })
  },

  async hideById(id: string) {
    return prisma.skill.update({ where: { id }, data: { isHidden: true } })
  },
}
