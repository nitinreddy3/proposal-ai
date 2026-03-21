import { z } from 'zod'

const stringListField = z.array(z.string().trim().min(1)).default([])

export const vendorProfileInputSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  capabilityStatement: z.string().trim().default(''),
  naicsCodes: stringListField,
  capabilities: stringListField,
  certifications: stringListField,
  keywords: stringListField,
  pastPerformanceSummary: z.string().trim().default(''),
})

export const vendorProfileSchema = vendorProfileInputSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type VendorProfileInput = z.infer<typeof vendorProfileInputSchema>

export interface VendorProfile {
  id: string
  user_id: string
  company_name: string
  capability_statement: string
  naics_codes: string[]
  capabilities: string[]
  certifications: string[]
  keywords: string[]
  past_performance_summary: string
  created_at: string
  updated_at: string
}
