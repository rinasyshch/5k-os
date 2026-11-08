export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getChallengeState, formatCurrency, getWeekDates } from '@/lib/challenge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus, AlertTriangle } from 'lucide-react'

export default async function RevenuePage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  const { data: roadmap } = await supabase
    .from('roadmap_weeks')
    .select('week_number, revenue_target_cumulative_usd, start_date, end_date')
    .order('week_number')

  const received = payments?.filter(p => p.status === 'received') ?? []
  const receivedUsd = received.reduce((s, p) => s + p.amount_usd, 0)
  const challenge = getChallengeState(receivedUsd)

  const invoiced = payments?.filter(p => p.status === 'invoiced') ?? []
  const contracted = payments?.filter(p => p.status === 'contracted') ?? []
  const expected = payments?.filter(p => p.status === 'expected') ?? []

  const totalExpenses = expenses?.reduce((s, e) => s + e.amount_usd, 0) ?? 0
  const netIncome = receivedUsd - totalExpenses

  const statusColor: Record<string, string> = {
    received: 'bg-green-500/20 text-green-300',
    invoiced: 'bg-blue-500/20 text-blue-300',
    contracted: 'bg-amber-500/20 text-amber-300',
    expected: 'bg-gray-500/20 text-gray-300',
    refunded: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Log Payment
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Received" value={formatCurrency(receivedUsd)} sub="counts toward $5K" highlight />
        <MetricCard label="Remaining" value={formatCurrency(challenge.remaining)} sub={`${challenge.daysLeft} days left`} />
        <MetricCard label="Invoiced (pending)" value={formatCurrency(invoiced.reduce((s,p)=>s+p.amount_usd,0))} sub="not guaranteed" dim />
        <MetricCard label="Net income" value={formatCurrency(netIncome)} sub="after expenses" />
      </div>

      {/* Last safe signing date warning */}
      {challenge.today <= new Date('2027-01-12') ? null : (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              Past the last safe signing date (Jan 12). New deals signed now may not receive payment before Feb 3.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weekly targets */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Revenue Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {roadmap?.filter(w => w.revenue_target_cumulative_usd > 0).map(w => {
              const target = w.revenue_target_cumulative_usd
              const pct = Math.min(100, (receivedUsd / target) * 100)
              const isCurrent = challenge.weekNumber === w.week_number
              return (
                <div key={w.week_number} className={`flex items-center gap-3 text-sm ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <span className={`w-14 text-xs ${isCurrent ? 'text-primary font-medium' : ''}`}>
                    Wk {w.week_number}
                  </span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${receivedUsd >= target ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs">{formatCurrency(target)}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payments table */}
      <div>
        <h2 className="text-sm font-semibold mb-3">All Payments</h2>
        {payments?.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="py-10 text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments logged yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Log your first payment when a client pays the deposit.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments?.map(p => (
              <Card key={p.id} className="bg-card border-border">
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{p.client_name}</div>
                    <div className="text-xs text-muted-foreground">{p.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(p.amount_usd)}</div>
                    {p.currency_original !== 'USD' && (
                      <div className="text-xs text-muted-foreground">
                        {p.amount_original} {p.currency_original}
                      </div>
                    )}
                  </div>
                  <Badge className={`text-[10px] px-2 py-0.5 font-normal border-0 ${statusColor[p.status]}`}>
                    {p.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expenses */}
      {expenses && expenses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Expenses ({formatCurrency(totalExpenses)})</h2>
          <div className="space-y-1.5">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>{e.description}</span>
                <span>-{formatCurrency(e.amount_usd)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, sub, highlight, dim }: {
  label: string; value: string; sub?: string; highlight?: boolean; dim?: boolean
}) {
  return (
    <Card className={`bg-card border-border ${highlight ? 'border-primary/30' : ''}`}>
      <CardContent className="pt-4 pb-3">
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : dim ? 'text-muted-foreground' : 'text-foreground'}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}
