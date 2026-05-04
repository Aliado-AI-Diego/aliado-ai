import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    // We only care about end-of-call-report
    if (message?.type === 'end-of-call-report') {
      const call = message.call
      if (!call) return new NextResponse('Missing call details', { status: 400 })

      const assistantId = call.assistantId
      const recordingUrl = message.recordingUrl
      const transcript = message.transcript
      const customerNumber = call.customer?.number || 'Unknown Caller'

      // Find the agent associated with this Vapi assistant
      const { data: channelData } = await supabaseAdmin
        .from('agent_channels')
        .select('agent_id')
        .eq('channel_type', 'voice')
        .filter('channel_config->>vapi_assistant_id', 'eq', assistantId)
        .single()

      if (!channelData) {
        console.error(`[Vapi Webhook] No agent found for Vapi assistant ID: ${assistantId}`)
        return new NextResponse('Agent not found', { status: 404 })
      }

      const agentId = channelData.agent_id

      // Create a conversation record
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .insert({
          agent_id: agentId,
          channel: 'voice',
          customer_identifier: customerNumber,
          status: 'resolved', // Voice calls are generally 'resolved' once ended
          closed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (conversation) {
        // Save the transcript and recording URL
        await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: `**Resumen de la Llamada Telefónica**\n\n*Duración: ${call.endedAt ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000) : 0} segundos*\n\n**Transcripción:**\n${transcript || 'Sin transcripción.'}`,
            metadata: {
              recordingUrl: recordingUrl,
              callId: call.id
            }
          })
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing Vapi webhook:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
