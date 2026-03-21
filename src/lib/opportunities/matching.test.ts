import { describe, expect, it } from 'vitest'
import { scoreOpportunityForProfile } from './matching'
import type { VendorProfile } from '@/types/vendor-profile'
import type { Opportunity } from '@/types/opportunity'

function createVendorProfile(overrides?: Partial<VendorProfile>): VendorProfile {
  return {
    id: '1e261685-8837-42f0-9472-ab43831bca03',
    user_id: '7de2132f-b581-44e7-bca1-76011e8fbe13',
    company_name: 'Acme Federal',
    capability_statement: 'Cloud modernization and cybersecurity services',
    naics_codes: ['541511', '541519'],
    capabilities: ['Cloud migration', 'Cybersecurity', 'DevSecOps'],
    certifications: ['8(a)', 'CMMI Level 3'],
    keywords: ['zero trust', 'federal modernization'],
    past_performance_summary: 'Delivered major federal modernization contracts.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function createOpportunity(overrides?: Partial<Opportunity>): Opportunity {
  return {
    id: '3b490d84-abfe-4be3-ae96-5282e4bc8f3f',
    user_id: '7de2132f-b581-44e7-bca1-76011e8fbe13',
    source: 'sam.gov',
    external_id: 'SAM-001',
    title: 'Cloud Security Modernization Support',
    agency_name: 'Department of Defense',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    posted_date: new Date().toISOString(),
    set_aside: '8(a)',
    naics_code: '541511',
    description: 'Need cloud migration and zero trust cybersecurity support',
    opportunity_url: 'https://sam.gov/opportunity',
    raw_payload: {},
    synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('scoreOpportunityForProfile', () => {
  it('returns higher score for aligned opportunity', () => {
    const profile = createVendorProfile()
    const opportunity = createOpportunity()

    const result = scoreOpportunityForProfile(profile, opportunity)

    expect(result.matchScore).toBeGreaterThan(70)
    expect(result.naicsScore).toBe(100)
    expect(result.setAsideScore).toBe(100)
    expect(result.rationale).toContain('Keyword overlap')
  })

  it('returns lower score for weak alignment', () => {
    const profile = createVendorProfile({
      capabilities: ['Help desk'],
      keywords: ['staffing'],
      certifications: [],
      naics_codes: ['561320'],
    })
    const opportunity = createOpportunity({
      title: 'Nuclear engineering modernization',
      naics_code: '541330',
      set_aside: 'HUBZone',
      description: 'Specialized engineering design support.',
    })

    const result = scoreOpportunityForProfile(profile, opportunity)

    expect(result.matchScore).toBeLessThan(55)
    expect(result.naicsScore).toBeLessThan(100)
  })
})
