import { ShieldCheck, Database, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0d2b4f]">
          Admin
        </h1>
        <p className="text-slate-500">
          Configure and monitor your proposal intelligence workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Review authentication providers, role assignments, and audit visibility.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Data Health
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Track ingestion freshness, attachment processing, and proposal generation trends.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-violet-600" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Manage API keys, templates, and system-level defaults for team workflows.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
