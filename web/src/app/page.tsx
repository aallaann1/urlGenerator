export const dynamic = 'force-dynamic'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { DeleteButton } from '@/components/DeleteButton'
import { AutoRefresh } from '@/components/AutoRefresh'
import { LogoutButton } from '@/components/LogoutButton'

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session?.user) return null

  // Try to fetch links, handle if DB is not connected yet
  let links: any[] = []
  try {
    links = await prisma.link.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error("Database not connected yet", error)
  }

  return (
    <div className="container mx-auto py-10">
      <AutoRefresh interval={2000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="flex space-x-2">
          <LogoutButton />
          <Link href="/qr">
            <Button variant="outline">Générateur QR</Button>
          </Link>
          <Link href="/create">
            <Button>Créer un lien</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos Liens</CardTitle>
          <CardDescription>Gérez vos liens raccourcis et QR codes dynamiques.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>ShortCode</TableHead>
                <TableHead>URL Originale</TableHead>
                <TableHead>Clics</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Aucun lien trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.title || 'N/A'}</TableCell>
                    <TableCell>{link.shortCode}</TableCell>
                    <TableCell className="truncate max-w-xs">{link.originalUrl}</TableCell>
                    <TableCell>{link.clicks}</TableCell>
                    <TableCell>
                      <Switch checked={link.isActive} disabled />
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Link href={`/edit/${link.shortCode}`}>
                        <Button variant="outline" size="sm">Éditer</Button>
                      </Link>
                      <Link href={`/stats/${link.shortCode}`}>
                        <Button variant="outline" size="sm">Stats</Button>
                      </Link>
                      <form action={async () => {
                        'use server'
                        await prisma.link.delete({ where: { id: link.id } })
                        revalidatePath('/')
                      }} className="inline-block ml-2">
                        <DeleteButton />
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
