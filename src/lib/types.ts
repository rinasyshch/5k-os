// Core TypeScript types matching the database schema

export type TaskArea =
  | 'Branding & Design'
  | 'Client Acquisition'
  | 'Freelance Platforms'
  | 'UGC'
  | 'Digital Products'
  | 'Start-up/Product'
  | 'Consulting'
  | 'Operations'

export type TaskPriority = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'skipped'
export type LeadStage = 'Research' | 'Qualified' | 'Contacted' | 'Replied' | 'Discovery' | 'Proposal' | 'Won' | 'Lost' | 'Paid'
export type PaymentStatus = 'expected' | 'contracted' | 'invoiced' | 'received' | 'refunded'
export type Confidence = 'High' | 'Medium' | 'Low'
export type ProposalType = 'plan' | 'task' | 'lead' | 'opportunity' | 'note' | 'strategy' | 'answer'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'edited'

export interface Task {
  id: string
  title: string
  description?: string
  area: TaskArea
  priority: TaskPriority
  status: TaskStatus
  skip_reason?: string
  due_date?: string
  estimated_minutes?: number
  actual_minutes?: number
  week_number?: number
  objective?: string
  done_criteria?: string
  parent_id?: string
  milestone_id?: string
  is_recurring: boolean
  recurrence_rule?: string
  linked_objective?: string
  notes?: string
  link?: string
  source: 'user' | 'agent'
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Milestone {
  id: string
  title: string
  description?: string
  week_number: number
  area?: string
  status: 'pending' | 'done'
  created_at: string
}

export interface RoadmapWeek {
  id: string
  week_number: number
  start_date: string
  end_date: string
  objective: string
  outreach_target: number
  revenue_target_cumulative_usd: number
  notes?: string
  reviewed_at?: string
}

export interface Lead {
  id: string
  company: string
  website?: string
  contact_name?: string
  contact_route?: string
  country?: string
  source?: string
  channel?: string
  category?: string
  buying_signal?: string
  evidence_url?: string
  evidence_quote?: string
  verified_at?: string
  potential_service?: string
  est_deal_size_usd?: number
  score?: number
  stage: LeadStage
  outreach_date?: string
  last_interaction?: string
  next_followup?: string
  notes?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  company: string
  source_url: string
  evidence_quote: string
  verified_at: string
  why_needs_design: string
  potential_service?: string
  next_step?: string
  confidence: Confidence
  contact_route?: string
  status: 'pending' | 'approved' | 'rejected' | 'snoozed'
  reject_reason?: string
  source: 'user' | 'agent'
  snooze_until?: string
  created_at: string
}

export interface Payment {
  id: string
  lead_id?: string
  client_name: string
  service: string
  offer_id?: string
  status: PaymentStatus
  amount_original: number
  currency_original: string
  fx_rate?: number
  rate_date?: string
  amount_usd: number
  received_date?: string
  method?: string
  invoice_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  description: string
  amount_usd: number
  category?: string
  date: string
  created_at: string
}

export interface AiProposal {
  id: string
  type: ProposalType
  payload: Record<string, unknown>
  rationale?: string
  dedupe_key?: string
  status: ProposalStatus
  reviewed_at?: string
  source: string
  created_at: string
}

export interface AiPlan {
  id: string
  plan_date: string
  priorities?: Array<{
    title: string
    why: string
    est_minutes: number
    area: TaskArea
    linked_task_id?: string
  }>
  followups?: string[]
  insight?: string
  rationale?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface QuickCapture {
  id: string
  content: string
  url?: string
  category?: string
  status: 'inbox' | 'triaged' | 'archived'
  created_at: string
}

export interface WeeklyReview {
  id: string
  week_number: number
  date_range: string
  stats?: Record<string, unknown>
  my_notes?: string
  agent_analysis?: string
  next_week_priorities?: unknown[]
  strategy_review?: Record<string, unknown>
  status: 'draft' | 'complete'
  created_at: string
  updated_at: string
}

// Challenge state computed on client
export interface ChallengeState {
  startDate: Date
  endDate: Date
  today: Date
  dayNumber: number
  daysLeft: number
  totalDays: number
  targetUsd: number
  receivedUsd: number
  remaining: number
  progressPct: number
  lastSafeSigningDate: Date
  weekNumber: number
}
