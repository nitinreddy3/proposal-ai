'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { ProposalEditor } from '@/components/proposal-editor'
import { ProposalTemplateSelector } from '@/components/proposal-template-selector'
import { ProposalAttachmentsPanel } from '@/components/proposal-attachments-panel'
import type { Proposal } from '@/types/proposal'
import type { ProposalTemplate } from '@/types/proposal-template'

const PdfExportButton = dynamic(
  () => import('@/components/pdf-export-button').then((m) => m.PdfExportButton),
  { ssr: false },
)

interface ProposalEditorWrapperProps {
  proposalId: string
  initialContent: string
  shouldGenerate: boolean
  tone: string
  proposal: Proposal
  templates: ProposalTemplate[]
  selectedTemplateIdFromQuery?: string
}

/** Client wrapper that composes the editor with export controls. */
export function ProposalEditorWrapper({
  proposalId,
  initialContent,
  shouldGenerate,
  tone,
  proposal,
  templates,
  selectedTemplateIdFromQuery,
}: ProposalEditorWrapperProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    selectedTemplateIdFromQuery ?? proposal.template_id ?? templates[0]?.id ?? null,
  )
  const [attachmentIds, setAttachmentIds] = useState<string[]>([])
  const [hasLoadedAttachments, setHasLoadedAttachments] = useState(false)

  const resolvedProposalInput = useMemo(() => ({
    title: proposal.title,
    clientName: proposal.client_name ?? '',
    problemStatement: proposal.problem_statement ?? '',
    proposedSolution: proposal.proposed_solution ?? '',
    budget: proposal.budget ?? undefined,
    timeline: proposal.timeline ?? undefined,
    opportunityId: proposal.opportunity_id ?? undefined,
    templateId: selectedTemplateId ?? undefined,
    attachmentIds,
  }), [proposal, selectedTemplateId, attachmentIds])

  const proposalInput = shouldGenerate
    ? resolvedProposalInput
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProposalTemplateSelector
          proposalId={proposalId}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onTemplateChanged={setSelectedTemplateId}
        />
        <PdfExportButton proposalId={proposalId} title={proposal.title} />
      </div>
      <ProposalAttachmentsPanel
        proposalId={proposalId}
        onAttachmentIdsChange={(ids) => {
          setAttachmentIds(ids)
          setHasLoadedAttachments(true)
        }}
      />
      <ProposalEditor
        proposalId={proposalId}
        initialContent={initialContent}
        shouldGenerate={shouldGenerate && hasLoadedAttachments}
        tone={tone}
        proposalInput={proposalInput}
      />
    </div>
  )
}
