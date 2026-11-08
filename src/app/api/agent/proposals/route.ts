import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ProposalSchema = z.object({
  type: z.enum(['task', 'lead', 'note', 'strategy']),
  payload: z.record(z.string(), z.unknown()),
  rationale: z.string().optional(),
  dedupe_key: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = ProposalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() as unknown }, { status: 422 })
  }

  const supabase = await createAdminClient()

  // Check dedup
  if (parsed.data.dedupe_key) {
    const { data: existing } = await supabase
      .from('ai_proposals')
      .select('id')
      .eq('dedupe_key', parsed.data.dedupe_key)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, duplicate: true })
    }
  }

  const { data, error } = await supabase
    .from('ai_proposals')
    .insert({
      type: parsed.data.type,
      payload: parsed.data.payload,
      rationale: parsed.data.rationale,
      dedupe_key: parsed.data.dedupe_key,
      status: 'pending',
      source: 'agent',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
