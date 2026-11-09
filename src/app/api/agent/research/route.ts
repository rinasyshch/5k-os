import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { askClaude, askGemini } from '@/lib/ai-clients'
import { sendMessage } from '@/lib/telegram'

const PROFILE = `
Ты помогаешь фрилансеру из Южной Кореи найти клиентов и заказы.
Профиль: бренд-дизайн (логотипы, айдентика, упаковка), веб/лендинги, UGC-видео.
Цель: заработать $5000 за 90 дней (ноябрь 2026 — февраль 2027).
Ищем: компании которым нужен брендинг, фриланс-заказы на дизайн/веб, UGC-кампании, стартапы на ранней стадии.
Приоритет: платные заказы от $200+, международные клиенты, работа удалённо.
`

function authOk(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return token === process.env.AGENT_TOKEN
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chat_id, focus } = await req.json().catch(() => ({}))
  const focusHint = focus ?? 'brand design, web/landing pages, UGC video, freelance'

  // Run Gemini and Claude searches in parallel
  const geminiPrompt = `
${PROFILE}

Используй Google Search чтобы найти реальные возможности прямо сейчас (ноябрь 2026).
Ищи по этим направлениям: ${focusHint}

Найди 5-8 конкретных возможностей. Для каждой укажи:
- company: название компании/проекта
- source_url: реальная ссылка на страницу где ты это нашёл
- evidence_quote: цитата (≤25 слов) с этой страницы которая подтверждает что им нужен дизайн/веб/UGC
- why_needs: почему им нужна помощь
- potential_service: какую услугу предложить
- next_step: конкретное первое действие
- confidence: High/Medium/Low

Отвечай ТОЛЬКО валидным JSON массивом, без текста до/после:
[{"company":"...","source_url":"...","evidence_quote":"...","why_needs":"...","potential_service":"...","next_step":"...","confidence":"High"}]
`

  const claudeSystem = `${PROFILE}

Ты агент по поиску клиентов. Твоя задача — найти реальные платёжеспособные лиды.
Ищи на: Upwork (свежие job posts), Contra, Kickstarter (новые кампании), Product Hunt (запуски этой недели), AngelList, LinkedIn job posts, Behance job listings.
Фокус: ${focusHint}

Найди 5-8 конкретных возможностей. Отвечай ТОЛЬКО валидным JSON массивом:
[{"company":"...","source_url":"...","evidence_quote":"...","why_needs":"...","potential_service":"...","next_step":"...","confidence":"High"}]`

  const claudeUser = `Найди актуальные возможности для фриланса и новых клиентов. Дата: ${new Date().toISOString().split('T')[0]}. Ищи реальные посты и компании которые сейчас активны.`

  if (chat_id) await sendMessage(chat_id, '🔍 Запускаю двойной поиск (Gemini + Claude)...')

  const [geminiRaw, claudeRaw] = await Promise.allSettled([
    askGemini(geminiPrompt),
    askClaude(claudeSystem, claudeUser),
  ])

  // Parse results
  function parseLeads(raw: string): Record<string, unknown>[] {
    try {
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) return []
      return JSON.parse(match[0])
    } catch {
      return []
    }
  }

  const geminiLeads = geminiRaw.status === 'fulfilled' ? parseLeads(geminiRaw.value) : []
  const claudeLeads = claudeRaw.status === 'fulfilled' ? parseLeads(claudeRaw.value) : []

  // Combine and deduplicate by company name
  const allLeads = [...geminiLeads, ...claudeLeads]
  const seen = new Set<string>()
  const unique = allLeads.filter(l => {
    const key = (l.company as string ?? '').toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (unique.length === 0) {
    if (chat_id) await sendMessage(chat_id, '❌ Не удалось найти лиды. Попробуй позже.')
    return NextResponse.json({ found: 0 })
  }

  // Claude synthesizes and scores the combined list
  const synthesisSystem = `${PROFILE}
Ты анализируешь список потенциальных лидов и выбираешь лучшие.
Критерии: реальная компания, платёжеспособность, соответствие услугам, доступность для контакта.
Отвечай ТОЛЬКО валидным JSON массивом.`

  const synthesisUser = `Вот ${unique.length} найденных возможностей (из двух агентов).
Оцени каждую, убери слабые (confidence=Low без явной причины), улучши описание.
Верни финальный список в том же JSON формате:
${JSON.stringify(unique, null, 2)}`

  let finalLeads = unique
  try {
    const synthesisRaw = await askClaude(synthesisSystem, synthesisUser)
    const parsed = parseLeads(synthesisRaw)
    if (parsed.length > 0) finalLeads = parsed
  } catch {
    // keep original if synthesis fails
  }

  // Write to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const toInsert = finalLeads.map(l => ({
    company: l.company,
    source_url: l.source_url ?? '',
    evidence_quote: l.evidence_quote ?? '',
    why_needs_design: l.why_needs ?? '',
    potential_service: l.potential_service ?? '',
    next_step: l.next_step ?? '',
    confidence: (l.confidence as string) ?? 'Medium',
    status: 'pending',
    source: 'agent',
    verified_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('opportunities').insert(toInsert)

  if (error) {
    if (chat_id) await sendMessage(chat_id, `❌ Ошибка записи в трекер: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log agent run
  await supabase.from('agent_run_log').insert({
    agent: 'research-dual',
    status: 'success',
    proposals_created: finalLeads.length,
    notes: `Gemini: ${geminiLeads.length}, Claude: ${claudeLeads.length}, after dedup+synthesis: ${finalLeads.length}`,
  })

  if (chat_id) {
    const high = finalLeads.filter(l => l.confidence === 'High').length
    const lines = finalLeads.slice(0, 5).map((l, i) =>
      `${i + 1}. <b>${l.company}</b> — ${l.potential_service}\n   ${l.next_step}`
    ).join('\n\n')

    await sendMessage(chat_id,
      `✅ <b>Найдено ${finalLeads.length} лидов</b> (${high} High confidence)\n\n${lines}\n\n→ Все в трекере: Opportunities`
    )
  }

  return NextResponse.json({ found: finalLeads.length, leads: finalLeads })
}
