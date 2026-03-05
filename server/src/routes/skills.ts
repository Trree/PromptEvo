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
