'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Proposal } from '@/types/proposal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  FileText,
  BriefcaseBusiness,
  CircleCheck,
  Clock3,
  ArrowUpRight,
  Copy,
  Trash2,
  Loader2,
  UserCircle2,
} from 'lucide-react'

interface DashboardClientProps {
  initialProposals: Proposal[]
}

/** Client-side dashboard with search, filter, and proposal management. */
export function DashboardClient({ initialProposals }: DashboardClientProps) {
  const router = useRouter()
  const [proposals, setProposals] = useState(initialProposals)
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const completedCount = proposals.filter((proposal) => proposal.status === 'completed').length
  const inProgressCount = proposals.filter((proposal) =>
    proposal.status === 'generating' || proposal.status === 'draft'
  ).length
  const recentProposals = [...proposals].slice(0, 5)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/proposals/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Delete failed')

      setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Proposal deleted')
    } catch {
      toast.error('Failed to delete proposal')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDuplicate = async (proposal: Proposal) => {
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${proposal.title} (Copy)`,
          client_name: proposal.client_name,
          problem_statement: proposal.problem_statement,
          proposed_solution: proposal.proposed_solution,
          budget: proposal.budget,
          timeline: proposal.timeline,
          status: 'draft',
        }),
      })

      if (!res.ok) throw new Error('Duplicate failed')

      const newProposal = await res.json()
      setProposals((prev) => [newProposal, ...prev])
      toast.success('Proposal duplicated')
    } catch {
      toast.error('Failed to duplicate proposal')
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0d2b4f] md:text-[42px]">
            Welcome Back, System
          </h1>
          <p className="text-base text-slate-500">
            Manage your government proposals and track opportunities
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatsCard
          title="Total Proposals"
          value={proposals.length}
          subtitle={`${completedCount} completed`}
          icon={<FileText className="h-4 w-4 text-blue-700" />}
          iconClassName="bg-blue-100"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount}
          subtitle={inProgressCount === 0 ? 'All clear' : 'Active drafting'}
          icon={<Clock3 className="h-4 w-4 text-orange-700" />}
          iconClassName="bg-orange-100"
        />
        <StatsCard
          title="Completed"
          value={completedCount}
          subtitle={completedCount > 0 ? 'Great progress' : 'Get started'}
          icon={<CircleCheck className="h-4 w-4 text-emerald-700" />}
          iconClassName="bg-emerald-100"
        />
      </div>

      <div>
        <h2 className="mb-3 text-2xl font-extrabold text-[#0d2b4f]">Quick Actions</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <QuickActionCard
            title="New Proposal"
            description="Generate an AI-powered proposal"
            href="/proposals/new"
            icon={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600"
            showPlus
          />
          <QuickActionCard
            title="Search Opportunities"
            description="Find government contract opportunities"
            href="/opportunities"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            className="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <QuickActionCard
            title="Manage Profile"
            description="Update your vendor information"
            href="/vendor-profile"
            icon={<UserCircle2 className="h-5 w-5" />}
            className="bg-gradient-to-br from-[#163765] to-[#0f2f57]"
          />
        </div>
      </div>

      <Card id="recent-proposals" className="overflow-hidden rounded-2xl border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#0d2b4f]">
            <FileText className="h-5 w-5" />
            Recent Proposals
          </CardTitle>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 bg-white p-4">
          {recentProposals.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium text-slate-700">No proposals yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first AI-powered proposal to get started.
              </p>
              <Button
                className="mt-4"
                render={<Link href="/proposals/new" />}
              >
                Create Proposal
              </Button>
            </div>
          ) : (
            recentProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {proposal.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {proposal.client_name ?? 'No client'} • Updated {formatDate(proposal.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      proposal.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : proposal.status === 'generating'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    }
                  >
                    {proposal.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/proposals/${proposal.id}`)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(proposal)}
                    title="Duplicate proposal"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(proposal)}
                    title="Delete proposal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
}: {
  title: string
  value: number
  subtitle: string
  icon: ReactNode
  iconClassName: string
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`rounded-lg p-2.5 ${iconClassName}`}>{icon}</span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-[40px] font-extrabold leading-none text-[#0d2b4f]">{value}</p>
        <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  className,
  icon,
  showPlus = false,
}: {
  title: string
  description: string
  href: string
  className: string
  icon: ReactNode
  showPlus?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group block min-h-[158px] rounded-2xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <div className="mb-6 inline-flex rounded-md bg-white/15 p-2">
        {icon}
      </div>
      {showPlus ? (
        <p className="text-[30px] font-light leading-none">+</p>
      ) : null}
      <p className={`${showPlus ? 'mt-2' : 'mt-0'} text-2xl font-extrabold leading-tight`}>
        {title}
      </p>
      <p className="mt-1 text-sm text-white/85">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
        Open
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
