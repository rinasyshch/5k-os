'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  DollarSign,
  Users,
  Search,
  Inbox,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/today',     label: 'Today',          icon: LayoutDashboard },
  { href: '/roadmap',   label: 'Roadmap',         icon: Map },
  { href: '/tasks',     label: 'Tasks',           icon: CheckSquare },
  { href: '/revenue',   label: 'Revenue',         icon: DollarSign },
  { href: '/crm',       label: 'Sales CRM',       icon: Users },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/ai-inbox',  label: 'AI Inbox',        icon: Inbox },
  { href: '/reviews',   label: 'Weekly Reviews',  icon: BarChart3 },
  { href: '/settings',  label: 'Settings',        icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">$5K / 90 Days</div>
            <div className="text-[10px] text-muted-foreground">Business Growth OS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/today' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Quick capture hint */}
      <div className="px-3 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-secondary text-xs font-mono">⌘K</kbd> to quick capture
        </p>
      </div>
    </aside>
  )
}
