import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateProposalSchema = z.object({
  title: z.string().optional(),
  client_name: z.string().nullable().optional(),
  problem_statement: z.string().nullable().optional(),
  proposed_solution: z.string().nullable().optional(),
  budget: z.string().nullable().optional(),
  timeline: z.string().nullable().optional(),
  generated_content: z.string().nullable().optional(),
  status: z.enum(['draft', 'generating', 'completed']).optional(),
  opportunity_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid().nullable().optional(),
  generation_context: z.record(z.string(), z.unknown()).nullable().optional(),
})

/** GET /api/proposals/:id — returns a single proposal. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

/** PUT /api/proposals/:id — updates a proposal. */
export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = updateProposalSchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('proposals')
    .update(parsedBody.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/** DELETE /api/proposals/:id — deletes a proposal. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
