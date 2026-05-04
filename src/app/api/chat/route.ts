import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChatResponseStream } from '@/lib/ai/gemini'
import { searchKnowledge } from '@/lib/ai/rag'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('No autorizado', { status: 401 })
    }

    const body = await request.json()
    const { agent_id, conversation_id, message } = body

    if (!agent_id || !message) {
      return new Response('Faltan campos requeridos', { status: 400 })
    }

    // Get agent config
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single()

    if (!agent) {
      return new Response('Agente no encontrado', { status: 404 })
    }

    // Get or create conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv } = await serviceSupabase
        .from('conversations')
        .insert({
          agent_id,
          channel: 'testing',
          customer_identifier: user.email,
          status: 'active',
          is_test: true,
        })
        .select('id')
        .single()
      convId = newConv?.id
    }

    // Save user message
    await serviceSupabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    })

    // Get conversation history
    const { data: history } = await serviceSupabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)

    // RAG: Search for relevant context
    const context = await searchKnowledge(agent_id, message)

    // Generate streaming response
    const streamResponse = await generateChatResponseStream(
      agent.system_prompt,
      history || [{ role: 'user', content: message }],
      context
    )

    // Create readable stream
    let fullResponse = ''
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            const text = chunk.text || ''
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, conversation_id: convId })}\n\n`))
            }
          }

          // Save assistant response
          await serviceSupabase.from('messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
          })

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Error generando respuesta' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Error interno', { status: 500 })
  }
}
