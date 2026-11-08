-- $5K in 90 Days — Business Growth OS
-- Database schema
-- All timestamps in UTC; application displays in Asia/Seoul (UTC+9)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- SETTINGS & CHALLENGE CONFIG
-- ============================================================
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Seed challenge config
insert into settings (key, value) values
  ('challenge', '{
    "start_date": "2026-11-06",
    "end_date": "2027-02-03",
    "target_usd": 5000,
    "weekly_hours": 20,
    "deposit_policy": "50% deposit before work starts",
    "last_safe_signing_date": "2027-01-12",
    "time_split": {
      "design_sales": 60,
      "freelance_platforms": 15,
      "ugc": 10,
      "product": 10,
      "admin": 5
    }
  }'::jsonb),
  ('offers', '[
    {"id": "identity", "name": "Brand Identity Starter", "price_min": 700, "price_max": 1200, "currency": "USD", "is_hypothesis": true, "delivery_days": 14},
    {"id": "sprint", "name": "Creative Design Sprint", "price_min": 350, "price_max": 350, "currency": "USD", "is_hypothesis": true, "delivery_days": 7},
    {"id": "ugc", "name": "UGC / Short-form Creative", "price_min": 50, "price_max": 150, "currency": "USD", "is_hypothesis": true, "delivery_days": 3}
  ]'::jsonb),
  ('assumptions', '[
    {"id": "ugc_korea", "text": "Korean brands rarely pay for UGC", "status": "unvalidated"},
    {"id": "upwork_eligible", "text": "Eligible to work on Upwork from South Korea", "status": "unvalidated"},
    {"id": "conversion_reply", "text": "Cold outreach → reply rate: 5–15%", "status": "unvalidated"},
    {"id": "conversion_proposal", "text": "Discovery call → proposal: 60%", "status": "unvalidated"},
    {"id": "conversion_close", "text": "Proposal → won: 20–30%", "status": "unvalidated"}
  ]'::jsonb),
  ('decision_rules', '[
    {"day": 14, "condition": "≥60 targeted outreach, 0 replies", "action": "Change segment or message"},
    {"day": 30, "condition": "No proposal sent", "action": "Change offer or channel"},
    {"day": 45, "condition": "< $1,000 received", "action": "Trigger strategy review of platforms and pricing"},
    {"day": 60, "condition": "< $2,500 received", "action": "Shift all effort to highest-converting channel only"}
  ]'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  area text not null default 'Operations',
  -- area: Branding & Design | Client Acquisition | Freelance Platforms | UGC | Digital Products | Start-up/Product | Consulting | Operations
  priority text not null default 'Medium', -- High | Medium | Low
  status text not null default 'pending',  -- pending | in_progress | done | skipped
  skip_reason text,
  due_date date,
  estimated_minutes int,
  actual_minutes int,
  week_number int, -- 1-13
  objective text,
  done_criteria text,
  parent_id uuid references tasks(id),
  milestone_id uuid,
  is_recurring boolean default false,
  recurrence_rule text,
  linked_objective text,
  notes text,
  link text,
  source text default 'user', -- user | agent
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_due_date_idx on tasks(due_date);
create index if not exists tasks_area_idx on tasks(area);
create index if not exists tasks_week_idx on tasks(week_number);

-- ============================================================
-- MILESTONES
-- ============================================================
create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  week_number int not null,
  area text,
  status text default 'pending', -- pending | done
  created_at timestamptz default now()
);

-- ============================================================
-- ROADMAP WEEKS
-- ============================================================
create table if not exists roadmap_weeks (
  id uuid primary key default uuid_generate_v4(),
  week_number int unique not null,
  start_date date not null,
  end_date date not null,
  objective text not null,
  outreach_target int default 0,
  revenue_target_cumulative_usd numeric(10,2) default 0,
  notes text,
  reviewed_at timestamptz
);

-- ============================================================
-- QUICK CAPTURE / INBOX
-- ============================================================
create table if not exists quick_capture (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  url text,
  category text, -- task | idea | lead | link | question | obstacle | note
  status text default 'inbox', -- inbox | triaged | archived
  created_at timestamptz default now()
);

-- ============================================================
-- CRM — LEADS & CLIENTS
-- ============================================================
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  company text not null,
  website text,
  contact_name text,
  contact_route text, -- public contact route (email from public site, LinkedIn public URL, etc.)
  country text,
  source text, -- Kickstarter | Upwork | Contra | Referral | Manual | etc.
  channel text,
  category text, -- venture studio | early-stage founder | agency | etc.
  buying_signal text,
  evidence_url text,
  evidence_quote text, -- ≤25 words copied from page
  verified_at timestamptz,
  potential_service text,
  est_deal_size_usd numeric(10,2),
  score int check (score >= 1 and score <= 10),
  stage text not null default 'Research',
  -- Research | Qualified | Contacted | Replied | Discovery | Proposal | Won | Lost | Paid
  outreach_date date,
  last_interaction date,
  next_followup date,
  notes text,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_stage_idx on leads(stage);
