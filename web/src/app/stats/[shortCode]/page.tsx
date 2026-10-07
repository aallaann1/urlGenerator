export const dynamic = 'force-dynamic'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCharts } from './charts'
import { AutoRefresh } from '@/components/AutoRefresh'

const prisma = new PrismaClient()

export default async function StatsPage({ params }: { params: { shortCode: string } }) {
  const link = await prisma.link.findUnique({
    where: { shortCode: params.shortCode },
    include: {
      Analytics: {
        orderBy: { clickedAt: 'desc' },
        take: 1000 // Limit for the demo
      }
    }
  })

  if (!link) {
    redirect('/')
  }

  // Aggregate data for charts
  const clicksByDate: Record<string, number> = {}
  const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablette: 0 }

  const referrersCount: Record<string, number> = {}
  const browserCounts: Record<string, number> = {}
  const osCounts: Record<string, number> = {}
  const languageCounts: Record<string, number> = {}
  const uniqueVisitors = new Set<string>()

  link.Analytics.forEach(a => {
    // Group by date (YYYY-MM-DD)
    const date = a.clickedAt.toISOString().split('T')[0]
    clicksByDate[date] = (clicksByDate[date] || 0) + 1

    // Group by device
    const device = a.deviceType || 'Desktop'
    deviceCounts[device] = (deviceCounts[device] || 0) + 1
    
    // Group by referrer
    let referrer = 'Direct / Inconnu'
    if (a.referrer) {
      try {
        const url = new URL(a.referrer)
        referrer = url.hostname
      } catch {
        referrer = a.referrer
      }
    }
    referrersCount[referrer] = (referrersCount[referrer] || 0) + 1
    
    if (a.browser) browserCounts[a.browser] = (browserCounts[a.browser] || 0) + 1
    if (a.os) osCounts[a.os] = (osCounts[a.os] || 0) + 1
    if (a.language) languageCounts[a.language] = (languageCounts[a.language] || 0) + 1
    if (a.fingerprint) uniqueVisitors.add(a.fingerprint)
  })

  const lineChartData = Object.entries(clicksByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, clicks]) => ({ date, clicks }))

  const pieChartData = Object.entries(deviceCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    
  const getTop = (record: Record<string, number>, max = 5) => Object.entries(record).sort((a, b) => b[1] - a[1]).slice(0, max)
  
  const topReferrers = getTop(referrersCount)
  const topBrowsers = getTop(browserCounts)
  const topOs = getTop(osCounts)
  const topLangs = getTop(languageCounts)

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <AutoRefresh interval={2000} />
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">&larr; Retour au tableau de bord</Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Statistiques pour {link.shortCode}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Clics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{link.clicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Visiteurs Uniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueVisitors.size}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Top Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <List top={topReferrers} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Top Navigateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <List top={topBrowsers} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Top OS</CardTitle>
          </CardHeader>
          <CardContent>
            <List top={topOs} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Langues</CardTitle>
          </CardHeader>
          <CardContent>
            <List top={topLangs} />
          </CardContent>
        </Card>
      </div>

      <StatsCharts lineChartData={lineChartData} pieChartData={pieChartData} />
    </div>
  )
}

function List({ top }: { top: [string, number][] }) {
  if (top.length === 0) return <p className="text-sm text-gray-400">Aucune donnée</p>
  return (
    <ul className="space-y-2">
      {top.map(([item, count]) => (
        <li key={item} className="flex justify-between items-center border-b pb-1 last:border-0">
          <span className="font-medium text-sm truncate max-w-[150px]" title={item}>{item}</span>
          <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">{count}</span>
        </li>
      ))}
    </ul>
  )
}
