# $5K in 90 Days — Business Growth OS

Personal business management system for earning $5,000 from creative projects between Nov 6, 2026 and Feb 3, 2027.

## Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth)
- **Deploy:** Vercel
- **AI:** External Claude agents via scheduled Claude Code tasks (no API billing)

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Run `supabase/seed.sql` to load initial data
4. Copy your project URL and anon key

### 2. Environment variables
```bash
cp .env.local.example .env.local
# Fill in:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# AGENT_TOKEN (generate with: openssl rand -hex 32)
```

### 3. Run locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
```bash
# Connect your GitHub repo to Vercel
# Add all env vars from .env.local to Vercel project settings
# Deploy
```

### 5. Agent token
```bash
openssl rand -hex 32
# Add as AGENT_TOKEN in .env.local and Vercel env vars
# Add to kit/agents/.env.agent
# Test: curl -H "Authorization: Bearer TOKEN" https://your-app.vercel.app/api/agent/snapshot
```

### 6. Morning agent (Claude Code Desktop)
1. Claude Code Desktop → Scheduled → New task
2. Folder: `Desktop/5k`
3. Name: `morning-agent`
4. Instructions: paste `kit/agents/morning-agent.md` content
5. Schedule: Daily 08:30, "Only on this computer"
6. Run now → allow permissions (curl, WebSearch, WebFetch)

### 7. Weekly review agent
Same setup, name: `weekly-review-agent`, Schedule: Weekly, Sunday 20:00

### 8. Claude Project "5K Coach"
- claude.ai → New Project → Instructions: paste `kit/agents/coach_persona.md`
- Use "Copy context for Claude" button in AI Inbox to paste context before asking questions

## Agent API endpoints
All require `Authorization: Bearer $AGENT_TOKEN`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agent/snapshot` | Full tracker snapshot for agents |
| POST | `/api/agent/plan` | Submit daily plan (idempotent per date) |
| POST | `/api/agent/proposals` | Submit task/lead/strategy proposals |
| POST | `/api/agent/opportunities` | Submit research opportunities (deduped) |
| POST | `/api/agent/answers` | Answer a question from the queue |
| POST | `/api/agent/run-log` | Log agent run status |

## Security
- Agent token: env var only, never committed
- Agent can only write to proposal tables — cannot modify tasks/leads/payments
- All AI changes require user approval in AI Inbox
- Enable RLS: uncomment policies in `supabase/schema.sql` after first login

## Pages
- `/today` — Daily dashboard (Day X/90, revenue, top 3 priorities)
- `/roadmap` — 13-week roadmap with milestones
- `/tasks` — Task management by area
- `/revenue` — Revenue tracker + weekly targets
- `/crm` — Sales CRM (Kanban + table)
- `/opportunities` — Research inbox (agent proposals)
- `/ai-inbox` — Agent proposals, daily plans, question queue
- `/reviews` — Weekly reviews
- `/settings` — Config, agent setup, data export
