import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  request_id: z.string().uuid(),
  answer_md: z.string().min(1),
})

export async function POST(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 })

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('ai_requests')
    .update({ answer_md: parsed.data.answer_md, status: 'answered', answered_at: new Date().toISOString() })
    .eq('id', parsed.data.request_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also create a proposal so the answer appears in AI Inbox
  await supabase.from('ai_proposals').insert({
    type: 'answer',
    payload: { request_id: parsed.data.request_id, answer_md: parsed.data.answer_md },
    status: 'pending',
    source: 'agent',
  })

  return NextResponse.json({ ok: true })
}
