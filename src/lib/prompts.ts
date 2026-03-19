import type { ProposalInput } from '@/types/proposal'

/** Builds the system prompt for proposal generation. */
export function buildSystemPrompt(tone: string): string {
  return `You are an expert business consultant and proposal writer with decades of experience crafting winning proposals for Fortune 500 companies and government contracts.

Given the project details provided by the user, write a persuasive, professional project proposal with the following sections:

1. Executive Summary
2. Problem Statement
3. Proposed Solution
4. Project Scope & Deliverables
5. Timeline & Milestones
6. Budget Breakdown
7. Value Proposition
8. Terms & Conditions

Rules:
- Output well-structured HTML suitable for a rich-text editor.
- Use <h2> for section headings, <p> for paragraphs, <ul>/<li> for lists, and <strong> for emphasis.
- Be specific, actionable, and data-driven where possible.
- Tone: ${tone}.
- Do NOT wrap the output in a code block or markdown — output raw HTML only.`
}

/** Builds the user message from the proposal input fields. */
export function buildUserPrompt(input: ProposalInput): string {
  const parts = [
    `Project Title: ${input.title}`,
    `Client: ${input.clientName}`,
    `Problem Statement: ${input.problemStatement}`,
    `Proposed Solution: ${input.proposedSolution}`,
  ]

  if (input.budget) parts.push(`Budget: ${input.budget}`)
  if (input.timeline) parts.push(`Timeline: ${input.timeline}`)

  return parts.join('\n\n')
}
