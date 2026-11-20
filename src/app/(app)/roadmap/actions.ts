'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleTask(id: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'done' ? 'pending' : 'done'
  const extra = newStatus === 'done' ? { completed_at: new Date().toISOString() } : { completed_at: null }
  await supabase.from('tasks').update({ status: newStatus, ...extra }).eq('id', id)
  revalidatePath('/roadmap')
}

export async function toggleMilestone(id: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'done' ? 'pending' : 'done'
  await supabase.from('milestones').update({ status: newStatus }).eq('id', id)
  revalidatePath('/roadmap')
}
