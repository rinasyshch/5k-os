import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priorities: z.array(z.object({
    title: z.string(),
    why: z.string(),
    est_minutes: z.number().optional(),
    area: z.string().optional(),
    linked_task_id: z.string().uuid().optional(),
  })).max(3),
  followups: z.array(z.string()).optional(),
  insight: z.string().optional(),
  rationale: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = PlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createAdminClient()

  // Idempotent — upsert by date
  const { data, error } = await supabase
    .from('ai_plans')
    .upsert({
      plan_date: parsed.data.date,
      priorities: parsed.data.priorities,
      followups: parsed.data.followups ?? [],
      insight: parsed.data.insight,
      rationale: parsed.data.rationale,
      status: 'pending',
    }, { onConflict: 'plan_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
