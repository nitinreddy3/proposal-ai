'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  LayoutDashboard,
  Search,
  PlusSquare,
  BriefcaseBusiness,
  Shield,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  email: string
  fullName?: string | null
}

const TOP_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/proposals/new', label: 'New Proposal', icon: PlusSquare },
  { href: '/dashboard#recent-proposals', label: 'My Proposals', icon: BriefcaseBusiness },
  { href: '/vendor-profile', label: 'Vendor Profile', icon: FileText },
  { href: '/admin', label: 'Admin', icon: Shield },
] as const

/** Top navigation bar matching the product-style dashboard shell. */
export function AppHeader({ email, fullName }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1d3f67] bg-[#0d2b4f] text-white">
      <div className="flex h-[54px] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">GovProposal</p>
              <p className="text-xs font-semibold text-emerald-400">AI</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {TOP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const hrefWithoutHash = href.split('#')[0]
              const isActive = pathname === hrefWithoutHash
              return (
                <Link
                  key={href + label}
                  href={href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                    isActive
                      ? 'bg-[#27466f] text-white'
                      : 'text-slate-200 hover:bg-[#27466f]/80 hover:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="hidden rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 md:inline-flex">
            Paid
          </span>
          <span className="hidden max-w-44 truncate text-slate-200 lg:inline-block">
            {fullName ?? email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-100 hover:bg-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
