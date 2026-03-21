import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchSamGovOpportunities } from '@/lib/opportunities/sam-gov'
import { scoreOpportunityForProfile } from '@/lib/opportunities/matching'
import { opportunitySyncRequestSchema } from '@/types/opportunity'
import type { VendorProfile } from '@/types/vendor-profile'

/** POST /api/opportunities/sync — import opportunities from SAM.gov. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = opportunitySyncRequestSchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  const { data: profileRow } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const records = await fetchSamGovOpportunities(parsedBody.data)
    if (!records.length) {
      return NextResponse.json({ inserted: 0, updated: 0, total: 0 })
    }

    const rows = records.map((record) => ({
      user_id: user.id,
      source: 'sam.gov',
      external_id: record.externalId,
      title: record.title,
      agency_name: record.agencyName,
      due_date: record.dueDate,
      posted_date: record.postedDate,
      set_aside: record.setAside,
      naics_code: record.naicsCode,
      description: record.description,
      opportunity_url: record.opportunityUrl,
      raw_payload: record.rawPayload,
      synced_at: new Date().toISOString(),
    }))

    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .upsert(rows, {
        onConflict: 'user_id,source,external_id',
      })
      .select('*')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (profileRow && opportunities?.length) {
      const typedProfile = profileRow as VendorProfile

      const matches = opportunities.map((opportunity) => {
        const score = scoreOpportunityForProfile(typedProfile, opportunity)
        return {
          user_id: user.id,
          opportunity_id: opportunity.id,
          profile_id: typedProfile.id,
          match_score: score.matchScore,
          keyword_score: score.keywordScore,
          naics_score: score.naicsScore,
          set_aside_score: score.setAsideScore,
          urgency_score: score.urgencyScore,
          rationale: score.rationale,
        }
      })

      matches.sort((a, b) => b.match_score - a.match_score)

      const rankedMatches = matches.map((match, index) => ({
        ...match,
        rank: index + 1,
      }))

      const { error: matchError } = await supabase
        .from('opportunity_matches')
        .upsert(rankedMatches, {
          onConflict: 'opportunity_id,profile_id',
        })

      if (matchError) {
        return NextResponse.json(
          { error: matchError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      inserted: opportunities?.length ?? 0,
      updated: opportunities?.length ?? 0,
      total: records.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync opportunities'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
