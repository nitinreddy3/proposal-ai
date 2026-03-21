'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VendorProfileForm } from '@/components/vendor-profile-form'
import type { VendorProfile } from '@/types/vendor-profile'
import type { ProposalTemplate } from '@/types/proposal-template'

interface OpportunityMatch {
  match_score: number
  rationale: string
}

interface OpportunityItem {
  id: string
  title: string
  agency_name: string | null
  due_date: string | null
  posted_date: string | null
  set_aside: string | null
  naics_code: string | null
  description: string | null
  opportunity_url: string | null
  match: OpportunityMatch | null
}

interface OpportunitiesDashboardProps {
  initialOpportunities: OpportunityItem[]
  initialProfile: VendorProfile | null
  templates: ProposalTemplate[]
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Displays opportunity ingestion controls, profile management, and ranked results.
 */
export function OpportunitiesDashboard({
  initialOpportunities,
  initialProfile,
  templates,
}: OpportunitiesDashboardProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<VendorProfile | null>(initialProfile)
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(initialOpportunities)
  const [syncKeyword, setSyncKeyword] = useState('')
  const [syncAgency, setSyncAgency] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id ?? '',
  )
  const [selectedTone, setSelectedTone] = useState<'formal' | 'persuasive' | 'technical'>(
    'formal',
  )

  const sortedOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => {
      const scoreA = a.match?.match_score ?? 0
      const scoreB = b.match?.match_score ?? 0
      return scoreB - scoreA
    }),
    [opportunities],
  )

  const handleSyncOpportunities = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/opportunities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: syncKeyword,
          agency: syncAgency,
          limit: 20,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error ?? 'Failed to sync opportunities')
      }

      const refreshResponse = await fetch('/api/opportunities')
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh opportunities')
      }

      const refreshed = (await refreshResponse.json()) as OpportunityItem[]
      setOpportunities(refreshed)
      toast.success('Opportunities synced from SAM.gov')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      toast.error(message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreateProposalFromOpportunity = async (opportunity: OpportunityItem) => {
    try {
      const response = await fetch('/api/proposals/from-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          templateId: selectedTemplateId || undefined,
          tone: selectedTone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create proposal from opportunity')
      }

      const proposal = await response.json()
      const params = new URLSearchParams({
        generate: 'true',
        tone: selectedTone,
      })
      if (selectedTemplateId) {
        params.set('templateId', selectedTemplateId)
      }

      router.push(`/proposals/${proposal.id}?${params.toString()}`)
    } catch {
      toast.error('Unable to create proposal from opportunity')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <p className="text-muted-foreground">
          Sync SAM.gov opportunities, score fit against your profile, and generate proposals.
        </p>
      </div>

      <VendorProfileForm
        initialProfile={profile}
        onSaved={(savedProfile) => setProfile(savedProfile)}
      />

      <Card>
        <CardHeader>
          <CardTitle>SAM.gov Sync</CardTitle>
          <CardDescription>
            Pull the latest opportunities and refresh match scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="syncKeyword">Keyword</Label>
              <Input
                id="syncKeyword"
                value={syncKeyword}
                onChange={(event) => setSyncKeyword(event.target.value)}
                placeholder="cybersecurity, cloud, modernization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncAgency">Agency</Label>
              <Input
                id="syncAgency"
                value={syncAgency}
                onChange={(event) => setSyncAgency(event.target.value)}
                placeholder="Department of Veterans Affairs"
              />
            </div>
          </div>
          <Button onClick={handleSyncOpportunities} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Opportunities'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Generation Settings</CardTitle>
          <CardDescription>
            Choose defaults for opportunity-driven proposal generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="templateSelect">Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={(value) => setSelectedTemplateId(value ?? '')}
            >
              <SelectTrigger id="templateSelect">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="toneSelect">Tone</Label>
            <Select
              value={selectedTone}
              onValueChange={(value) =>
                setSelectedTone((value ?? 'formal') as 'formal' | 'persuasive' | 'technical')
              }
            >
              <SelectTrigger id="toneSelect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sortedOpportunities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No opportunities yet. Sync SAM.gov results to populate this list.
            </CardContent>
          </Card>
        ) : (
          sortedOpportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.agency_name ?? 'Unknown agency'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Match {(opportunity.match?.match_score ?? 0).toFixed(1)}
                    </Badge>
                    {opportunity.set_aside && (
                      <Badge variant="outline">{opportunity.set_aside}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {opportunity.description?.slice(0, 320) ?? 'No description available.'}
                </p>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>Due: {formatDate(opportunity.due_date)}</span>
                  <span>Posted: {formatDate(opportunity.posted_date)}</span>
                  <span>NAICS: {opportunity.naics_code ?? 'N/A'}</span>
                </div>
                {opportunity.match?.rationale && (
                  <p className="text-xs text-muted-foreground">
                    {opportunity.match.rationale}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handleCreateProposalFromOpportunity(opportunity)}
                    disabled={!profile}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Create Proposal
                  </Button>
                  {opportunity.opportunity_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(opportunity.opportunity_url!, '_blank')}
                    >
                      Open Notice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
