'use client'

import { useState } from 'react'
import { Lead, LeadStage } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ExternalLink, ChevronRight, Users, AlertCircle } from 'lucide-react'
import { updateLead } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/challenge'

const STAGES: LeadStage[] = [
  'Research', 'Qualified', 'Contacted', 'Replied',
  'Discovery', 'Proposal', 'Won', 'Lost', 'Paid'
]

const STAGE_COLOR: Record<LeadStage, string> = {
  Research: 'bg-gray-500/15 text-gray-400',
  Qualified: 'bg-blue-500/15 text-blue-400',
  Contacted: 'bg-cyan-500/15 text-cyan-400',
  Replied: 'bg-violet-500/15 text-violet-400',
  Discovery: 'bg-purple-500/15 text-purple-400',
  Proposal: 'bg-amber-500/15 text-amber-400',
  Won: 'bg-green-500/15 text-green-400',
  Lost: 'bg-red-500/15 text-red-400',
  Paid: 'bg-emerald-500/15 text-emerald-400',
}

export function CRMClient({ leads }: { leads: Lead[] }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = leads.filter(l => {
    if (filterStage !== 'all' && l.stage !== filterStage) return false
    if (search && !l.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s)
    return acc
  }, {} as Record<LeadStage, Lead[]>)

  const totalPipeline = leads
    .filter(l => !['Research', 'Won', 'Lost', 'Paid'].includes(l.stage))
    .reduce((s, l) => s + (l.est_deal_size_usd ?? 0), 0)

  async function moveStage(leadId: string, stage: LeadStage) {
    await updateLead(leadId, { stage, updated_at: new Date().toISOString() })
    router.refresh()
  }

  const today = new Date().toISOString().split('T')[0]
  const overdueFollowups = leads.filter(l => l.next_followup && l.next_followup <= today).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales CRM</h1>
          {overdueFollowups > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400">{overdueFollowups} overdue follow-up{overdueFollowups !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total leads', value: leads.length },
          { label: 'Contacted', value: leads.filter(l => !['Research', 'Qualified'].includes(l.stage)).length },
          { label: 'Proposals', value: leads.filter(l => l.stage === 'Proposal').length },
          { label: 'Won', value: leads.filter(l => l.stage === 'Won').length },
          { label: 'Pipeline value', value: totalPipeline > 0 ? formatCurrency(totalPipeline) : '—' },
        ].map(m => (
          <Card key={m.label} className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className="text-xl font-bold text-foreground">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex gap-3 items-center flex-wrap">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48 h-8 text-sm bg-secondary border-border"
        />
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant={view === 'kanban' ? 'secondary' : 'ghost'} className="h-8 text-xs" onClick={() => setView('kanban')}>Kanban</Button>
          <Button size="sm" variant={view === 'table' ? 'secondary' : 'ghost'} className="h-8 text-xs" onClick={() => setView('table')}>Table</Button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {STAGES.filter(s => !['Lost', 'Paid'].includes(s) || byStage[s].length > 0).map(stage => (
              <div key={stage} className="w-56 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLOR[stage]}`}>{stage}</span>
                  <span className="text-xs text-muted-foreground">{byStage[stage].length}</span>
                </div>
                <div className="space-y-2">
                  {byStage[stage].map(lead => (
                    <KanbanCard key={lead.id} lead={lead} onMove={moveStage} />
                  ))}
                  {byStage[stage].length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left pb-2 pr-4">Company</th>
                <th className="text-left pb-2 pr-4">Stage</th>
                <th className="text-left pb-2 pr-4">Service</th>
                <th className="text-left pb-2 pr-4">Deal size</th>
                <th className="text-left pb-2 pr-4">Follow-up</th>
                <th className="text-left pb-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium">{lead.company}</div>
                    {lead.contact_name && <div className="text-xs text-muted-foreground">{lead.contact_name}</div>}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge className={`text-[10px] font-normal border-0 ${STAGE_COLOR[lead.stage]}`}>{lead.stage}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{lead.potential_service ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {lead.est_deal_size_usd ? formatCurrency(lead.est_deal_size_usd) : '—'}
                  </td>
                  <td className={`py-2.5 pr-4 text-xs ${lead.next_followup && lead.next_followup <= new Date().toISOString().split('T')[0] ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {lead.next_followup ?? '—'}
                  </td>
                  <td className="py-2.5 text-muted-foreground text-xs">{lead.source ?? '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No leads yet. Start by adding your first prospect.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function KanbanCard({ lead, onMove }: { lead: Lead; onMove: (id: string, stage: LeadStage) => void }) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = lead.next_followup && lead.next_followup <= today

  return (
    <Card className={`bg-card border-border hover:border-primary/30 transition-colors cursor-pointer ${isOverdue ? 'border-amber-500/30' : ''}`}>
      <CardContent className="p-3 space-y-1.5">
        <div className="text-sm font-medium leading-tight">{lead.company}</div>
        {lead.contact_name && <div className="text-xs text-muted-foreground">{lead.contact_name}</div>}
        {lead.potential_service && (
          <div className="text-xs text-muted-foreground">{lead.potential_service}</div>
        )}
        <div className="flex items-center justify-between pt-1">
          {lead.est_deal_size_usd && (
            <span className="text-xs font-medium text-amber-400">{formatCurrency(lead.est_deal_size_usd)}</span>
          )}
          {isOverdue && (
            <span className="text-[10px] text-amber-400 ml-auto">Follow up!</span>
          )}
        </div>
        {lead.score && (
          <div className="text-[10px] text-muted-foreground">Score: {lead.score}/10</div>
        )}
      </CardContent>
    </Card>
  )
}
