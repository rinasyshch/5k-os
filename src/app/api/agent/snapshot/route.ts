import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentToken } from '@/lib/agent-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge'

export async function GET(request: NextRequest) {
  if (!verifyAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // Revenue
  const { data: payments } = await supabase.from('payments').select('status, amount_usd, service')
  const received = payments?.filter(p => p.status === 'received') ?? []
  const receivedUsd = received.reduce((s, p) => s + p.amount_usd, 0)
  const invoiced = payments?.filter(p => p.status === 'invoiced').reduce((s, p) => s + p.amount_usd, 0) ?? 0
  const contracted = payments?.filter(p => p.status === 'contracted').reduce((s, p) => s + p.amount_usd, 0) ?? 0

  const challenge = getChallengeState(receivedUsd)

  // Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, area, priority, status, due_date, week_number, estimated_minutes, done_criteria')
    .in('status', ['pending', 'in_progress'])
    .order('priority')
    .limit(30)

  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, area, priority, due_date')
    .in('status', ['pending', 'in_progress'])
    .lt('due_date', challenge.today.toISOString().split('T')[0])
    .limit(10)

  // Leads pipeline
  const { data: leads } = await supabase
    .from('leads')
    .select('id, company, stage, potential_service, est_deal_size_usd, next_followup, score')
    .eq('is_archived', false)
    .not('stage', 'in', '("Lost")')

  const overdueFollowups = leads?.filter(l => {
    return l.next_followup && l.next_followup <= challenge.today.toISOString().split('T')[0]
  }) ?? []

  // This week stats
  const { start: weekStart } = (() => {
    const start = new Date('2026-11-06')
    const weekStart = new Date(start)
    weekStart.setDate(start.getDate() + (challenge.weekNumber - 1) * 7)
    return { start: weekStart }
  })()

  const { data: weekLeads } = await supabase
    .from('leads')
    .select('stage, outreach_date')
    .gte('outreach_date', weekStart.toISOString().split('T')[0])

  // Open AI requests
  const { data: openRequests } = await supabase
    .from('ai_requests')
    .select('id, question, created_at')
    .eq('status', 'open')

  // Known domains for dedup
  const { data: knownLeads } = await supabase.from('leads').select('website')
  const { data: knownOpps } = await supabase.from('opportunities').select('source_url')
  const { data: rejectedOpps } = await supabase.from('opportunities').select('source_url').eq('status', 'rejected')

  const knownDomains = [
    ...(knownLeads?.map(l => extractDomain(l.website ?? '')) ?? []),
    ...(knownOpps?.map(o => extractDomain(o.source_url)) ?? []),
    ...(rejectedOpps?.map(o => extractDomain(o.source_url)) ?? []),
  ].filter(Boolean)

  // Last plans
  const { data: lastPlans } = await supabase
    .from('ai_plans')
    .select('plan_date, priorities, insight, status')
    .order('plan_date', { ascending: false })
    .limit(3)

  // Settings
  const { data: settingsRows } = await supabase.from('settings').select('key, value')
  const settings = settingsRows?.reduce((acc, r) => { acc[r.key] = r.value; return acc }, {} as Record<string, unknown>) ?? {}

  const snapshot = {
    generated_at: new Date().toISOString(),
    timezone: 'Asia/Seoul',

    challenge: {
      day_number: challenge.dayNumber,
      days_left: challenge.daysLeft,
      week_number: challenge.weekNumber,
      start_date: '2026-11-06',
      end_date: '2027-02-03',
    },

    revenue: {
      received_usd: receivedUsd,
      target_usd: challenge.targetUsd,
      remaining_usd: challenge.remaining,
      progress_pct: challenge.progressPct,
      invoiced_usd: invoiced,
      contracted_usd: contracted,
      note: 'Only received_usd counts toward the $5K goal',
    },

    this_week: {
      week_number: challenge.weekNumber,
      outreach_sent: weekLeads?.length ?? 0,
    },

    open_tasks: tasks?.slice(0, 15) ?? [],
    overdue_tasks: overdueTasks ?? [],

    leads_pipeline: {
      by_stage: leads?.reduce((acc, l) => {
        acc[l.stage] = (acc[l.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      overdue_followups: overdueFollowups.map(l => ({
        id: l.id, company: l.company, stage: l.stage, next_followup: l.next_followup
      })),
      total: leads?.length ?? 0,
    },

    known_domains: [...new Set(knownDomains)],
    open_ai_requests: openRequests ?? [],
    last_3_plans: lastPlans ?? [],
    settings: {
      weekly_hours: (settings.challenge as Record<string, unknown>)?.weekly_hours,
      time_split: (settings.challenge as Record<string, unknown>)?.time_split,
      decision_rules: settings.decision_rules,
      deposit_policy: (settings.challenge as Record<string, unknown>)?.deposit_policy,
    },
  }

  return NextResponse.json(snapshot)
}

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return ''
  }
}
