export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge'
import { TodayClient } from './TodayClient'

export default async function TodayPage() {
  const supabase = await createClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const [
    { data: payments },
    { data: tasks },
    { data: followups },
    { data: aiPlan },
    { data: pipeline },
    { count: pendingProposals },
  ] = await Promise.all([
    supabase.from('payments').select('amount_usd, status').eq('status', 'received'),
    supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']).order('priority', { ascending: true }).order('due_date', { ascending: true }).limit(20),
    supabase.from('leads').select('id, company, contact_name, next_followup, stage').lte('next_followup', todayStr).eq('is_archived', false).order('next_followup', { ascending: true }).limit(5),
    supabase.from('ai_plans').select('*').eq('plan_date', todayStr).maybeSingle(),
    supabase.from('leads').select('stage, est_deal_size_usd').eq('is_archived', false),
    supabase.from('ai_proposals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const receivedUsd = payments?.reduce((s, p) => s + (p.amount_usd || 0), 0) ?? 0
  const challenge = getChallengeState(receivedUsd)

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
