'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface ProposalAttachmentItem {
  id: string
  file_name: string
  mime_type: string
  byte_size: number
  include_in_prompt: boolean
  extracted_text: string
}

interface ProposalAttachmentsPanelProps {
  proposalId: string
  onAttachmentIdsChange: (attachmentIds: string[]) => void
}

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Handles attachment upload and inclusion toggles for generation context.
 */
export function ProposalAttachmentsPanel({
  proposalId,
  onAttachmentIdsChange,
}: ProposalAttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<ProposalAttachmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const refreshAttachments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}/attachments`)
      if (!response.ok) {
        throw new Error('Failed to load attachments')
      }

      const payload = (await response.json()) as ProposalAttachmentItem[]
      setAttachments(payload)
      onAttachmentIdsChange(
        payload
          .filter((attachment) => attachment.include_in_prompt)
          .map((attachment) => attachment.id),
      )
    } catch {
      onAttachmentIdsChange([])
      toast.error('Failed to load attachments')
    } finally {
      setIsLoading(false)
    }
  }, [onAttachmentIdsChange, proposalId])

  useEffect(() => {
    refreshAttachments()
  }, [refreshAttachments])

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('includeInPrompt', 'true')

      const response = await fetch(`/api/proposals/${proposalId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error ?? 'Upload failed')
      }

      toast.success('Attachment uploaded')
      await refreshAttachments()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error(message)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleToggleInclude = async (attachment: ProposalAttachmentItem) => {
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/attachments/${attachment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            include_in_prompt: !attachment.include_in_prompt,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to update attachment')
      }

      await refreshAttachments()
    } catch {
      toast.error('Failed to update attachment')
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      await refreshAttachments()
    } catch {
      toast.error('Failed to delete attachment')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>
          Upload supporting files and choose which ones are included in prompt context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleUploadFile}
            disabled={isUploading}
            accept=".txt,.md,.csv,.json,.pdf"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No attachments yet.
          </p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.mime_type} • {formatBytes(attachment.byte_size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={attachment.include_in_prompt ? 'default' : 'outline'}
                    onClick={() => handleToggleInclude(attachment)}
                  >
                    {attachment.include_in_prompt ? 'Included' : 'Excluded'}
                  </Button>
                  {attachment.extracted_text && (
                    <Badge variant="secondary">Text extracted</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
