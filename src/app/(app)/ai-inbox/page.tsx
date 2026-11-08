export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { AiInboxClient } from './AiInboxClient'

export default async function AiInboxPage() {
  const supabase = await createClient()

  const { data: proposals } = await supabase
    .from('ai_proposals')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: plans } = await supabase
    .from('ai_plans')
    .select('*')
    .order('plan_date', { ascending: false })
    .limit(7)

  const { data: requests } = await supabase
    .from('ai_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const { data: runLog } = await supabase
    .from('agent_run_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <AiInboxClient
      proposals={proposals ?? []}
      plans={plans ?? []}
      requests={requests ?? []}
      runLog={runLog ?? []}
    />
  )
}
