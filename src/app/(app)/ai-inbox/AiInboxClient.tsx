'use client'

import { useState } from 'react'
import { AiProposal, AiPlan } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Edit2, Bot, Calendar, List, Clipboard, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TYPE_LABEL: Record<string, string> = {
  plan: 'Daily Plan', task: 'Task', lead: 'Lead', opportunity: 'Opportunity',
  note: 'Note', strategy: 'Strategy', answer: 'Answer'
}

const TYPE_COLOR: Record<string, string> = {
  plan: 'bg-primary/15 text-primary', task: 'bg-blue-500/15 text-blue-400',
  lead: 'bg-green-500/15 text-green-400', opportunity: 'bg-amber-500/15 text-amber-400',
  note: 'bg-gray-500/15 text-gray-400', strategy: 'bg-purple-500/15 text-purple-400',
  answer: 'bg-cyan-500/15 text-cyan-400',
}

export function AiInboxClient({ proposals, plans, requests, runLog }: {
  proposals: AiProposal[]
  plans: AiPlan[]
  requests: Array<{ id: string; question: string; status: string; created_at: string }>
  runLog: Array<{ id: string; agent: string; status: string; proposals_created: number; created_at: string; notes?: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [question, setQuestion] = useState('')

  const pending = proposals.filter(p => p.status === 'pending')

  async function handleApprove(id: string) {
    const proposal = proposals.find(p => p.id === id)
    if (!proposal) return

    // Apply proposal to DB based on type
    if (proposal.type === 'task') {
      await supabase.from('tasks').insert({ ...proposal.payload, source: 'agent' })
    }

    await supabase.from('ai_proposals').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
    router.refresh()
  }

  async function handleReject(id: string) {
    await supabase.from('ai_proposals').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id)
    router.refresh()
  }

  async function handlePlanApprove(id: string) {
    await supabase.from('ai_plans').update({ status: 'approved' }).eq('id', id)
    router.refresh()
  }

  async function handlePlanReject(id: string) {
    await supabase.from('ai_plans').update({ status: 'rejected' }).eq('id', id)
    router.refresh()
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    await supabase.from('ai_requests').insert({ question: question.trim(), status: 'open' })
    setQuestion('')
    router.refresh()
  }

  async function copyContext() {
    // Build a context snapshot
    const snap = {
      type: 'context_snapshot',
      question: 'Your question here',
      challenge: { day: 'see /api/agent/snapshot', note: 'Open /api/agent/snapshot to get full context' }
    }
    await navigator.clipboard.writeText(
      `# 5K Business Growth OS — Context Snapshot\n\nFetch full context: GET /api/agent/snapshot\n\n## My question:\n\n[your question here]`
    )
    alert('Context template copied! Fetch /api/agent/snapshot for live data, then paste both into your Claude chat.')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Agent proposals require your approval before anything changes
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {pending.length} pending
          </Badge>
        )}
      </div>

      <Tabs defaultValue="proposals">
        <TabsList className="bg-secondary">
          <TabsTrigger value="proposals" className="text-xs">
            Proposals {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs">Daily Plans</TabsTrigger>
          <TabsTrigger value="ask" className="text-xs">Ask AI</TabsTrigger>
          <TabsTrigger value="log" className="text-xs">Run Log</TabsTrigger>
        </TabsList>

        {/* Proposals */}
        <TabsContent value="proposals" className="mt-4 space-y-3">
          {proposals.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-10 text-center">
                <Bot className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No proposals yet.</p>
                <p className="text-xs text-muted-foreground mt-1">The morning agent will add proposals here each day.</p>
              </CardContent>
            </Card>
          ) : (
            proposals.map(p => (
              <Card key={p.id} className={`bg-card border-border ${p.status === 'pending' ? 'border-primary/20' : 'opacity-60'}`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] font-normal border-0 ${TYPE_COLOR[p.type]}`}>{TYPE_LABEL[p.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${p.status === 'pending' ? 'border-amber-500/30 text-amber-400' : p.status === 'approved' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                      {p.status}
                    </Badge>
                  </div>

                  <pre className="text-xs text-muted-foreground bg-secondary rounded p-3 overflow-auto max-h-40 font-mono">
                    {JSON.stringify(p.payload, null, 2)}
                  </pre>

                  {p.rationale && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{p.rationale}</p>
                  )}

                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleApprove(p.id)}>
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => handleReject(p.id)}>
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Daily Plans */}
        <TabsContent value="plans" className="mt-4 space-y-3">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No daily plans yet. The morning agent generates one at 08:30.</p>
          ) : (
            plans.map(plan => (
              <Card key={plan.id} className={`bg-card border-border ${plan.status === 'pending' ? 'border-primary/20' : ''}`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{plan.plan_date}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${plan.status === 'pending' ? 'border-amber-500/30 text-amber-400' : plan.status === 'approved' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                      {plan.status}
                    </Badge>
                  </div>

                  {plan.insight && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{plan.insight}</p>
                  )}

                  {plan.priorities && (plan.priorities as Array<{title: string; why: string; est_minutes?: number}>).map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-bold text-primary mt-0.5">{i + 1}</span>
                      <div>
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.why}</div>
                      </div>
                    </div>
                  ))}

                  {plan.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handlePlanApprove(plan.id)}>Accept Plan</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handlePlanReject(plan.id)}>Reject</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Ask AI */}
        <TabsContent value="ask" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start gap-2">
                <Clipboard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Copy context for Claude</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Export a compact snapshot of your tracker data to paste into your Claude.ai chat (Project "5K Coach").
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={copyContext}>
                    Copy context snapshot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Question Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Questions saved here are answered by the morning agent and appear back in this inbox.
              </p>
              <form onSubmit={submitQuestion} className="space-y-2">
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What should I focus on this week? / Why am I not getting replies? / Is my $5K goal realistic?"
                  className="bg-secondary border-border text-sm min-h-20"
                />
                <Button type="submit" size="sm" disabled={!question.trim()}>Save question for agent</Button>
              </form>

              {requests.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs text-muted-foreground font-medium">Open questions:</div>
                  {requests.map(r => (
                    <div key={r.id} className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-3">
                      {r.question}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Run Log */}
        <TabsContent value="log" className="mt-4">
          {runLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runLog.map(log => (
                <div key={log.id} className="flex items-center gap-3 text-sm text-muted-foreground border-b border-border pb-2">
                  <Bot className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-foreground">{log.agent}</span>
                  <Badge variant="outline" className={`text-[10px] ${log.status === 'success' ? 'border-green-500/30 text-green-400' : log.status === 'failed' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'}`}>
                    {log.status}
                  </Badge>
                  <span className="text-xs">{log.proposals_created} proposals</span>
                  <span className="text-xs ml-auto">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
