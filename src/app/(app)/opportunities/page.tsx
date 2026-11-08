export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { OpportunitiesClient } from './OpportunitiesClient'

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const [{ data: opportunities }, { data: quickCapture }] = await Promise.all([
    supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
    supabase.from('quick_capture').select('*').eq('status', 'inbox').order('created_at', { ascending: false }),
  ])
  return <OpportunitiesClient opportunities={opportunities ?? []} inbox={quickCapture ?? []} />
}
