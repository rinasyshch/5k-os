'use client'

import { useState } from 'react'
import { ChallengeState, Task, Lead, AiPlan } from '@/lib/types'
import { formatCurrency } from '@/lib/challenge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2, Circle, SkipForward, Calendar, Clock,
  Lightbulb, AlertTriangle, TrendingUp, Inbox, RefreshCw
} from 'lucide-react'
import { updateTask } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface Props {
  challenge: ChallengeState
  tasks: Task[]
  followups: Partial<Lead>[]
  aiPlan: AiPlan | null
  pipeline: Array<{ stage: string; est_deal_size_usd?: number }>
  pendingProposals: number
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }
const AREA_COLOR: Record<string, string> = {
  'Branding & Design': 'bg-violet-500/20 text-violet-300',
  'Client Acquisition': 'bg-blue-500/20 text-blue-300',
  'Freelance Platforms': 'bg-cyan-500/20 text-cyan-300',
  'UGC': 'bg-pink-500/20 text-pink-300',
  'Start-up/Product': 'bg-orange-500/20 text-orange-300',
  'Operations': 'bg-gray-500/20 text-gray-300',
}

export function TodayClient({ challenge, tasks, followups, aiPlan, pipeline, pendingProposals }: Props) {
  const router = useRouter()

  // Sort: high priority first, then by area relevance
  const prioritized = [...tasks].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  )
  const top3 = prioritized.slice(0, 3)

  const pipelineByStage = pipeline.reduce((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const weightedPipeline = pipeline
    .filter(l => !['Research', 'Won', 'Lost', 'Paid'].includes(l.stage))
    .reduce((s, l) => s + (l.est_deal_size_usd ?? 0) * 0.3, 0)

  async function completeTask(taskId: string) {
    await updateTask(taskId, { status: 'done', completed_at: new Date().toISOString() })
    router.refresh()
  }

  async function skipTask(taskId: string) {
    await updateTask(taskId, { status: 'skipped', skip_reason: 'skipped from today view' })
    router.refresh()
  }

  const progressColor =
    challenge.progressPct >= 80 ? 'text-green-400' :
    challenge.progressPct >= 40 ? 'text-amber-400' : 'text-primary'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <p className="text-sm text-muted-foreground">
            {challenge.today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Asia/Seoul
          </p>
        </div>
        {pendingProposals > 0 && (
          <a href="/ai-inbox">
            <Badge className="bg-primary/20 text-primary border-primary/30 cursor-pointer">
              <Inbox className="w-3 h-3 mr-1" />
              {pendingProposals} AI proposal{pendingProposals !== 1 ? 's' : ''} pending
            </Badge>
          </a>
        )}
      </div>

      {/* Challenge Progress — the big number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="md:col-span-2 bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Received</div>
                <div className={`text-4xl font-bold ${progressColor}`}>
                  {formatCurrency(challenge.receivedUsd)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  of {formatCurrency(challenge.targetUsd)} goal · {formatCurrency(challenge.remaining)} remaining
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">Day {challenge.dayNumber}</div>
                <div className="text-sm text-muted-foreground">of 90</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className={challenge.daysLeft <= 14 ? 'text-amber-400' : ''}>{challenge.daysLeft} days left</span>
                </div>
              </div>
            </div>
            <Progress value={challenge.progressPct} className="h-2 bg-secondary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Nov 6</span>
              <span className="font-medium">{challenge.progressPct.toFixed(1)}%</span>
              <span>Feb 3</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(pipelineByStage).length === 0 ? (
              <p className="text-xs text-muted-foreground">No leads yet — add your first prospect in Sales CRM</p>
            ) : (
              Object.entries(pipelineByStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{stage}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
            {weightedPipeline > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">Weighted value</div>
                <div className="text-sm font-medium text-amber-400">
                  ~{formatCurrency(weightedPipeline)}
                  <span className="text-xs text-muted-foreground ml-1">not guaranteed</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Plan / Today's Insight */}
      {aiPlan ? (
        <Card className="bg-card border-border border-primary/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              AI Plan for Today
              <Badge variant="outline" className="text-[10px] ml-auto">{aiPlan.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiPlan.insight && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                {aiPlan.insight}
              </p>
            )}
            {aiPlan.priorities && aiPlan.priorities.map((p, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold text-primary mt-0.5">{i + 1}</span>
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.why}</div>
                  {p.est_minutes && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> ~{p.est_minutes} min
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiPlan.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="default" className="text-xs h-7">Accept Plan</Button>
                <Button size="sm" variant="outline" className="text-xs h-7">Edit</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground">Reject</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 inline mr-2 text-primary/50" />
              No AI plan for today. The morning agent will generate one at 08:30.
            </div>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground gap-1">
              <RefreshCw className="w-3 h-3" /> Generate now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Top Priorities Today</h2>
          <a href="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            All tasks →
          </a>
        </div>
        <div className="space-y-2">
          {top3.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No pending tasks.</p>
                <a href="/tasks">
                  <Button size="sm" variant="ghost" className="mt-2 text-xs">Add tasks →</Button>
                </a>
              </CardContent>
            </Card>
          ) : (
            top3.map((task) => (
              <TaskRow key={task.id} task={task} onComplete={completeTask} onSkip={skipTask} />
            ))
          )}
        </div>
      </div>

      {/* Follow-ups */}
      {followups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">Overdue Follow-ups</h2>
          </div>
          <div className="space-y-2">
            {followups.map((lead) => (
              <Card key={lead.id} className="bg-card border-amber-500/20">
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{lead.company}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.contact_name} · {lead.stage} · due {lead.next_followup}
                    </div>
                  </div>
                  <a href="/crm">
                    <Button size="sm" variant="outline" className="text-xs h-7">Follow up →</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Week reminder */}
      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        Week {challenge.weekNumber} of 13 ·{' '}
        {challenge.dayNumber <= 14 && '⚡ Foundation phase — real selling starts NOW'}
        {challenge.dayNumber > 14 && challenge.dayNumber <= 45 && '🎯 Active outreach phase'}
        {challenge.dayNumber > 45 && challenge.dayNumber <= 60 && '📈 Conversion phase'}
        {challenge.dayNumber > 60 && '🏁 Final sprint'}
      </div>
    </div>
  )
}

function TaskRow({ task, onComplete, onSkip }: {
  task: Task
  onComplete: (id: string) => void
  onSkip: (id: string) => void
}) {
  const areaClass = AREA_COLOR[task.area] || 'bg-gray-500/20 text-gray-300'

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors group">
      <CardContent className="py-3 flex items-start gap-3">
        <button
          onClick={() => onComplete(task.id)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-400 transition-colors"
        >
          <Circle className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{task.title}</span>
            {task.priority === 'High' && (
              <Badge className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300 border-red-500/30 font-normal">High</Badge>
            )}
            <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${areaClass}`}>
              {task.area}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {task.estimated_minutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimated_minutes >= 60
                  ? `${Math.floor(task.estimated_minutes / 60)}h ${task.estimated_minutes % 60 ? `${task.estimated_minutes % 60}m` : ''}`
                  : `${task.estimated_minutes}m`}
              </span>
            )}
            {task.week_number && (
              <span className="text-xs text-muted-foreground">Week {task.week_number}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onSkip(task.id)}
            className="p-1 rounded text-muted-foreground hover:text-amber-400 transition-colors"
            title="Skip"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded text-muted-foreground hover:text-blue-400 transition-colors" title="Reschedule">
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
