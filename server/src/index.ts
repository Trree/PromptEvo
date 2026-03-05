import fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { z } from 'zod'
import { promptDb, skillDb } from './db'

// --- Config & Auth ---

const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  apiKey: process.env.API_KEY ?? '',
}

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!config.apiKey) return
  const auth = request.headers.authorization
  if (auth !== `Bearer ${config.apiKey}`) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

// --- Server Setup ---

const app = fastify()
app.register(cors, { origin: '*' })
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

const server = app.withTypeProvider<ZodTypeProvider>()

// --- Prompt Routes ---

server.get('/api/prompts', async () => promptDb.findAll())

server.get('/api/prompts/:id', {
  schema: { params: z.object({ id: z.string() }) },
}, async (req, reply) => {
  const p = await promptDb.findById(req.params.id)
  return p || reply.code(404).send({ error: 'Not found' })
})

server.get('/api/prompts/:id/versions', {
  schema: { params: z.object({ id: z.string() }) },
}, async (req) => promptDb.findVersions(req.params.id))

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
}, async (req) => promptDb.upsert(req.body))

server.delete('/api/prompts/:id', {
  onRequest: [requireAuth],
  schema: { params: z.object({ id: z.string() }) },
}, async (req, reply) => {
  await promptDb.deleteById(req.params.id)
  return reply.code(204).send()
})

// --- Skill Routes ---

server.get('/api/skills', async () => skillDb.findAll())

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
}, async (req) => skillDb.upsert(req.body))

server.delete('/api/skills/:id', {
  onRequest: [requireAuth],
  schema: { params: z.object({ id: z.string() }) },
}, async (req, reply) => {
  await skillDb.deleteById(req.params.id)
  return reply.code(204).send()
})

// --- Startup ---

const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host })
    console.log(`Minimal server running on http://localhost:${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
