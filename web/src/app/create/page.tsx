import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const prisma = new PrismaClient()

export default async function CreateLinkPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')

  async function createLink(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const originalUrl = formData.get('originalUrl') as string
    const shortCode = formData.get('shortCode') as string || Math.random().toString(36).substring(2, 8)
    const expiresAtStr = formData.get('expiresAt') as string
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null
    
    try {
      await prisma.link.create({
        data: {
          title,
          originalUrl,
          shortCode,
          expiresAt,
          userId: (session!.user as any).id
        }
      })
    } catch (e) {
      console.error("Erreur lors de la création du lien:", e)
      throw e
    }
    
    revalidatePath('/')
    redirect('/')
  }

  return (
    <div className="container mx-auto py-10 max-w-lg">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">&larr; Retour au tableau de bord</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau lien raccourci</CardTitle>
          <CardDescription>Générez un nouveau lien court et son QR code</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLink} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Titre (Interne)</label>
              <Input id="title" name="title" placeholder="Ex: Campagne Instagram" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="originalUrl" className="text-sm font-medium">URL de destination</label>
              <Input id="originalUrl" name="originalUrl" type="url" placeholder="https://votresite.com/page" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="shortCode" className="text-sm font-medium">Shortcode (Optionnel)</label>
              <Input id="shortCode" name="shortCode" placeholder="ex: promo-2024" />
            </div>
            <div className="space-y-2">
              <label htmlFor="expiresAt" className="text-sm font-medium">Date d&apos;expiration (Optionnel)</label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" />
            </div>
            <Button type="submit" className="w-full">Générer le lien</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
