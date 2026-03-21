import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  agency: z.string().trim().optional(),
  setAside: z.string().trim().optional(),
})

/** GET /api/opportunities — list synced opportunities for current user. */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  )

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }

  const { search, agency, setAside } = parsed.data

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (agency) {
    query = query.ilike('agency_name', `%${agency}%`)
  }

  if (setAside) {
    query = query.ilike('set_aside', `%${setAside}%`)
  }

  const [{ data: opportunities, error }, { data: matches, error: matchesError }] =
    await Promise.all([
      query,
      supabase
        .from('opportunity_matches')
        .select('*')
        .eq('user_id', user.id)
        .order('match_score', { ascending: false }),
    ])

  if (error || matchesError) {
    return NextResponse.json(
      { error: error?.message ?? matchesError?.message ?? 'Failed to list opportunities' },
      { status: 500 },
    )
  }

  const matchByOpportunityId = new Map<string, Record<string, unknown>>()
  for (const match of matches ?? []) {
    if (!matchByOpportunityId.has(match.opportunity_id)) {
      matchByOpportunityId.set(match.opportunity_id, match)
    }
  }

  const enriched = (opportunities ?? []).map((opportunity) => ({
    ...opportunity,
    match: matchByOpportunityId.get(opportunity.id) ?? null,
  }))

  return NextResponse.json(enriched)
}
