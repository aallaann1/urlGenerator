import Fastify from 'fastify'
import Redis from 'ioredis'
import './worker'
import { PrismaClient } from '@prisma/client'
import cors from '@fastify/cors'
import * as crypto from 'crypto'

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

fastify.register(cors, { 
  origin: '*'
})

fastify.get('/:shortCode', async (request, reply) => {
  const { shortCode } = request.params as { shortCode: string }
  const cacheKey = `link:${shortCode}`
  
  // 1. Check Redis
  let linkData: any = await redis.hgetall(cacheKey)
  
  // 2. Fallback to Postgres
  if (!linkData || Object.keys(linkData).length === 0) {
    const link = await prisma.link.findUnique({
      where: { shortCode }
    })
    
    if (!link) {
      return reply.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/not-found`)
    }
    
    linkData = {
      originalUrl: link.originalUrl,
      isActive: link.isActive ? 'true' : 'false',
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : '',
      hasPassword: link.passwordHash ? 'true' : 'false'
    }
    
    // Save to Redis (cache for 1 hour for example)
    await redis.hmset(cacheKey, linkData)
    await redis.expire(cacheKey, 3600)
  }
  
  // 3. Verifications
  if (linkData.isActive === 'false') {
    return reply.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/inactive`)
  }
  
  if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
    return reply.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/expired`)
  }
  
  if (linkData.hasPassword === 'true') {
    // If password is required, redirect to unlock page
    return reply.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/unlock/${shortCode}`)
  }
  
  // 4. Analytics (Asynchronous)
  const ip = request.ip
  const hashedIp = crypto.createHash('sha256').update(ip).digest('hex')
  const userAgent = request.headers['user-agent']
  const referrer = request.headers.referer
  
  const analyticsData = {
    shortCode, // to look up linkId later
    clickedAt: new Date().toISOString(),
    userAgent: userAgent || null,
    referrer: referrer || null,
    language: request.headers['accept-language']?.split(',')[0] || null,
    hashedIp
  }
  
  // Push to Redis list without blocking
  redis.rpush('analytics:buffer', JSON.stringify(analyticsData)).catch(err => {
    fastify.log.error('Failed to push analytics', err)
  })
  
  // 5. Redirection
  return reply.redirect(linkData.originalUrl)
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server listening on http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
