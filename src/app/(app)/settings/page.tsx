export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settingsRows } = await supabase.from('settings').select('key, value')
  const settings = settingsRows?.reduce((acc, r) => { acc[r.key] = r.value; return acc }, {} as Record<string, unknown>) ?? {}

  return <SettingsClient settings={settings} />
}
