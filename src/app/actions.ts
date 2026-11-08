'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setupUser(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  return { userId: data.user?.id }
}

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

export async function updateProposal(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('ai_proposals').update(data).eq('id', id)
  revalidatePath('/ai-inbox')
}

export async function approveProposalTask(payload: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('tasks').insert({ ...payload, source: 'agent' })
  revalidatePath('/tasks')
}

export async function updateAiPlan(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('ai_plans').update(data).eq('id', id)
  revalidatePath('/ai-inbox')
}

export async function createAiRequest(question: string) {
  const supabase = await createClient()
  await supabase.from('ai_requests').insert({ question, status: 'open' })
  revalidatePath('/ai-inbox')
}

export async function updateOpportunity(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from('opportunities').update(data).eq('id', id)
  revalidatePath('/opportunities')
}

export async function createOpportunity(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: opp } = await supabase.from('opportunities').insert(data).select().single()
  revalidatePath('/opportunities')
  return opp
}
