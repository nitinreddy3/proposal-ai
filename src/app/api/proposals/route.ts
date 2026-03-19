import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const body = await request.json()

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
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
