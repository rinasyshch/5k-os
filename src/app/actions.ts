'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTask(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('tasks').update(data).eq('id', id)
  revalidatePath('/')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/tasks')
}

export async function createTask(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: task } = await supabase.from('tasks').insert(data).select().single()
  revalidatePath('/tasks')
  return task
}

export async function updateLead(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('leads').update(data).eq('id', id)
  revalidatePath('/crm')
}

export async function createLead(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').insert(data).select().single()
  revalidatePath('/crm')
  return lead
}

export async function deleteLead(id: string) {
  const supabase = await createClient()
  await supabase.from('leads').delete().eq('id', id)
  revalidatePath('/crm')
}

export async function createPayment(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: payment } = await supabase.from('payments').insert(data).select().single()
  revalidatePath('/revenue')
  return payment
}

export async function updatePayment(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('payments').update(data).eq('id', id)
  revalidatePath('/revenue')
}

export async function deletePayment(id: string) {
  const supabase = await createClient()
  await supabase.from('payments').delete().eq('id', id)
  revalidatePath('/revenue')
}
