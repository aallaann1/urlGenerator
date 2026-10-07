'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from '@/app/edit/[shortCode]/qrcode-display'

export default function DirectQRCodePage() {
  const [url, setUrl] = useState('')

  return (
    <div className="container mx-auto py-10 max-w-lg">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">&larr; Retour au tableau de bord</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>QR Code Rapide</CardTitle>
          <CardDescription>Générez un QR code pour n&apos;importe quelle URL sans créer de redirection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">URL de destination</label>
            <Input 
              id="url" 
              type="url" 
              placeholder="https://votresite.com" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          
          {url ? (
            <div className="pt-4 flex flex-col items-center border-t border-gray-100">
              <QRCodeDisplay url={url} />
            </div>
          ) : (
            <div className="pt-4 text-center text-sm text-gray-500 border-t border-gray-100 h-48 flex items-center justify-center">
              Saisissez une URL pour afficher le QR code
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
