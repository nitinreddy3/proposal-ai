import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createFromOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  tone: z.enum(['formal', 'persuasive', 'technical']).default('formal'),
})

/** POST /api/proposals/from-opportunity — seed proposal from selected opportunity. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = createFromOpportunitySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const [{ data: opportunity }, { data: profile }] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*')
      .eq('id', parsed.data.opportunityId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  }

  const capabilitySummary = profile?.capability_statement
    ? `Vendor capability summary: ${profile.capability_statement}`
    : 'Vendor capability summary: Not provided yet.'

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      user_id: user.id,
      title: `${opportunity.title} Proposal`,
      client_name: opportunity.agency_name ?? 'US Government',
      problem_statement: opportunity.description ?? 'Scope details to be completed.',
      proposed_solution: capabilitySummary,
      budget: '',
      timeline: '',
      status: 'generating',
      opportunity_id: opportunity.id,
      template_id: parsed.data.templateId ?? null,
      generation_context: {
        tone: parsed.data.tone,
        createdFromOpportunity: true,
      },
    })
    .select('*')
    .single()

  if (error || !proposal) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create proposal' },
      { status: 500 },
    )
  }

  return NextResponse.json(proposal, { status: 201 })
}
