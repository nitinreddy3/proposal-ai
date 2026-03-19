'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Loader2,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProposalEditorProps {
  proposalId: string
  initialContent?: string
  shouldGenerate?: boolean
  tone?: string
  proposalInput?: {
    title: string
    clientName: string
    problemStatement: string
    proposedSolution: string
    budget?: string
    timeline?: string
  }
}

/** Rich-text TipTap editor with streaming AI content injection and auto-save. */
export function ProposalEditor({
  proposalId,
  initialContent,
  shouldGenerate,
  tone = 'formal',
  proposalInput,
}: ProposalEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasGeneratedRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Your proposal content will appear here...',
      }),
    ],
    content: initialContent ?? '',
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[500px] p-6 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(ed.getHTML())
      }, 2000)
    },
  })

  const handleSave = useCallback(
    async (content: string) => {
      setIsSaving(true)
      try {
        const res = await fetch(`/api/proposals/${proposalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generated_content: JSON.stringify(content),
            status: 'completed',
          }),
        })
        if (res.ok) setLastSaved(new Date())
      } catch {
        toast.error('Failed to save proposal.')
      } finally {
        setIsSaving(false)
      }
    },
    [proposalId],
  )

  const handleManualSave = () => {
    if (!editor) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    handleSave(editor.getHTML())
  }

  useEffect(() => {
    if (!shouldGenerate || !editor || !proposalInput || hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const generateContent = async () => {
      setIsGenerating(true)
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId,
            input: {
              ...proposalInput,
              tone,
            },
          }),
        })

        if (!res.ok || !res.body) {
          throw new Error('Generation failed')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedHtml = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.slice(6).trim()
              if (payload === '[DONE]') continue
              try {
                const parsed = JSON.parse(payload)
                if (parsed.error) {
                  toast.error(`Generation error: ${parsed.error}`)
                  continue
                }
                if (parsed.text) {
                  accumulatedHtml += parsed.text
                  editor.commands.setContent(accumulatedHtml)
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }
        }

        toast.success('Proposal generated successfully!')
      } catch {
        toast.error('Failed to generate proposal. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    generateContent()
  }, [shouldGenerate, editor, proposalInput, proposalId, tone])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Bold"
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            isActive={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Heading"
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet List"
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered List"
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Align Left"
            isActive={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Align Center"
            isActive={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Align Right"
            isActive={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Undo"
            isActive={false}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            isActive={false}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  children,
  label,
  isActive,
  onClick,
}: {
  children: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-muted text-foreground font-medium',
      )}
    >
      {children}
    </button>
  )
}
