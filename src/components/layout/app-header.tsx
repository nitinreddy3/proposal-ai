import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/auth/user-menu'

/** Top navigation header for authenticated pages. */
export async function AppHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">ProposalAI</span>
        </Link>
        {user && (
          <UserMenu
            email={user.email ?? ''}
            avatarUrl={user.user_metadata?.avatar_url}
            fullName={user.user_metadata?.full_name}
          />
        )}
      </div>
    </header>
  )
}
