import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attachmentUpdateSchema } from '@/types/proposal-attachment'

interface RouteContext {
  params: Promise<{ id: string; attachmentId: string }>
}

/** PATCH /api/proposals/:id/attachments/:attachmentId — update attachment flags. */
export async function PATCH(request: Request, context: RouteContext) {
  const { id: proposalId, attachmentId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = attachmentUpdateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('proposal_attachments')
    .update(parsed.data)
    .eq('id', attachmentId)
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/** DELETE /api/proposals/:id/attachments/:attachmentId — remove attachment. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id: proposalId, attachmentId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: attachment, error: fetchError } = await supabase
    .from('proposal_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('proposal_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  await supabase.storage.from('proposal-attachments').remove([attachment.storage_path])
  return new NextResponse(null, { status: 204 })
}
