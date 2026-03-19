'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Proposal } from '@/types/proposal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Search,
  FileText,
  Pencil,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react'

interface DashboardClientProps {
  initialProposals: Proposal[]
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  generating: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

/** Client-side dashboard with search, filter, and proposal management. */
export function DashboardClient({ initialProposals }: DashboardClientProps) {
  const router = useRouter()
  const [proposals, setProposals] = useState(initialProposals)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your proposals</p>
        </div>
        <Button render={<Link href="/proposals/new" />} className="gap-2">
          <Plus className="h-4 w-4" />
          New Proposal
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? 'all')}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProposals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No proposals found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {proposals.length === 0
                ? 'Create your first AI-powered proposal to get started.'
                : 'No proposals match your search criteria.'}
            </p>
            {proposals.length === 0 && (
              <Button render={<Link href="/proposals/new" />} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Proposal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {proposal.title}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[proposal.status] ?? ''}
                  >
                    {proposal.status}
                  </Badge>
                </div>
                {proposal.client_name && (
                  <CardDescription className="line-clamp-1">
                    {proposal.client_name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Updated {formatDate(proposal.updated_at)}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => router.push(`/proposals/${proposal.id}`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleDuplicate(proposal)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(proposal)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
