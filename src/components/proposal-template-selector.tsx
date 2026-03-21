'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProposalTemplate } from '@/types/proposal-template'

interface ProposalTemplateSelectorProps {
  proposalId: string
  templates: ProposalTemplate[]
  selectedTemplateId: string | null
  onTemplateChanged: (templateId: string) => void
}

/**
 * Allows users to switch proposal templates and persist the choice.
 */
export function ProposalTemplateSelector({
  proposalId,
  templates,
  selectedTemplateId,
  onTemplateChanged,
}: ProposalTemplateSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleTemplateChange = async (templateId: string | null) => {
    if (!templateId) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update template')
      }

      onTemplateChanged(templateId)
      toast.success('Template updated')
    } catch {
      toast.error('Failed to update template')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select
      value={selectedTemplateId ?? ''}
      onValueChange={handleTemplateChange}
      disabled={isUpdating || templates.length === 0}
    >
      <SelectTrigger className="w-[220px]">
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
  )
}
