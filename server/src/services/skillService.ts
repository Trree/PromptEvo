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
