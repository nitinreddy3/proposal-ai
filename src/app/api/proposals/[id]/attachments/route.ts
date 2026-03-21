import { Buffer } from 'node:buffer'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromFile } from '@/lib/attachments/extract-text'

interface RouteContext {
  params: Promise<{ id: string }>
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

/** GET /api/proposals/:id/attachments — list attachment metadata. */
export async function GET(_request: Request, context: RouteContext) {
  const { id: proposalId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('proposal_attachments')
    .select('*')
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

/** POST /api/proposals/:id/attachments — upload and register attachment. */
export async function POST(request: Request, context: RouteContext) {
  const { id: proposalId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const maybeFile = formData.get('file')
  const includeInPrompt = formData.get('includeInPrompt')

  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const file = maybeFile
  const maxSizeBytes = 10 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: 'File is too large. Maximum size is 10MB.' },
      { status: 400 },
    )
  }

  const fileBytes = Buffer.from(await file.arrayBuffer())
  const safeName = sanitizeFileName(file.name)
  const storagePath = `${user.id}/${proposalId}/${Date.now()}-${safeName}`
  const extractedText = await extractTextFromFile(file, fileBytes)

  const { error: storageError } = await supabase
    .storage
    .from('proposal-attachments')
    .upload(storagePath, fileBytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 500 },
    )
  }

  const { data, error } = await supabase
    .from('proposal_attachments')
    .insert({
      user_id: user.id,
      proposal_id: proposalId,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      byte_size: file.size,
      storage_path: storagePath,
      extracted_text: extractedText,
      include_in_prompt: includeInPrompt !== 'false',
    })
    .select('*')
    .single()

  if (error) {
    await supabase.storage.from('proposal-attachments').remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
