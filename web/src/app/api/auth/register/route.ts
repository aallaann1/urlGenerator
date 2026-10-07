import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { email, password, captchaValue, captchaHash } = await request.json()

    // 1. Verify Captcha
    const secret = process.env.NEXTAUTH_SECRET || 'secret'
    const expectedHash = crypto.createHmac('sha256', secret).update(captchaValue.toLowerCase()).digest('hex')

    if (expectedHash !== captchaHash) {
      return NextResponse.json({ error: "Captcha incorrect" }, { status: 400 })
    }

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    // 3. Create User
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 })
  }
}
