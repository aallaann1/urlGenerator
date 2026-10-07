import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  const operator = Math.random() > 0.5 ? '+' : '*'
  let result = 0
  
  if (operator === '+') result = num1 + num2
  if (operator === '*') result = num1 * num2

  const question = `Combien font ${num1} ${operator} ${num2} ?`

  const secret = process.env.NEXTAUTH_SECRET || 'secret'
  const hash = crypto.createHmac('sha256', secret).update(result.toString()).digest('hex')

  return NextResponse.json({
    question: question,
    hash: hash
  })
}
