'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusSquare,
  FolderOpen,
  Search,
  UserCircle2,
  Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/proposals/new', label: 'New Proposal', icon: PlusSquare },
  { href: '/dashboard#recent-proposals', label: 'My Proposals', icon: FolderOpen },
  { href: '/vendor-profile', label: 'Vendor Profile', icon: UserCircle2 },
  { href: '/admin', label: 'Admin', icon: Shield },
] as const

interface AppSidebarProps {
  email: string
  fullName?: string | null
}

/** Sidebar navigation for the authenticated layout. */
export function AppSidebar({ email, fullName }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[240px] flex-col border-r bg-white md:flex">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const hrefWithoutHash = href.split('#')[0]
          const isActive = pathname === hrefWithoutHash ||
            (hrefWithoutHash !== '/dashboard' && pathname.startsWith(hrefWithoutHash))

          return (
            <Link
              key={href + label}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-[#0d2b4f] text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t p-3">
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {fullName ?? 'System Administrator'}
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Paid
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{email}</p>
        </div>
      </div>
    </aside>
  )
}
