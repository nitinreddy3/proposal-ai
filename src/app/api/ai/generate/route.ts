import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'
import { proposalInputSchema } from '@/types/proposal'

const generateRequestSchema = z.object({
  proposalId: z.string().uuid(),
  input: proposalInputSchema,
})

/** POST /api/ai/generate — streams an AI-generated proposal back to the client. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = generateRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { proposalId, input } = parsed.data

    const [{ data: proposal }, { data: profile }] = await Promise.all([
      supabase
        .from('proposals')
        .select('id, opportunity_id, template_id')
        .eq('id', proposalId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const attachmentIds = input.attachmentIds ?? []
    const [{ data: opportunity }, { data: template }, { data: attachments }] =
      await Promise.all([
        proposal.opportunity_id
          ? supabase
            .from('opportunities')
            .select('*')
            .eq('id', proposal.opportunity_id)
            .eq('user_id', user.id)
            .maybeSingle()
          : Promise.resolve({ data: null }),
        proposal.template_id || input.templateId
          ? supabase
            .from('proposal_templates')
            .select('*')
            .eq('id', proposal.template_id ?? input.templateId)
            .or(`is_system.eq.true,user_id.eq.${user.id}`)
            .maybeSingle()
          : Promise.resolve({ data: null }),
        attachmentIds.length
          ? supabase
            .from('proposal_attachments')
            .select('id, file_name, extracted_text')
            .eq('proposal_id', proposalId)
            .eq('user_id', user.id)
            .eq('include_in_prompt', true)
            .in('id', attachmentIds)
          : supabase
            .from('proposal_attachments')
            .select('id, file_name, extracted_text')
            .eq('proposal_id', proposalId)
            .eq('user_id', user.id)
            .eq('include_in_prompt', true),
      ])

    const promptContext = {
      template: template
        ? {
            templateName: template.name,
            promptDirectives: template.prompt_directives ?? '',
            sections: Array.isArray(template.section_layout)
              ? (template.section_layout as unknown[]).filter(
                (section): section is string => typeof section === 'string',
              )
              : [],
          }
        : undefined,
      opportunity: opportunity
        ? {
            title: opportunity.title,
            agencyName: opportunity.agency_name,
            dueDate: opportunity.due_date,
            setAside: opportunity.set_aside,
            naicsCode: opportunity.naics_code,
            description: opportunity.description,
            opportunityUrl: opportunity.opportunity_url,
          }
        : undefined,
      vendorProfile: profile
        ? {
            companyName: profile.company_name,
            capabilities: profile.capabilities ?? [],
            certifications: profile.certifications ?? [],
            naicsCodes: profile.naics_codes ?? [],
            pastPerformanceSummary: profile.past_performance_summary ?? '',
          }
        : undefined,
      attachments: (attachments ?? []).map((attachment) => ({
        fileName: attachment.file_name,
        extractedText: (attachment.extracted_text ?? '').slice(0, 5000),
      })),
    }

    const openai = getOpenAIClient()
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt(input.tone, promptContext) },
        { role: 'user', content: buildUserPrompt(input, promptContext) },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })

    const encoder = new TextEncoder()
    let fullContent = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullContent += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          await supabase
            .from('proposals')
            .update({
              generated_content: JSON.stringify(fullContent),
              status: 'completed',
              generation_context: {
                templateId: template?.id ?? input.templateId ?? null,
                opportunityId: opportunity?.id ?? null,
                attachmentCount: (attachments ?? []).length,
                generatedAt: new Date().toISOString(),
              },
            })
            .eq('id', proposalId)
            .eq('user_id', user.id)

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
