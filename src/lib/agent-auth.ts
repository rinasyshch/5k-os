import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'

export function verifyAgentToken(request: NextRequest): boolean {
  const token = process.env.AGENT_TOKEN
  if (!token) return false

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const provided = authHeader.slice(7)
  try {
    const a = Buffer.from(token)
    const b = Buffer.from(provided)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
