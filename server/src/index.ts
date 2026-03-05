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
