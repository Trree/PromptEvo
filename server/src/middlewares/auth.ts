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
