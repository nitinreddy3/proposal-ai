import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { ProposalInput } from '@/types/proposal'

const input: ProposalInput = {
  title: 'Legacy App Modernization',
  clientName: 'Department of Energy',
  problemStatement: 'Legacy systems are slow and costly to maintain.',
  proposedSolution: 'Migrate workloads to secure cloud services.',
  budget: '$2.1M',
  timeline: '12 months',
  tone: 'technical',
  opportunityId: 'f79fc027-7f7e-447f-a830-9d08f14931a9',
  templateId: '95f8d732-7f65-4a85-a118-d650f7e08931',
  attachmentIds: ['41f8af1d-4f77-4513-98c8-2928a8f63ff9'],
}

describe('prompt builders', () => {
  it('injects template sections and directives into system prompt', () => {
    const systemPrompt = buildSystemPrompt('technical', {
      template: {
        templateName: 'Government Compliant',
        promptDirectives: 'Prioritize FAR compliance.',
        sections: ['Executive Summary', 'Compliance Matrix'],
      },
    })

    expect(systemPrompt).toContain('Template: Government Compliant.')
    expect(systemPrompt).toContain('1. Executive Summary')
    expect(systemPrompt).toContain('2. Compliance Matrix')
    expect(systemPrompt).toContain('Prioritize FAR compliance.')
  })

  it('includes opportunity, vendor, and attachment context in user prompt', () => {
    const userPrompt = buildUserPrompt(input, {
      opportunity: {
        title: 'Cloud Modernization BPA',
        agencyName: 'GSA',
      },
      vendorProfile: {
        companyName: 'Acme Federal',
        capabilities: ['Cloud Migration'],
      },
      attachments: [
        {
          fileName: 'capability-statement.txt',
          extractedText: 'FedRAMP authorized cloud delivery experience.',
        },
      ],
    })

    expect(userPrompt).toContain('Opportunity Context')
    expect(userPrompt).toContain('Vendor Profile Context')
    expect(userPrompt).toContain('Attachment: capability-statement.txt')
  })
})
