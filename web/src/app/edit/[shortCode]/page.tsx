import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from './qrcode-display'

const prisma = new PrismaClient()

export default async function EditLinkPage({ params }: { params: { shortCode: string } }) {
  const link = await prisma.link.findUnique({
    where: { shortCode: params.shortCode }
  })

  if (!link) {
    redirect('/')
  }

  async function updateLink(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const originalUrl = formData.get('originalUrl') as string
    const expiresAtStr = formData.get('expiresAt') as string
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null
    
    await prisma.link.update({
      where: { shortCode: params.shortCode },
      data: {
        title,
        originalUrl,
        expiresAt
      }
    })
    
    redirect('/')
  }

  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3001'
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  
  // Par défaut, si on est en local sur le port 3001 (Next.js), on pointe le QR code vers le port 3000 (Fastify)
  // En production, ça utilisera le domaine actuel de l'application.
  const apiHost = host.includes('localhost:3001') ? host.replace('3001', '3000') : host
  
  const shortUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/${link.shortCode}`
    : `${protocol}://${apiHost}/${link.shortCode}`
    
  // Format the date for the datetime-local input
  const formattedExpiresAt = link.expiresAt ? new Date(link.expiresAt.getTime() - link.expiresAt.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">&larr; Retour au tableau de bord</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
        <CardHeader>
          <CardTitle>Éditer le lien</CardTitle>
          <CardDescription>Modifiez la destination sans changer le QR Code</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateLink} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Titre</label>
              <Input id="title" name="title" defaultValue={link.title || ''} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="originalUrl" className="text-sm font-medium">URL de destination</label>
              <Input id="originalUrl" name="originalUrl" type="url" defaultValue={link.originalUrl} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Shortcode (Non modifiable)</label>
              <Input value={link.shortCode} disabled />
            </div>
            <div className="space-y-2">
              <label htmlFor="expiresAt" className="text-sm font-medium">Date d&apos;expiration (Optionnel)</label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={formattedExpiresAt} />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="w-full">Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Dynamique</CardTitle>
          <CardDescription>Scannez pour tester ou téléchargez pour impression.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <QRCodeDisplay url={shortUrl} />
          <div className="text-sm text-center bg-gray-100 p-2 rounded w-full overflow-hidden text-ellipsis">
            {shortUrl}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
