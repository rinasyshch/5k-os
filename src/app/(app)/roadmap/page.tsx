export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState, formatCurrency } from '@/lib/challenge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function RoadmapPage() {
  const supabase = await createClient()

  const [{ data: weeks }, { data: milestones }, { data: tasks }, { data: payments }] = await Promise.all([
    supabase.from('roadmap_weeks').select('*').order('week_number'),
    supabase.from('milestones').select('*').order('week_number'),
    supabase.from('tasks').select('id, title, week_number, status, priority, area').not('week_number', 'is', null).order('week_number'),
    supabase.from('payments').select('amount_usd, status').eq('status', 'received'),
  ])

  const receivedUsd = payments?.reduce((s, p) => s + p.amount_usd, 0) ?? 0
  const challenge = getChallengeState(receivedUsd)

  const tasksByWeek = tasks?.reduce((acc, t) => {
    const wk = t.week_number!
    if (!acc[wk]) acc[wk] = []
    acc[wk].push(t)
    return acc
  }, {} as Record<number, typeof tasks>) ?? {}

  const milestonesByWeek = milestones?.reduce((acc, m) => {
    if (!acc[m.week_number]) acc[m.week_number] = []
    acc[m.week_number].push(m)
    return acc
  }, {} as Record<number, typeof milestones>) ?? {}

  const statusRules = [
    { day: 14, text: 'If ≥60 outreach, 0 replies → change segment or message' },
    { day: 30, text: 'No proposal sent → change offer or channel' },
    { day: 45, text: '< $1,000 received → trigger strategy review' },
    { day: 60, text: '< $2,500 received → shift to highest-converting channel only' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">90-Day Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Nov 6, 2026 → Feb 3, 2027 · Week {challenge.weekNumber} of 13</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy Checkpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {statusRules.map(rule => (
            <div key={rule.day} className={`flex items-start gap-3 text-sm ${challenge.dayNumber > rule.day ? 'opacity-40' : ''}`}>
              <span className={`shrink-0 text-xs font-mono px-1.5 py-0.5 rounded ${challenge.dayNumber >= rule.day ? 'bg-amber-500/20 text-amber-400' : 'bg-secondary text-muted-foreground'}`}>
                Day {rule.day}
              </span>
              <span className="text-muted-foreground">{rule.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {weeks?.map(week => {
          const isCurrent = week.week_number === challenge.weekNumber
          const isPast = week.week_number < challenge.weekNumber
          const weekTasks = tasksByWeek[week.week_number] ?? []
          const weekMilestones = milestonesByWeek[week.week_number] ?? []
          const doneTasks = weekTasks.filter(t => t.status === 'done').length

          return (
            <Card key={week.week_number} className={`bg-card border-border ${isCurrent ? 'border-primary/40' : isPast ? 'opacity-60' : ''}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>Week {week.week_number}</div>
                    {isCurrent && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Current</Badge>}
                    {isPast && <Badge className="bg-secondary text-muted-foreground border-0 text-[10px]">Past</Badge>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {new Date(week.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(week.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {week.revenue_target_cumulative_usd > 0 && (
                      <div className={`text-sm font-medium mt-0.5 ${receivedUsd >= week.revenue_target_cumulative_usd ? 'text-green-400' : 'text-amber-400/70'}`}>
                        Target: {formatCurrency(week.revenue_target_cumulative_usd)}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-foreground font-medium mb-2">{week.objective}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {weekMilestones.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Milestones</div>
                      {weekMilestones.map((m: { id: string; title: string; status: string }) => (
                        <div key={m.id} className={`flex items-center gap-2 text-xs ${m.status === 'done' ? 'text-green-400 line-through' : 'text-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === 'done' ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                          {m.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {weekTasks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasks — {doneTasks}/{weekTasks.length} done</div>
                      {weekTasks.slice(0, 6).map(t => (
                        <div key={t.id} className={`flex items-center gap-2 text-xs ${t.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'done' ? 'bg-green-400' : t.priority === 'High' ? 'bg-red-400' : 'bg-muted-foreground'}`} />
                          {t.title}
                        </div>
                      ))}
                      {weekTasks.length > 6 && <div className="text-xs text-muted-foreground">+{weekTasks.length - 6} more</div>}
                    </div>
                  )}
                </div>

                {week.outreach_target > 0 && (
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    Outreach target: <strong className="text-foreground">{week.outreach_target}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
