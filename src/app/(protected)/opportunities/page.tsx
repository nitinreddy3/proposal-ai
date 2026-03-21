import { createClient } from '@/lib/supabase/server'
import { OpportunitiesDashboard } from '@/components/opportunities-dashboard'

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [{ data: opportunities }, { data: profile }, { data: templates }] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('proposal_templates')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order('is_system', { ascending: false })
      .order('name', { ascending: true }),
  ])

  const opportunityIds = (opportunities ?? []).map((item) => item.id)
  const { data: matches } = opportunityIds.length
    ? await supabase
      .from('opportunity_matches')
      .select('*')
      .eq('user_id', user.id)
      .in('opportunity_id', opportunityIds)
    : { data: [] }

  const matchesByOpportunityId = new Map<string, Record<string, unknown>>(
    (matches ?? []).map((match) => [match.opportunity_id, match]),
  )

  const enriched = (opportunities ?? []).map((opportunity) => ({
    ...opportunity,
    match: matchesByOpportunityId.get(opportunity.id) ?? null,
  }))

  return (
    <OpportunitiesDashboard
      initialOpportunities={enriched}
      initialProfile={profile}
      templates={templates ?? []}
    />
  )
}
