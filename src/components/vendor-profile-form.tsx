'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { VendorProfile } from '@/types/vendor-profile'

interface VendorProfileFormProps {
  initialProfile: VendorProfile | null
  onSaved: (profile: VendorProfile) => void
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Collects and saves the vendor profile used for opportunity matching.
 */
export function VendorProfileForm({
  initialProfile,
  onSaved,
}: VendorProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [companyName, setCompanyName] = useState(initialProfile?.company_name ?? '')
  const [capabilityStatement, setCapabilityStatement] = useState(
    initialProfile?.capability_statement ?? '',
  )
  const [naicsCodesInput, setNaicsCodesInput] = useState(
    (initialProfile?.naics_codes ?? []).join(', '),
  )
  const [capabilitiesInput, setCapabilitiesInput] = useState(
    (initialProfile?.capabilities ?? []).join(', '),
  )
  const [certificationsInput, setCertificationsInput] = useState(
    (initialProfile?.certifications ?? []).join(', '),
  )
  const [keywordsInput, setKeywordsInput] = useState(
    (initialProfile?.keywords ?? []).join(', '),
  )
  const [pastPerformanceSummary, setPastPerformanceSummary] = useState(
    initialProfile?.past_performance_summary ?? '',
  )

  const isMissingCompanyName = useMemo(
    () => companyName.trim().length === 0,
    [companyName],
  )

  const handleSaveProfile = async () => {
    if (isMissingCompanyName) {
      toast.error('Company name is required.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/vendor-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          capabilityStatement,
          naicsCodes: parseCommaSeparated(naicsCodesInput),
          capabilities: parseCommaSeparated(capabilitiesInput),
          certifications: parseCommaSeparated(certificationsInput),
          keywords: parseCommaSeparated(keywordsInput),
          pastPerformanceSummary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save vendor profile')
      }

      const profile = (await response.json()) as VendorProfile
      onSaved(profile)
      toast.success('Vendor profile saved')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save vendor profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Profile</CardTitle>
        <CardDescription>
          This profile powers opportunity matching and proposal personalization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme Federal Solutions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capabilityStatement">Capability Statement</Label>
          <Textarea
            id="capabilityStatement"
            rows={4}
            value={capabilityStatement}
            onChange={(event) => setCapabilityStatement(event.target.value)}
            placeholder="Briefly describe your core differentiators."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="naicsCodes">NAICS Codes</Label>
            <Input
              id="naicsCodes"
              value={naicsCodesInput}
              onChange={(event) => setNaicsCodesInput(event.target.value)}
              placeholder="541511, 541519"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capabilities">Capabilities</Label>
            <Input
              id="capabilities"
              value={capabilitiesInput}
              onChange={(event) => setCapabilitiesInput(event.target.value)}
              placeholder="Cybersecurity, Cloud Migration"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Input
              id="certifications"
              value={certificationsInput}
              onChange={(event) => setCertificationsInput(event.target.value)}
              placeholder="8(a), SDVOSB, CMMI Level 3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={keywordsInput}
              onChange={(event) => setKeywordsInput(event.target.value)}
              placeholder="DevSecOps, Zero Trust, FedRAMP"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pastPerformanceSummary">Past Performance Summary</Label>
          <Textarea
            id="pastPerformanceSummary"
            rows={4}
            value={pastPerformanceSummary}
            onChange={(event) => setPastPerformanceSummary(event.target.value)}
            placeholder="Summarize contract outcomes and delivery evidence."
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={isSaving || isMissingCompanyName}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  )
}
