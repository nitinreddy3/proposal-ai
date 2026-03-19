'use client'

import dynamic from 'next/dynamic'
import { ProposalEditor } from '@/components/proposal-editor'
import type { Proposal } from '@/types/proposal'

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
}

/** Client wrapper that composes the editor with export controls. */
export function ProposalEditorWrapper({
  proposalId,
  initialContent,
  shouldGenerate,
  tone,
  proposal,
}: ProposalEditorWrapperProps) {
  const proposalInput = shouldGenerate
    ? {
        title: proposal.title,
        clientName: proposal.client_name ?? '',
        problemStatement: proposal.problem_statement ?? '',
        proposedSolution: proposal.proposed_solution ?? '',
        budget: proposal.budget ?? undefined,
        timeline: proposal.timeline ?? undefined,
      }
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <PdfExportButton proposalId={proposalId} title={proposal.title} />
      </div>
      <ProposalEditor
        proposalId={proposalId}
        initialContent={initialContent}
        shouldGenerate={shouldGenerate}
        tone={tone}
        proposalInput={proposalInput}
      />
    </div>
  )
}
