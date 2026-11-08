export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState } from '@/lib/challenge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getWeekDates, formatCurrency } from '@/lib/challenge'

export default async function ReviewsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase.from('payments').select('amount_usd, status').eq('status', 'received')
  const receivedUsd = payments?.reduce((s, p) => s + p.amount_usd, 0) ?? 0
  const challenge = getChallengeState(receivedUsd)

  const { data: reviews } = await supabase.from('weekly_reviews').select('*').order('week_number', { ascending: false })
  const { data: tasks } = await supabase.from('tasks').select('status, week_number')
  const { data: leads } = await supabase.from('leads').select('stage, outreach_date, created_at')

  const reviewsByWeek = reviews?.reduce((acc, r) => { acc[r.week_number] = r; return acc }, {} as Record<number, typeof reviews[0]>) ?? {}

  const weeks = Array.from({ length: challenge.weekNumber }, (_, i) => i + 1).reverse()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Reviews</h1>
        <Button size="sm">Write Week {challenge.weekNumber} Review</Button>
      </div>

      <div className="space-y-4">
        {weeks.map(wk => {
          const { start, end } = getWeekDates(wk)
          const review = reviewsByWeek[wk]
          const isCurrent = wk === challenge.weekNumber
          const weekTasks = tasks?.filter(t => t.week_number === wk) ?? []
          const doneTasks = weekTasks.filter(t => t.status === 'done').length

          return (
            <Card key={wk} className={`bg-card border-border ${isCurrent ? 'border-primary/30' : ''}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      Week {wk}
                    </span>
                    {isCurrent && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Current</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {review ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">{review.status}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">no review</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Tasks done</div>
                    <div className="font-medium">{doneTasks} / {weekTasks.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Leads added</div>
                    <div className="font-medium">
                      {leads?.filter(l => {
                        const d = new Date(l.created_at)
                        return d >= start && d <= end
                      }).length ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Outreach sent</div>
                    <div className="font-medium">
                      {leads?.filter(l => l.outreach_date && new Date(l.outreach_date) >= start && new Date(l.outreach_date) <= end).length ?? 0}
                    </div>
                  </div>
                </div>

                {review?.my_notes && (
                  <p className="text-sm text-muted-foreground mt-3 border-l-2 border-primary/20 pl-3">
                    {review.my_notes}
                  </p>
                )}

                {!review && !isCurrent && (
                  <Button size="sm" variant="ghost" className="mt-3 h-7 text-xs text-muted-foreground">
                    Write retrospective →
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
