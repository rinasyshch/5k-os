'use client'

import { useState } from 'react'
import { Task, Milestone, TaskArea, TaskPriority, TaskStatus } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Circle, Clock, ChevronRight, Plus, Filter } from 'lucide-react'
import { updateTask } from '@/app/actions'
import { useRouter } from 'next/navigation'

const AREAS: TaskArea[] = [
  'Branding & Design', 'Client Acquisition', 'Freelance Platforms',
  'UGC', 'Digital Products', 'Start-up/Product', 'Consulting', 'Operations'
]

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  High: 'text-red-400 bg-red-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Low: 'text-gray-400 bg-gray-500/10',
}

const AREA_COLOR: Record<string, string> = {
  'Branding & Design': 'bg-violet-500/15 text-violet-300',
  'Client Acquisition': 'bg-blue-500/15 text-blue-300',
  'Freelance Platforms': 'bg-cyan-500/15 text-cyan-300',
  'UGC': 'bg-pink-500/15 text-pink-300',
  'Start-up/Product': 'bg-orange-500/15 text-orange-300',
  'Digital Products': 'bg-yellow-500/15 text-yellow-300',
  'Consulting': 'bg-teal-500/15 text-teal-300',
  'Operations': 'bg-gray-500/15 text-gray-300',
}

export function TasksClient({ tasks, milestones }: { tasks: Task[]; milestones: Milestone[] }) {
  const [filterArea, setFilterArea] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [view, setView] = useState<'list' | 'by-area'>('by-area')
  const router = useRouter()

  const filtered = tasks.filter(t => {
    if (filterArea !== 'all' && t.area !== filterArea) return false
    if (filterStatus === 'active') return t.status === 'pending' || t.status === 'in_progress'
    if (filterStatus === 'done') return t.status === 'done'
    return true
  })

  async function toggleTask(task: Task) {
    const newStatus: TaskStatus = task.status === 'done' ? 'pending' : 'done'
    await updateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    })
    router.refresh()
  }

  const byArea = AREAS.reduce((acc, area) => {
    const areaTasks = filtered.filter(t => t.area === area)
    if (areaTasks.length > 0) acc[area] = areaTasks
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
          <SelectTrigger className="w-32 h-8 text-xs bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="done">Completed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterArea} onValueChange={(v) => v && setFilterArea(v)}>
          <SelectTrigger className="w-48 h-8 text-xs bg-secondary border-border">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button
            size="sm" variant={view === 'by-area' ? 'secondary' : 'ghost'}
            className="h-8 text-xs" onClick={() => setView('by-area')}
          >By Area</Button>
          <Button
            size="sm" variant={view === 'list' ? 'secondary' : 'ghost'}
            className="h-8 text-xs" onClick={() => setView('list')}
          >List</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: 'text-foreground' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-400' },
          { label: 'Done', value: tasks.filter(t => t.status === 'done').length, color: 'text-green-400' },
          { label: 'High Priority', value: tasks.filter(t => t.priority === 'High' && t.status !== 'done').length, color: 'text-red-400' },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task list */}
      {view === 'by-area' ? (
        <div className="space-y-6">
          {Object.entries(byArea).map(([area, areaTasks]) => (
            <div key={area}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AREA_COLOR[area] || 'bg-gray-500/15 text-gray-300'}`}>
                  {area}
                </span>
                <span className="text-xs text-muted-foreground">{areaTasks.length} tasks</span>
              </div>
              <div className="space-y-1.5">
                {areaTasks.map(task => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTask} />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(byArea).length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No tasks matching filters
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} />)}
        </div>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const done = task.status === 'done'
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors group
      ${done ? 'border-border opacity-50' : 'border-border hover:border-primary/30 bg-card'}`}>
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 shrink-0 transition-colors ${done ? 'text-green-500' : 'text-muted-foreground hover:text-green-400'}`}
      >
        {done ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Circle className="w-4.5 h-4.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${PRIORITY_COLOR[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>
        {task.done_criteria && !done && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            ✓ {task.done_criteria}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {task.estimated_minutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_minutes >= 60
                ? `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 ? ` ${task.estimated_minutes % 60}m` : ''}`
                : `${task.estimated_minutes}m`}
            </span>
          )}
          {task.week_number && (
            <span className="text-xs text-muted-foreground">Wk {task.week_number}</span>
          )}
          {task.source === 'agent' && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0 font-normal">AI</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
