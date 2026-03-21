import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <AppHeader
        email={user.email ?? ''}
        fullName={user.user_metadata?.full_name}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          email={user.email ?? ''}
          fullName={user.user_metadata?.full_name}
        />
        <main className="flex-1 overflow-y-auto bg-[#f7fafc] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