create index if not exists leads_next_followup_idx on leads(next_followup);

-- ============================================================
-- OPPORTUNITIES (research inbox)
-- ============================================================
create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  company text not null,
  source_url text not null, -- required, no exceptions
  evidence_quote text not null, -- ≤25 words from the page
  verified_at timestamptz not null,
  why_needs_design text not null,
  potential_service text,
  next_step text,
  confidence text not null default 'Medium', -- High | Medium | Low
  contact_route text,
  status text not null default 'pending', -- pending | approved | rejected | snoozed
  reject_reason text,
  source text default 'user', -- user | agent
  snooze_until date,
  created_at timestamptz default now()
);

create index if not exists opps_status_idx on opportunities(status);

-- ============================================================
-- PAYMENTS & REVENUE
-- ============================================================
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  client_name text not null,
  service text not null,
  offer_id text, -- references settings offers
  status text not null default 'expected',
  -- expected | contracted | invoiced | received | refunded
  amount_original numeric(10,2) not null,
  currency_original text not null default 'USD',
  fx_rate numeric(12,6),
  rate_date date,
  amount_usd numeric(10,2) not null,
  received_date date,
  method text, -- Wise | PayPal | Stripe | Bank Transfer | etc.
  invoice_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists payments_status_idx on payments(status);
create index if not exists payments_received_date_idx on payments(received_date);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  amount_usd numeric(10,2) not null,
  category text, -- Tools | Software | Marketing | Professional Services | etc.
  date date not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TIME LOG
-- ============================================================
create table if not exists time_log (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  area text not null,
  minutes int not null,
  task_id uuid references tasks(id),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- WEEKLY REVIEWS
-- ============================================================
create table if not exists weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  week_number int not null unique,
  date_range text not null,
  stats jsonb, -- computed stats snapshot
  my_notes text,
  agent_analysis text, -- written by agent, stored as proposal
  next_week_priorities jsonb, -- array of proposed tasks
  strategy_review jsonb, -- for biweekly reviews
  status text default 'draft', -- draft | complete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- AI INBOX — AGENT PROPOSALS
-- ============================================================
create table if not exists ai_proposals (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- plan | task | lead | opportunity | note | strategy | answer
  payload jsonb not null,
  rationale text,
  dedupe_key text,
  status text not null default 'pending', -- pending | approved | rejected | edited
  reviewed_at timestamptz,
  source text default 'agent',
  created_at timestamptz default now()
);

create index if not exists proposals_status_idx on ai_proposals(status);
create index if not exists proposals_type_idx on ai_proposals(type);

-- ============================================================
-- AI DAILY PLANS (cached)
-- ============================================================
create table if not exists ai_plans (
  id uuid primary key default uuid_generate_v4(),
  plan_date date not null unique,
  priorities jsonb, -- [{title, why, est_minutes, area, linked_task_id}]
  followups jsonb,
  insight text,
  rationale text,
  status text default 'pending', -- pending | approved | rejected
  created_at timestamptz default now()
);

-- ============================================================
-- AI QUESTION QUEUE
-- ============================================================
create table if not exists ai_requests (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  context_snapshot text,
  answer_md text,
  status text default 'open', -- open | answered
  answered_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- AGENT RUN LOG
-- ============================================================
create table if not exists agent_run_log (
  id uuid primary key default uuid_generate_v4(),
  agent text not null, -- morning | weekly | manual
  status text not null, -- success | partial | failed
  searches_used int default 0,
  proposals_created int default 0,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- (Enable after connecting Supabase Auth — single user)
-- ============================================================
-- alter table settings enable row level security;
-- alter table tasks enable row level security;
-- alter table milestones enable row level security;
-- alter table roadmap_weeks enable row level security;
-- alter table quick_capture enable row level security;
-- alter table leads enable row level security;
-- alter table opportunities enable row level security;
-- alter table payments enable row level security;
-- alter table expenses enable row level security;
-- alter table time_log enable row level security;
-- alter table weekly_reviews enable row level security;
-- alter table ai_proposals enable row level security;
-- alter table ai_plans enable row level security;
-- alter table ai_requests enable row level security;
-- alter table agent_run_log enable row level security;

-- RLS policies (uncomment and replace USER_ID with actual auth.uid() after first login):
-- create policy "owner_all" on tasks for all using (true); -- single-user: allow all authenticated
