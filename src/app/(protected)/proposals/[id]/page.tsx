import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProposalEditorWrapper } from './proposal-editor-wrapper'

interface ProposalPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ generate?: string; tone?: string }>
}

export default async function ProposalPage({ params, searchParams }: ProposalPageProps) {
  const { id } = await params
  const { generate, tone } = await searchParams

  const supabase = await createClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !proposal) notFound()

  const initialContent = proposal.generated_content
    ? (typeof proposal.generated_content === 'string'
        ? JSON.parse(proposal.generated_content)
        : proposal.generated_content)
    : ''

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{proposal.title}</h1>
        {proposal.client_name && (
          <p className="text-muted-foreground">Client: {proposal.client_name}</p>
        )}
      </div>
      <ProposalEditorWrapper
        proposalId={id}
        initialContent={initialContent}
        shouldGenerate={generate === 'true'}
        tone={tone ?? 'formal'}
        proposal={proposal}
      />
    </div>
  )
}
