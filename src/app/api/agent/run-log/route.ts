import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  agent: z.string(),
  status: z.enum(['success', 'partial', 'failed']),
  searches_used: z.number().optional(),
  proposals_created: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 })

  const supabase = await createAdminClient()
  const { error } = await supabase.from('agent_run_log').insert(parsed.data)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
