import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage, sendTyping } from '@/lib/telegram'
import { askClaude } from '@/lib/ai-clients'

const SYSTEM_PROMPT = `Ты персональный бизнес-агент. Помогаешь фрилансеру из Кореи заработать $5000 за 90 дней.
Направления: бренд-дизайн (KBA), UGC-видео, веб/лендинги, AI-стартап.
Отвечай коротко и конкретно на русском. Используй английский для бизнес-терминов.
Когда получишь snapshot — анализируй реальные данные, не выдумывай.
Формат ответа для Telegram: простой текст, максимум 3-4 абзаца.`

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getSnapshot() {
  const sb = supabase()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: tasks }, { data: leads }, { data: payments }, { data: opps }] = await Promise.all([
    sb.from('tasks').select('title, status, priority, area, week_number').in('status', ['pending', 'in_progress']).order('priority').limit(30),
    sb.from('leads').select('company, stage, next_followup, est_deal_size_usd').eq('is_archived', false),
    sb.from('payments').select('amount_usd, status'),
    sb.from('opportunities').select('company, confidence, status').eq('status', 'pending').limit(10),
  ])

  const received = payments?.filter(p => p.status === 'received').reduce((s, p) => s + p.amount_usd, 0) ?? 0
  const start = new Date('2026-11-06T00:00:00')
  const dayNumber = Math.floor((new Date().getTime() - start.getTime()) / 86400000) + 1
  const overdueFollowups = leads?.filter(l => l.next_followup && l.next_followup <= today).length ?? 0

  return { dayNumber, received, remaining: 5000 - received, tasks: tasks ?? [], leads: leads ?? [], overdueFollowups, pendingOpportunities: opps?.length ?? 0 }
}

async function handleCommand(text: string, chatId: number): Promise<void> {
  const cmd = text.trim().toLowerCase()

  // /start
  if (cmd === '/start' || cmd === 'start') {
    await sendMessage(chatId,
      `👋 Привет! Я твой бизнес-агент.\n\n` +
      `<b>Команды:</b>\n` +
      `/today — план на сегодня\n` +
      `/status — прогресс по челленджу\n` +
      `/leads — поиск новых лидов (Gemini + Claude)\n` +
      `/overdue — просроченные follow-up\n` +
      `/tasks — активные задачи\n\n` +
      `Или просто напиши вопрос на русском — отвечу с учётом твоих данных.`
    )
    return
  }

  // /status
  if (cmd === '/status') {
    const snap = await getSnapshot()
    await sendMessage(chatId,
      `📊 <b>День ${snap.dayNumber}/90</b>\n\n` +
      `💰 Получено: $${snap.received}\n` +
      `🎯 Осталось: $${snap.remaining}\n` +
      `📋 Активных задач: ${snap.tasks.length}\n` +
      `👥 Лидов в CRM: ${snap.leads.length}\n` +
      `⚠️ Просроченных follow-up: ${snap.overdueFollowups}\n` +
      `🔍 Новых возможностей: ${snap.pendingOpportunities}`
    )
    return
  }

  // /overdue
  if (cmd === '/overdue') {
    const snap = await getSnapshot()
    const today = new Date().toISOString().split('T')[0]
    const overdue = snap.leads.filter(l => l.next_followup && l.next_followup <= today)
    if (overdue.length === 0) {
      await sendMessage(chatId, '✅ Просроченных follow-up нет.')
      return
    }
    const lines = overdue.map(l => `• <b>${l.company}</b> — ${l.next_followup} (${l.stage})`).join('\n')
    await sendMessage(chatId, `⚠️ <b>Просроченные follow-up (${overdue.length}):</b>\n\n${lines}`)
    return
  }

  // /tasks
  if (cmd === '/tasks') {
    const snap = await getSnapshot()
    const high = snap.tasks.filter(t => t.priority === 'High').slice(0, 8)
    if (high.length === 0) {
      await sendMessage(chatId, '✅ Нет активных задач с высоким приоритетом.')
      return
    }
    const lines = high.map(t => `• ${t.title} <i>(${t.area})</i>`).join('\n')
    await sendMessage(chatId, `📋 <b>Высокий приоритет:</b>\n\n${lines}`)
    return
  }

  // /leads — trigger dual research
  if (cmd === '/leads' || cmd.startsWith('/leads ')) {
    const focus = cmd.replace('/leads', '').trim() || undefined
    await sendMessage(chatId, '🔍 Запускаю поиск лидов (Gemini + Claude)...\nЭто займёт ~30 секунд.')

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') ?? 'https://5k-os-iota.vercel.app'}/api/agent/research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AGENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: chatId, focus }),
    })

    if (!res.ok) await sendMessage(chatId, '❌ Ошибка при поиске. Попробуй ещё раз.')
    return
  }

  // /today — AI plan
  if (cmd === '/today') {
    await sendTyping(chatId)
    const snap = await getSnapshot()
    const topTasks = snap.tasks.filter(t => t.priority === 'High').slice(0, 5)
    const context = `День ${snap.dayNumber}/90. Получено $${snap.received} из $5000. Просроченных follow-up: ${snap.overdueFollowups}. Активных задач: ${snap.tasks.length}. Топ задачи: ${topTasks.map(t => t.title).join(', ')}.`

    const plan = await askClaude(SYSTEM_PROMPT, `Вот мой текущий контекст: ${context}\n\nСоставь план на сегодня: 3 конкретных действия с объяснением почему именно они. Коротко.`)
    await sendMessage(chatId, `📅 <b>План на сегодня (День ${snap.dayNumber}):</b>\n\n${plan}`)
    return
  }

  // Free-form question
  await sendTyping(chatId)
  const snap = await getSnapshot()
  const context = `Данные трекера: День ${snap.dayNumber}/90, получено $${snap.received}/$5000, задач: ${snap.tasks.length}, лидов: ${snap.leads.length}, просроченных follow-up: ${snap.overdueFollowups}.`

  const answer = await askClaude(SYSTEM_PROMPT, `${context}\n\nВопрос: ${text}`)
  await sendMessage(chatId, answer)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    // Handle in background (Vercel serverless has 10s limit on response, but we process async)
    handleCommand(message.text, message.chat.id).catch(console.error)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
