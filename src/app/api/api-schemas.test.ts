import { describe, expect, it } from 'vitest'
import { opportunitySyncRequestSchema } from '@/types/opportunity'
import { vendorProfileInputSchema } from '@/types/vendor-profile'
import { proposalInputSchema } from '@/types/proposal'

describe('api request schema validation', () => {
  it('validates opportunity sync payload', () => {
    const payload = opportunitySyncRequestSchema.parse({
      keyword: 'cloud',
      agency: 'Department of Energy',
      limit: 20,
    })

    expect(payload.keyword).toBe('cloud')
    expect(payload.limit).toBe(20)
  })

  it('validates vendor profile payload', () => {
    const payload = vendorProfileInputSchema.parse({
      companyName: 'Acme Federal',
      capabilityStatement: 'Zero trust and cloud migration',
      naicsCodes: ['541511'],
      capabilities: ['DevSecOps'],
      certifications: ['8(a)'],
      keywords: ['FedRAMP'],
      pastPerformanceSummary: 'Delivered at scale.',
    })

    expect(payload.companyName).toBe('Acme Federal')
    expect(payload.naicsCodes).toContain('541511')
  })

  it('validates proposal generation payload with attachments', () => {
    const payload = proposalInputSchema.parse({
      title: 'Cloud modernization',
      clientName: 'GSA',
      problemStatement: 'Legacy workloads need modernization.',
      proposedSolution: 'Deploy secure cloud architecture.',
      budget: '$500000',
      timeline: '6 months',
      tone: 'formal',
      opportunityId: '7d7df0af-5ab0-4f36-b4f1-cf32d67cf419',
      templateId: '1aeac64e-df06-47f2-a540-c3f5cc28b42d',
      attachmentIds: ['f4a12178-09de-49af-b3ec-4b05b0ce150f'],
    })

    expect(payload.attachmentIds).toHaveLength(1)
  })
})
