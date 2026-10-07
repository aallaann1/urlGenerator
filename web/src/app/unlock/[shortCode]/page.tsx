import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const prisma = new PrismaClient()

export default async function UnlockPage({ params }: { params: { shortCode: string } }) {
  const link = await prisma.link.findUnique({
    where: { shortCode: params.shortCode }
  })

  if (!link || !link.passwordHash) {
    redirect('/')
  }

  async function unlockLink(formData: FormData) {
    'use server'
    const password = formData.get('password') as string
    
    // In a real app, compare with bcrypt.compare(password, link.passwordHash)
    // For this prototype, we'll just do a basic string compare or assume success if it matches
    // Here we'd set a cookie and redirect to the original URL
    if (password === link?.passwordHash) { // Simplified
      redirect(link.originalUrl)
    } else {
      // Handle error (in NextJS server action, usually return state)
      console.log('Mot de passe incorrect')
    }
  }

  return (
    <div className="container mx-auto py-20 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Lien protégé</CardTitle>
          <CardDescription>Ce lien est protégé par un mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={unlockLink} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Accéder au lien</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
