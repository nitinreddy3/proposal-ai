import type { ProposalInput } from '@/types/proposal'

interface PromptTemplateContext {
  readonly templateName?: string
  readonly promptDirectives?: string
  readonly sections?: string[]
}

interface PromptOpportunityContext {
  readonly title?: string
  readonly agencyName?: string | null
  readonly dueDate?: string | null
  readonly setAside?: string | null
  readonly naicsCode?: string | null
  readonly description?: string | null
  readonly opportunityUrl?: string | null
}

interface PromptVendorContext {
  readonly companyName?: string
  readonly capabilities?: string[]
  readonly certifications?: string[]
  readonly naicsCodes?: string[]
  readonly pastPerformanceSummary?: string
}

interface PromptAttachmentContext {
  readonly fileName: string
  readonly extractedText: string
}

interface PromptContext {
  readonly template?: PromptTemplateContext
  readonly opportunity?: PromptOpportunityContext
  readonly vendorProfile?: PromptVendorContext
  readonly attachments?: PromptAttachmentContext[]
}

/** Builds the system prompt for proposal generation. */
export function buildSystemPrompt(tone: string, context?: PromptContext): string {
  const sections = context?.template?.sections?.length
    ? context.template.sections
    : [
        'Executive Summary',
        'Problem Statement',
        'Proposed Solution',
        'Project Scope & Deliverables',
        'Timeline & Milestones',
        'Budget Breakdown',
        'Value Proposition',
        'Terms & Conditions',
      ]

  const sectionList = sections
    .map((section, index) => `${index + 1}. ${section}`)
    .join('\n')

  const templateLine = context?.template?.templateName
    ? `Template: ${context.template.templateName}.`
    : 'Template: Standard.'

  const directiveLine = context?.template?.promptDirectives
    ? `Template directives: ${context.template.promptDirectives}`
    : ''

  return `You are an expert business consultant and proposal writer with decades of experience crafting winning proposals for Fortune 500 companies and government contracts.

Given the project details provided by the user, write a persuasive, professional project proposal with the following sections:

${sectionList}

Rules:
- Output well-structured HTML suitable for a rich-text editor.
- Use <h2> for section headings, <p> for paragraphs, <ul>/<li> for lists, and <strong> for emphasis.
- Be specific, actionable, and data-driven where possible.
- Tone: ${tone}.
- ${templateLine}
- ${directiveLine || 'Template directives: Keep language concise and procurement-friendly.'}
- Do NOT wrap the output in a code block or markdown — output raw HTML only.`
}

/** Builds the user message from the proposal input fields. */
export function buildUserPrompt(input: ProposalInput, context?: PromptContext): string {
  const parts = [
    `Project Title: ${input.title}`,
    `Client: ${input.clientName}`,
    `Problem Statement: ${input.problemStatement}`,
    `Proposed Solution: ${input.proposedSolution}`,
  ]

  if (input.budget) parts.push(`Budget: ${input.budget}`)
  if (input.timeline) parts.push(`Timeline: ${input.timeline}`)

  if (context?.opportunity) {
    parts.push(
      [
        'Opportunity Context:',
        `- Title: ${context.opportunity.title ?? 'N/A'}`,
        `- Agency: ${context.opportunity.agencyName ?? 'N/A'}`,
        `- Due Date: ${context.opportunity.dueDate ?? 'N/A'}`,
        `- Set Aside: ${context.opportunity.setAside ?? 'N/A'}`,
        `- NAICS: ${context.opportunity.naicsCode ?? 'N/A'}`,
        `- Description: ${context.opportunity.description ?? 'N/A'}`,
        `- Link: ${context.opportunity.opportunityUrl ?? 'N/A'}`,
      ].join('\n'),
    )
  }

  if (context?.vendorProfile) {
    parts.push(
      [
        'Vendor Profile Context:',
        `- Company: ${context.vendorProfile.companyName ?? 'N/A'}`,
        `- Capabilities: ${(context.vendorProfile.capabilities ?? []).join(', ') || 'N/A'}`,
        `- Certifications: ${(context.vendorProfile.certifications ?? []).join(', ') || 'N/A'}`,
        `- NAICS: ${(context.vendorProfile.naicsCodes ?? []).join(', ') || 'N/A'}`,
        `- Past Performance: ${context.vendorProfile.pastPerformanceSummary ?? 'N/A'}`,
      ].join('\n'),
    )
  }

  if (context?.attachments?.length) {
    const attachmentParts = context.attachments.map((attachment) => (
      `Attachment: ${attachment.fileName}\n${attachment.extractedText || '[No extracted text available]'}`
    ))
    parts.push(`Attachment Context:\n${attachmentParts.join('\n\n')}`)
  }

  return parts.join('\n\n')
}
