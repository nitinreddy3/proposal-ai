import { z } from 'zod'

export const proposalToneSchema = z.enum(['formal', 'persuasive', 'technical'])

export const proposalInputSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  clientName: z.string().min(1, 'Client name is required'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  budget: z.string().optional().default(''),
  timeline: z.string().optional().default(''),
  tone: proposalToneSchema.default('formal'),
  opportunityId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).default([]),
})

export type ProposalInput = z.infer<typeof proposalInputSchema>
export type ProposalTone = z.infer<typeof proposalToneSchema>

export const TONE_OPTIONS: readonly { readonly value: ProposalTone; readonly label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'technical', label: 'Technical' },
] as const

export interface Proposal {
  id: string
  user_id: string
  title: string
  client_name: string | null
  problem_statement: string | null
  proposed_solution: string | null
  budget: string | null
  timeline: string | null
  generated_content: string | null
  opportunity_id: string | null
  template_id: string | null
  generation_context: Record<string, unknown> | null
  status: 'draft' | 'generating' | 'completed'
  created_at: string
  updated_at: string
}
