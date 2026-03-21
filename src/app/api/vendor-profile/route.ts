import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vendorProfileInputSchema } from '@/types/vendor-profile'

/** GET /api/vendor-profile — return current user vendor profile. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? null)
}

/** PUT /api/vendor-profile — upsert current user vendor profile. */
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = vendorProfileInputSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('vendor_profiles')
    .upsert(
      {
        user_id: user.id,
        company_name: parsed.data.companyName,
        capability_statement: parsed.data.capabilityStatement,
        naics_codes: parsed.data.naicsCodes,
        capabilities: parsed.data.capabilities,
        certifications: parsed.data.certifications,
        keywords: parsed.data.keywords,
        past_performance_summary: parsed.data.pastPerformanceSummary,
      },
      {
        onConflict: 'user_id',
      },
    )
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
