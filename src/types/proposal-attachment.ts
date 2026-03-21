import { z } from 'zod'

export const proposalAttachmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  proposal_id: z.string().uuid(),
  file_name: z.string(),
  mime_type: z.string(),
  byte_size: z.number(),
  storage_path: z.string(),
  extracted_text: z.string(),
  include_in_prompt: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const attachmentUpdateSchema = z.object({
  include_in_prompt: z.boolean(),
})

export type ProposalAttachment = z.infer<typeof proposalAttachmentSchema>
