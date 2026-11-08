'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Shield, Bot, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SettingsClient({ settings }: { settings: Record<string, unknown> }) {
  const challenge = settings.challenge as Record<string, unknown> | undefined

  async function exportData() {
    const supabase = createClient()
    const tables = ['tasks', 'leads', 'payments', 'expenses', 'milestones', 'opportunities', 'quick_capture', 'ai_plans', 'ai_proposals', 'weekly_reviews']
    const result: Record<string, unknown[]> = {}

    for (const table of tables) {
      const { data } = await supabase.from(table).select('*')
      result[table] = data ?? []
    }

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `5k-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Challenge config */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Challenge Config
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Start date', value: challenge?.start_date as string },
              { label: 'End date', value: challenge?.end_date as string },
              { label: 'Target', value: `$${challenge?.target_usd?.toLocaleString()}` },
              { label: 'Weekly hours', value: `${challenge?.weekly_hours}h` },
              { label: 'Last safe signing', value: challenge?.last_safe_signing_date as string },
              { label: 'Deposit policy', value: challenge?.deposit_policy as string },
            ].map(item => (
              <div key={item.label}>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="font-medium">{item.value ?? '—'}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            To edit challenge config, update the <code className="bg-secondary px-1 rounded">settings</code> table in Supabase directly.
          </p>
        </CardContent>
      </Card>

      {/* Agent API */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            Agent API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Snapshot endpoint</div>
              <code className="text-xs font-mono bg-secondary px-2 py-1 rounded block mt-1">GET /api/agent/snapshot</code>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Auth header</div>
              <code className="text-xs font-mono bg-secondary px-2 py-1 rounded block mt-1">Authorization: Bearer $AGENT_TOKEN</code>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-1">Setup:</div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Generate token: <code className="bg-secondary px-1 rounded">openssl rand -hex 32</code></li>
              <li>Add <code className="bg-secondary px-1 rounded">AGENT_TOKEN=...</code> to <code className="bg-secondary px-1 rounded">.env.local</code> and Vercel env vars</li>
              <li>Add same token to <code className="bg-secondary px-1 rounded">kit/agents/.env.agent</code></li>
              <li>Test: <code className="bg-secondary px-1 rounded">curl -H "Authorization: Bearer TOKEN" /api/agent/snapshot</code></li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div>✓ Agent token stored in env vars only, never in code</div>
            <div>✓ Agent can only write to proposal tables — cannot modify tasks, leads, payments directly</div>
            <div>✓ All changes require your approval in AI Inbox</div>
            <div>✓ Enable RLS in Supabase: uncomment RLS policies in <code className="bg-secondary px-1 rounded">supabase/schema.sql</code> after first login</div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4 text-muted-foreground" />
            Data Export & Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Export all your data as JSON — tasks, leads, payments, expenses, reviews, and more.</p>
          <Button size="sm" variant="outline" onClick={exportData} className="gap-2">
            <Download className="w-4 h-4" /> Download full backup
          </Button>
        </CardContent>
      </Card>

      {/* Stack info */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2">
        <div>Stack: Next.js 14 · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel</div>
        <div>AI: External Claude agents via scheduled Claude Code tasks (no Anthropic API billing)</div>
        <div>Timezone: Asia/Seoul (UTC+9)</div>
      </div>
    </div>
  )
}
