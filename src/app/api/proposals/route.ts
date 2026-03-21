import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createProposalSchema = z.object({
  title: z.string().min(1),
  client_name: z.string().optional().nullable(),
  problem_statement: z.string().optional().nullable(),
  proposed_solution: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  status: z.enum(['draft', 'generating', 'completed']).optional(),
  opportunity_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  generation_context: z.record(z.string(), z.unknown()).optional().nullable(),
})

/** GET /api/proposals — returns all proposals for the authenticated user. */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let query = supabase
    .from('proposals')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,client_name.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/** POST /api/proposals — creates a new proposal. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = createProposalSchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  const body = parsedBody.data

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      user_id: user.id,
      title: body.title,
      client_name: body.client_name,
      problem_statement: body.problem_statement,
      proposed_solution: body.proposed_solution,
      budget: body.budget,
      timeline: body.timeline,
      status: body.status ?? 'draft',
      opportunity_id: body.opportunity_id ?? null,
      template_id: body.template_id ?? null,
      generation_context: body.generation_context ?? {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
