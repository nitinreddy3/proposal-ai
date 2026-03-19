import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .order('updated_at', { ascending: false })

  return <DashboardClient initialProposals={proposals ?? []} />
}
