export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { AiInboxClient } from './AiInboxClient'

export default async function AiInboxPage() {
  const supabase = await createClient()
  const [{ data: proposals }, { data: plans }, { data: requests }, { data: runLog }] = await Promise.all([
    supabase.from('ai_proposals').select('*').order('created_at', { ascending: false }),
    supabase.from('ai_plans').select('*').order('plan_date', { ascending: false }).limit(7),
    supabase.from('ai_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
    supabase.from('agent_run_log').select('*').order('created_at', { ascending: false }).limit(10),
  ])
  return <AiInboxClient proposals={proposals ?? []} plans={plans ?? []} requests={requests ?? []} runLog={runLog ?? []} />
}
