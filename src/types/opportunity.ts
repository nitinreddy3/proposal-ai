import { z } from 'zod'

export const opportunitySourceSchema = z.enum(['sam.gov'])

export const opportunitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  source: opportunitySourceSchema,
  external_id: z.string(),
  title: z.string(),
  agency_name: z.string().nullable(),
  due_date: z.string().nullable(),
  posted_date: z.string().nullable(),
  set_aside: z.string().nullable(),
  naics_code: z.string().nullable(),
  description: z.string().nullable(),
  opportunity_url: z.string().nullable(),
  raw_payload: z.record(z.string(), z.unknown()).default({}),
  synced_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const opportunitySyncRequestSchema = z.object({
  keyword: z.string().trim().default(''),
  agency: z.string().trim().default(''),
  postedFrom: z.string().trim().optional(),
  postedTo: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type Opportunity = z.infer<typeof opportunitySchema>
export type OpportunitySyncRequest = z.infer<typeof opportunitySyncRequestSchema>
