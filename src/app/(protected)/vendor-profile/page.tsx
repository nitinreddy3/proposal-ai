import { createClient } from '@/lib/supabase/server'
import { VendorProfileForm } from '@/components/vendor-profile-form'

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0d2b4f]">
          Vendor Profile
        </h1>
        <p className="text-slate-500">
          Keep your capabilities current to improve opportunity ranking and proposal quality.
        </p>
      </div>
      <VendorProfileForm
        initialProfile={profile}
        onSaved={() => {}}
      />
    </div>
  )
}
