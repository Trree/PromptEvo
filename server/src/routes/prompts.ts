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
