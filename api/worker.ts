import cron from 'node-cron'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { UAParser } from 'ua-parser-js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const prisma = new PrismaClient()

console.log('Worker started, waiting for cron...')

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('Running analytics worker...')
  try {
    const listLength = await redis.llen('analytics:buffer')
    if (listLength === 0) return

    // Pop all items currently in the list
    const items = await redis.lpop('analytics:buffer', listLength)
    if (!items || items.length === 0) return

    const analyticsToInsert = []
    const linkClicksToIncrement: Record<string, number> = {}
    
    // Fetch link IDs mapping
    // We could optimize this by caching shortCode -> id mappings, but for now we query
    // Let's get distinct shortCodes
    const parsedItems = items.map(i => JSON.parse(i))
    const shortCodes = [...new Set(parsedItems.map(i => i.shortCode))]
    
    const links = await prisma.link.findMany({
      where: { shortCode: { in: shortCodes as string[] } },
      select: { id: true, shortCode: true }
    })
    const shortCodeToId = Object.fromEntries(links.map(l => [l.shortCode, l.id]))

    for (const item of parsedItems) {
      const linkId = shortCodeToId[item.shortCode]
      if (!linkId) continue // Link might have been deleted

      const parser = new UAParser(item.userAgent || '')
      const result = parser.getResult()
      
      const deviceType = result.device.type || (result.device.model ? 'Mobile' : 'Desktop')
      const browser = result.browser.name
      const os = result.os.name
      const fingerprint = item.hashedIp

      analyticsToInsert.push({
        linkId,
        clickedAt: new Date(item.clickedAt),
        userAgent: item.userAgent,
        deviceType: deviceType,
        browser: browser,
        os: os,
        language: item.language,
        fingerprint: fingerprint,
        referrer: item.referrer,
        // Country could be extracted from a geo-ip service, omitted for brevity here
      })

      linkClicksToIncrement[linkId] = (linkClicksToIncrement[linkId] || 0) + 1
    }

    // 1. Bulk insert analytics
    if (analyticsToInsert.length > 0) {
      await prisma.analytics.createMany({
        data: analyticsToInsert
      })
    }

    // 2. Increment global counters (Prisma doesn't support bulk update with different increments easily, 
    // so we use a transaction with individual updates)
    const updates = Object.entries(linkClicksToIncrement).map(([id, count]) => {
      return prisma.link.update({
        where: { id },
        data: { clicks: { increment: count } }
      })
    })
    await prisma.$transaction(updates)

    console.log(`Successfully processed ${items.length} analytics events.`)

  } catch (error) {
    console.error('Error processing analytics:', error)
  }
})
