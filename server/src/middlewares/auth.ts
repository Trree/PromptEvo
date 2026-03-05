// server/src/middlewares/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { config } from '../config'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!config.apiKey) {
    // 开发模式：未配置 API_KEY，跳过认证
    console.warn('[auth] API_KEY not set, skipping auth (dev mode)')
    return
  }
  const auth = request.headers.authorization
  if (!auth || auth !== `Bearer ${config.apiKey}`) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
