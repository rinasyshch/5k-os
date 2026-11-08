export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState, formatCurrency } from '@/lib/challenge'
import { TodayClient } from './TodayClient'

export default async function TodayPage() {
  const supabase = await createClient()

  // Fetch received payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_usd, status')
    .eq('status', 'received')

  const receivedUsd = payments?.reduce((s, p) => s + (p.amount_usd || 0), 0) ?? 0
  const challenge = getChallengeState(receivedUsd)

  // Fetch today's tasks (due today or high priority pending)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true })
    .limit(20)

  // Fetch overdue follow-ups from CRM
  const todayStr = challenge.today.toISOString().split('T')[0]
  const { data: followups } = await supabase
    .from('leads')
    .select('id, company, contact_name, next_followup, stage')
    .lte('next_followup', todayStr)
    .eq('is_archived', false)
    .order('next_followup', { ascending: true })
    .limit(5)

  // Fetch today's AI plan if exists
  const { data: aiPlan } = await supabase
    .from('ai_plans')
    .select('*')
    .eq('plan_date', todayStr)
    .maybeSingle()

  // Pipeline summary
  const { data: pipeline } = await supabase
    .from('leads')
    .select('stage, est_deal_size_usd')
    .eq('is_archived', false)

  // Pending proposals count
  const { count: pendingProposals } = await supabase
    .from('ai_proposals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <TodayClient
      challenge={challenge}
      tasks={tasks ?? []}
      followups={followups ?? []}
      aiPlan={aiPlan}
      pipeline={pipeline ?? []}
      pendingProposals={pendingProposals ?? 0}
    />
  )
}
