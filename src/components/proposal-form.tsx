'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { TONE_OPTIONS } from '@/types/proposal'
import type { ProposalTone } from '@/types/proposal'
import type { ProposalTemplate } from '@/types/proposal-template'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  clientName: z.string().min(1, 'Client name is required'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  budget: z.string(),
  timeline: z.string(),
  tone: z.enum(['formal', 'persuasive', 'technical']),
  templateId: z.string().uuid().optional(),
})

type FormData = z.infer<typeof formSchema>

/** Contextual input form for gathering proposal details before AI generation. */
export function ProposalForm() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      clientName: '',
      problemStatement: '',
      proposedSolution: '',
      budget: '',
      timeline: '',
      tone: 'formal',
      templateId: undefined,
    },
  })

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/proposal-templates')
        if (!response.ok) return
        const payload = (await response.json()) as ProposalTemplate[]
        setTemplates(payload)
      } catch {
        setTemplates([])
      }
    }

    loadTemplates()
  }, [])

  const handleFormSubmit = async (data: FormData) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          client_name: data.clientName,
          problem_statement: data.problemStatement,
          proposed_solution: data.proposedSolution,
          budget: data.budget,
          timeline: data.timeline,
          status: 'generating',
          template_id: data.templateId ?? null,
        }),
      })

      if (!res.ok) throw new Error('Failed to create proposal')

      const proposal = await res.json()
      const params = new URLSearchParams({
        generate: 'true',
        tone: data.tone,
      })

      if (data.templateId) {
        params.set('templateId', data.templateId)
      }

      router.push(`/proposals/${proposal.id}?${params.toString()}`)
    } catch {
      toast.error('Failed to create proposal. Please try again.')
      setIsGenerating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          New Proposal
        </CardTitle>
        <CardDescription>
          Fill in your project details and let AI generate a professional proposal for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Website Redesign"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                placeholder="e.g., Acme Corporation"
                {...register('clientName')}
              />
              {errors.clientName && (
                <p className="text-sm text-destructive">{errors.clientName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problemStatement">
              Problem Statement <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="problemStatement"
              placeholder="Describe the challenge or problem this project addresses..."
              rows={4}
              {...register('problemStatement')}
            />
            {errors.problemStatement && (
              <p className="text-sm text-destructive">{errors.problemStatement.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposedSolution">
              Proposed Solution <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="proposedSolution"
              placeholder="Describe your recommended approach to solve the problem..."
              rows={4}
              {...register('proposedSolution')}
            />
            {errors.proposedSolution && (
              <p className="text-sm text-destructive">{errors.proposedSolution.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="templateId">Template</Label>
              <Select
                onValueChange={(val) =>
                  setValue('templateId', (val ?? undefined) as string | undefined)
                }
              >
                <SelectTrigger id="templateId">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select
                defaultValue="formal"
                onValueChange={(val) =>
                  setValue('tone', (val ?? 'formal') as ProposalTone)
                }
              >
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                placeholder="e.g., $50,000"
                {...register('budget')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                placeholder="e.g., 3 months"
                {...register('timeline')}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating &amp; Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Proposal
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
