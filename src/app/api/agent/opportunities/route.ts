import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const OppSchema = z.object({
  company: z.string().min(1),
  source_url: z.string().url(),
  evidence_quote: z.string().min(1).max(500),
  verified_at: z.string().datetime(),
  why_needs_design: z.string().min(1),
  potential_service: z.string().optional(),
  next_step: z.string().optional(),
  confidence: z.enum(['High', 'Medium', 'Low']),
  contact_route: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const items = Array.isArray(body) ? body : [body]
  const supabase = await createAdminClient()

  // Get known domains for dedup
  const { data: knownLeads } = await supabase.from('leads').select('website')
  const { data: knownOpps } = await supabase.from('opportunities').select('source_url')
  const knownDomains = new Set([
    ...(knownLeads?.map(l => extractDomain(l.website ?? '')) ?? []),
    ...(knownOpps?.map(o => extractDomain(o.source_url)) ?? []),
  ])

  const results = []
  for (const item of items) {
    const parsed = OppSchema.safeParse(item)
    if (!parsed.success) {
      results.push({ error: 'validation_failed', item, details: parsed.error.flatten() })
      continue
    }

    const domain = extractDomain(parsed.data.source_url)
    if (domain && knownDomains.has(domain)) {
      results.push({ skipped: true, reason: 'duplicate_domain', domain })
      continue
    }

    const { data, error } = await supabase.from('opportunities').insert({
      ...parsed.data,
      status: 'pending',
      source: 'agent',
    }).select().single()

    if (error) {
      results.push({ error: error.message })
    } else {
      knownDomains.add(domain)
      results.push({ ok: true, id: data.id })
    }
  }

  return NextResponse.json({ results }, { status: 201 })
}

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return ''
  }
}
