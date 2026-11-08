export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { CRMClient } from './CRMClient'

export default async function CRMPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  return <CRMClient leads={leads ?? []} />
}
