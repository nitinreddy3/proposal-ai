import type { VendorProfile } from '@/types/vendor-profile'
import type { Opportunity } from '@/types/opportunity'

export interface OpportunityScoreBreakdown {
  readonly keywordScore: number
  readonly naicsScore: number
  readonly setAsideScore: number
  readonly urgencyScore: number
  readonly matchScore: number
  readonly rationale: string
}

const WEIGHTS = {
  keyword: 0.4,
  naics: 0.25,
  setAside: 0.2,
  urgency: 0.15,
} as const

function normalizeText(value: string): string {
  return value.toLowerCase().trim()
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 2),
  )
}

function calculateKeywordScore(profile: VendorProfile, opportunity: Opportunity): number {
  const profileTokens = new Set<string>()
  const profileSources = [
    profile.capability_statement,
    profile.past_performance_summary,
    ...profile.capabilities,
    ...profile.keywords,
  ]

  for (const source of profileSources) {
    for (const token of tokenize(source)) {
      profileTokens.add(token)
    }
  }

  if (profileTokens.size === 0) return 0

  const opportunityText = [
    opportunity.title,
    opportunity.description ?? '',
    opportunity.agency_name ?? '',
    opportunity.set_aside ?? '',
  ].join(' ')

  const opportunityTokens = tokenize(opportunityText)
  let overlapCount = 0

  for (const token of profileTokens) {
    if (opportunityTokens.has(token)) overlapCount += 1
  }

  return Math.min(100, (overlapCount / profileTokens.size) * 100)
}

function calculateNaicsScore(profile: VendorProfile, opportunity: Opportunity): number {
  const opportunityNaics = normalizeText(opportunity.naics_code ?? '')
  if (!opportunityNaics) return 0

  const hasExactMatch = profile.naics_codes
    .map((code: string) => normalizeText(code))
    .includes(opportunityNaics)

  if (hasExactMatch) return 100

  const hasPrefixMatch = profile.naics_codes.some((code: string) =>
    normalizeText(code).startsWith(opportunityNaics.slice(0, 4)),
  )

  return hasPrefixMatch ? 65 : 0
}

function calculateSetAsideScore(profile: VendorProfile, opportunity: Opportunity): number {
  const setAsideValue = normalizeText(opportunity.set_aside ?? '')
  if (!setAsideValue) return 30

  const profileSignals = [
    ...profile.certifications.map((item) => normalizeText(item)),
    ...profile.capabilities.map((item) => normalizeText(item)),
  ]

  return profileSignals.some((signal) => setAsideValue.includes(signal))
    ? 100
    : 10
}

function calculateUrgencyScore(opportunity: Opportunity): number {
  if (!opportunity.due_date) return 30

  const dueTime = new Date(opportunity.due_date).getTime()
  if (Number.isNaN(dueTime)) return 30

  const now = Date.now()
  const daysRemaining = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 0) return 0
  if (daysRemaining <= 7) return 100
  if (daysRemaining <= 14) return 85
  if (daysRemaining <= 30) return 70
  if (daysRemaining <= 60) return 55
  return 35
}

function summarizeRationale(scores: Omit<OpportunityScoreBreakdown, 'matchScore' | 'rationale'>): string {
  const highlights = [
    `Keyword overlap: ${scores.keywordScore.toFixed(0)}`,
    `NAICS alignment: ${scores.naicsScore.toFixed(0)}`,
    `Set-aside fit: ${scores.setAsideScore.toFixed(0)}`,
    `Due-date urgency: ${scores.urgencyScore.toFixed(0)}`,
  ]

  return highlights.join(' | ')
}

/**
 * Scores an opportunity against a vendor profile using deterministic rules.
 */
export function scoreOpportunityForProfile(
  profile: VendorProfile,
  opportunity: Opportunity,
): OpportunityScoreBreakdown {
  const keywordScore = calculateKeywordScore(profile, opportunity)
  const naicsScore = calculateNaicsScore(profile, opportunity)
  const setAsideScore = calculateSetAsideScore(profile, opportunity)
  const urgencyScore = calculateUrgencyScore(opportunity)

  const matchScore =
    keywordScore * WEIGHTS.keyword +
    naicsScore * WEIGHTS.naics +
    setAsideScore * WEIGHTS.setAside +
    urgencyScore * WEIGHTS.urgency

  return {
    keywordScore,
    naicsScore,
    setAsideScore,
    urgencyScore,
    matchScore: Number(matchScore.toFixed(2)),
    rationale: summarizeRationale({
      keywordScore,
      naicsScore,
      setAsideScore,
      urgencyScore,
    }),
  }
}
