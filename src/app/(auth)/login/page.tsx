import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButtons } from '@/components/auth/login-buttons'
import { FileText } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-10 w-10" />
            <span className="text-3xl font-bold tracking-tight">ProposalAI</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Write winning proposals in minutes, not hours.
          </h1>
          <p className="text-lg opacity-90">
            Harness the power of AI to generate professional, persuasive project
            proposals tailored to your clients and projects.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 mb-6 lg:hidden justify-center">
              <FileText className="h-8 w-8" />
              <span className="text-2xl font-bold tracking-tight">ProposalAI</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>
          <LoginButtons />
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
