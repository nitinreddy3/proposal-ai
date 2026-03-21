import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/proposal-templates — list available templates. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
