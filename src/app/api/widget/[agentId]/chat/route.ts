import { NextRequest } from 'next/server'
import { generateChatResponseStream } from '@/lib/ai/gemini'
import { searchKnowledge } from '@/lib/ai/rag'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * POST /api/widget/[agentId]/chat
 * Public chat endpoint for the embeddable widget — streams SSE responses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const body = await request.json()
    const { conversation_id, message, customer_identifier } = body

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensaje requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true)
      .single()

    if (!agent) {
      return new Response(
        JSON.stringify({ error: 'Agente no encontrado o inactivo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          channel: 'web_widget',
          customer_identifier: customer_identifier || 'anonymous',
          status: 'active',
          is_test: false,
        })
        .select('id')
        .single()
      convId = newConv?.id
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    })

    // Get conversation history (last 15 messages for context window)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(15)

    // RAG: search for relevant knowledge
    const context = await searchKnowledge(agentId, message)

    // Stream response
    const streamResponse = await generateChatResponseStream(
      agent.system_prompt,
      history || [{ role: 'user', content: message }],
      context
    )

    let fullResponse = ''
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            const text = chunk.text || ''
            if (text) {
              fullResponse += text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text, conversation_id: convId })}\n\n`)
              )
            }
          }

          // Save assistant response
          await supabase.from('messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('Widget stream error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Error generando respuesta' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Widget chat error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}
