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

    const openai = getOpenAIClient()
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt(input.tone) },
        { role: 'user', content: buildUserPrompt(input) },
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
