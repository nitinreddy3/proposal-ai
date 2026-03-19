'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/proposals/new', label: 'New Proposal', icon: Plus },
] as const

/** Sidebar navigation for the authenticated layout. */
export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-muted/30 p-4 gap-2">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Button
              key={href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'justify-start gap-2',
                isActive && 'font-medium',
              )}
              render={<Link href={href} />}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          )
        })}
      </nav>
      <div className="mt-auto pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-3">
          <FileText className="h-3.5 w-3.5" />
          <span>ProposalAI v1.0</span>
        </div>
      </div>
    </aside>
  )
}
