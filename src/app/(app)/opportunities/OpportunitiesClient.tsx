'use client'

import { useState } from 'react'
import { Opportunity, QuickCapture } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CONF_COLOR = { High: 'bg-green-500/15 text-green-400', Medium: 'bg-amber-500/15 text-amber-400', Low: 'bg-gray-500/15 text-gray-400' }

export function OpportunitiesClient({ opportunities, inbox }: { opportunities: Opportunity[]; inbox: QuickCapture[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ company: '', source_url: '', evidence_quote: '', why_needs_design: '', potential_service: '', next_step: '', confidence: 'Medium' as 'High' | 'Medium' | 'Low', contact_route: '' })
  const [urlError, setUrlError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const pending = opportunities.filter(o => o.status === 'pending')
  const approved = opportunities.filter(o => o.status === 'approved')
  const rejected = opportunities.filter(o => o.status === 'rejected')

  async function handleApprove(id: string) {
    const opp = opportunities.find(o => o.id === id)
    if (!opp) return
    // Create CRM lead
    await supabase.from('leads').insert({
      company: opp.company, website: opp.source_url, buying_signal: opp.why_needs_design,
      evidence_url: opp.source_url, evidence_quote: opp.evidence_quote, verified_at: opp.verified_at,
      potential_service: opp.potential_service, contact_route: opp.contact_route,
      stage: 'Research', source: 'opportunity'
    })
    await supabase.from('opportunities').update({ status: 'approved' }).eq('id', id)
    router.refresh()
  }

  async function handleReject(id: string, reason: string) {
    await supabase.from('opportunities').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
    router.refresh()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.source_url) { setUrlError('Source URL is required — no exceptions'); return }
    setUrlError('')
    await supabase.from('opportunities').insert({
      ...form,
      verified_at: new Date().toISOString(),
      status: 'pending',
      source: 'user'
    })
    setAddOpen(false)
    setForm({ company: '', source_url: '', evidence_quote: '', why_needs_design: '', potential_service: '', next_step: '', confidence: 'Medium', contact_route: '' })
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Research inbox — approve promising prospects to move them into CRM</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger className="inline-flex items-center gap-1 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Opportunity
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Opportunity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-300 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Source URL and evidence quote are required. Never save without verifying the page exists and the quote is real.
              </div>
              <Field label="Company *" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} required />
              <div className="space-y-1">
                <Label className="text-xs">Source URL * <span className="text-muted-foreground">(the actual page you read)</span></Label>
                <Input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} placeholder="https://..." required className="bg-secondary border-border text-sm h-8" />
                {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Evidence quote * <span className="text-muted-foreground">(≤25 words copied from the page)</span></Label>
                <Textarea value={form.evidence_quote} onChange={e => setForm(f => ({ ...f, evidence_quote: e.target.value }))} placeholder="Exact quote from the page..." className="bg-secondary border-border text-sm min-h-16" required />
              </div>
              <Field label="Why they need design *" value={form.why_needs_design} onChange={v => setForm(f => ({ ...f, why_needs_design: v }))} required />
              <Field label="Potential service" value={form.potential_service} onChange={v => setForm(f => ({ ...f, potential_service: v }))} />
              <Field label="Recommended next step" value={form.next_step} onChange={v => setForm(f => ({ ...f, next_step: v }))} />
              <Field label="Public contact route" value={form.contact_route} onChange={v => setForm(f => ({ ...f, contact_route: v }))} placeholder="LinkedIn URL, email from their site..." />
              <div className="space-y-1">
                <Label className="text-xs">Confidence</Label>
                <Select value={form.confidence} onValueChange={v => setForm(f => ({ ...f, confidence: v as 'High'|'Medium'|'Low' }))}>
                  <SelectTrigger className="h-8 bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending review', value: pending.length, color: 'text-amber-400' },
          { label: 'Approved → CRM', value: approved.length, color: 'text-green-400' },
          { label: 'Rejected', value: rejected.length, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-3 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inbox items from quick capture */}
      {inbox.length > 0 && (
        <Card className="bg-card border-border border-dashed">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              Quick Capture — to review ({inbox.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inbox.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground flex-1 truncate">{item.content}</span>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs"><ExternalLink className="w-3 h-3" /></a>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending opportunities */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-amber-400">Pending Review ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(opp => <OppCard key={opp.id} opp={opp} onApprove={handleApprove} onReject={handleReject} />)}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="py-10 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending opportunities.</p>
            <p className="text-xs text-muted-foreground mt-1">The morning agent will add research here. You can also add manually.</p>
          </CardContent>
        </Card>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Approved → CRM ({approved.length})</h2>
          <div className="space-y-2">
            {approved.map(opp => (
              <div key={opp.id} className="flex items-center gap-3 text-sm text-muted-foreground px-1">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>{opp.company}</span>
                <Badge className={`text-[10px] font-normal border-0 ${CONF_COLOR[opp.confidence]}`}>{opp.confidence}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OppCard({ opp, onApprove, onReject }: { opp: Opportunity; onApprove: (id: string) => void; onReject: (id: string, reason: string) => void }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-sm">{opp.company}</div>
            <a href={opp.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> {opp.source_url.replace(/^https?:\/\//, '').slice(0, 50)}
            </a>
          </div>
          <Badge className={`text-[10px] font-normal border-0 shrink-0 ${CONF_COLOR[opp.confidence]}`}>{opp.confidence}</Badge>
        </div>
        <blockquote className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
          "{opp.evidence_quote}"
        </blockquote>
        <div className="text-xs space-y-1">
          <div><span className="text-muted-foreground">Why: </span>{opp.why_needs_design}</div>
          {opp.potential_service && <div><span className="text-muted-foreground">Service: </span>{opp.potential_service}</div>}
          {opp.next_step && <div><span className="text-muted-foreground">Next step: </span>{opp.next_step}</div>}
          {opp.contact_route && <div><span className="text-muted-foreground">Contact: </span>{opp.contact_route}</div>}
        </div>
        {rejecting ? (
          <div className="space-y-2">
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..." className="h-7 text-xs bg-secondary border-border" />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { onReject(opp.id, reason); setRejecting(false) }}>Confirm reject</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setRejecting(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onApprove(opp.id)}>
              <CheckCircle className="w-3 h-3" /> Approve → CRM
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setRejecting(true)}>
              <XCircle className="w-3 h-3" /> Reject
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" /> Snooze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} className="bg-secondary border-border text-sm h-8" />
    </div>
  )
}
