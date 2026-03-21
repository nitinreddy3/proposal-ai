import { z } from 'zod'

export const templateStyleSchema = z.enum([
  'formal',
  'persuasive',
  'technical',
])

export const proposalTemplateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  name: z.string().trim().min(1),
  description: z.string(),
  style_profile: templateStyleSchema,
  section_layout: z.array(z.string()),
  prompt_directives: z.string(),
  is_system: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ProposalTemplate = z.infer<typeof proposalTemplateSchema>
