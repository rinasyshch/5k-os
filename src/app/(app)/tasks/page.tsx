export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { TasksClient } from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('priority', { ascending: true })
    .order('week_number', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .order('week_number', { ascending: true })

  return <TasksClient tasks={tasks ?? []} milestones={milestones ?? []} />
}
