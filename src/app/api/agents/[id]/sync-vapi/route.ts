import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateVapiAssistantPrompt } from '@/lib/vapi/client'

// Using service role because this could be called internally or via webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params

    // 1. Check if this agent has a Voice channel configured with Vapi
    const { data: voiceChannel } = await supabaseAdmin
      .from('agent_channels')
      .select('channel_config, is_active')
      .eq('agent_id', agentId)
      .eq('channel_type', 'voice')
      .single()

    if (!voiceChannel || !voiceChannel.is_active || !voiceChannel.channel_config.vapi_assistant_id) {
      // Not an error, just nothing to sync
      return NextResponse.json({ message: 'No active Vapi voice channel found. Skipping sync.' })
    }

    const vapiAssistantId = voiceChannel.channel_config.vapi_assistant_id

    // 2. Fetch the Agent's system prompt
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('system_prompt, agent_name')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return new NextResponse('Agent not found', { status: 404 })
    }

    // 3. Fetch the Agent's Knowledge Base
    const { data: knowledgeChunks } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('chunk_text')
      .eq('agent_id', agentId)

    // 4. Construct the ultimate prompt for Vapi
    let finalPrompt = agent.system_prompt
    
    if (knowledgeChunks && knowledgeChunks.length > 0) {
      const knowledgeText = knowledgeChunks.map(c => c.chunk_text).join('\n\n')
      finalPrompt += `\n\n--- Base de Conocimiento de la Empresa ---\nUtiliza la siguiente información para responder a las preguntas del usuario. Si no encuentras la respuesta aquí, sé honesto y no inventes información.\n\n${knowledgeText}`
    }

    // 5. Push to Vapi
    await updateVapiAssistantPrompt(vapiAssistantId, finalPrompt)

    return NextResponse.json({ success: true, message: 'Vapi assistant updated successfully.' })
  } catch (error: any) {
    console.error('Error syncing with Vapi:', error)
    return new NextResponse(`Sync error: ${error.message}`, { status: 500 })
  }
}
