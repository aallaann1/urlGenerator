'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaHash, setCaptchaHash] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const loadCaptcha = async () => {
    try {
      const res = await fetch('/api/captcha')
      const data = await res.json()
      setCaptchaQuestion(data.question)
      setCaptchaHash(data.hash)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        captchaValue,
        captchaHash
      })
    })

    const data = await res.json()

    if (res.ok) {
      router.push('/login')
    } else {
      setError(data.error || 'Erreur inconnue')
      loadCaptcha() // Reload captcha on error
      setCaptchaValue('')
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inscription</CardTitle>
          <CardDescription>Créez votre compte pour gérer vos liens</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Vérification Anti-Bot</label>
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-gray-100 px-4 py-2 rounded text-lg font-bold">
                  {captchaQuestion || 'Chargement...'}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={loadCaptcha}>Changer la question</Button>
                <Input 
                  placeholder="Votre réponse (en chiffres)" 
                  required 
                  type="number" 
                  value={captchaValue} 
                  onChange={e => setCaptchaValue(e.target.value)} 
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">S&apos;inscrire</Button>
            
            <div className="text-center text-sm pt-4">
              Déjà un compte ? <Link href="/login" className="text-blue-500 hover:underline">Se connecter</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
