import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/meta/client'
import { generateChatResponse } from '@/lib/ai/gemini'
import { searchKnowledge } from '@/lib/ai/rag'

// Initialize a Supabase client with the Service Role key since this is a server-to-server webhook
// and we need to bypass RLS to read agent configurations based on incoming phone numbers.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET Handler: Webhook Verification
 * Meta will send a GET request to verify the endpoint URL.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully!')
    return new NextResponse(challenge, { status: 200 })
  } else {
    return new NextResponse('Forbidden', { status: 403 })
  }
}

/**
 * POST Handler: Receive Messages
 * Meta sends events here (e.g. when a user sends a WhatsApp message).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // En Vercel Serverless, si devolvemos el 200 OK antes de terminar, 
    // la función se congela y muere. Por lo tanto, debemos esperar a que termine.
    // Meta nos da hasta 15 segundos para responder.
    await processMetaEvent(body)

    // Return 200 OK immediately after processing
    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  } catch (error) {
    console.error('Error parsing webhook body:', error)
    return new NextResponse('Bad Request', { status: 400 })
  }
}

/**
 * Background worker to process the incoming webhook payload
 */
async function processMetaEvent(body: any) {
  // Check if it's a WhatsApp API event
  if (body.object !== 'whatsapp_business_account') {
    return
  }

  // Iterate over entries and changes (Meta can batch events)
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.value && change.value.messages && change.value.messages[0]) {
        const message = change.value.messages[0]
        const contact = change.value.contacts?.[0]
        
        // We only handle text messages for now
        if (message.type !== 'text') continue

        const incomingText = message.text.body
        const customerPhone = message.from
        // The ID of the WhatsApp number that received the message
        const businessPhoneNumberId = change.value.metadata.phone_number_id

        await handleWhatsAppMessage(incomingText, customerPhone, businessPhoneNumberId)
      }
    }
  }
}

/**
 * Handle the core logic: find agent -> RAG -> Gemini -> Send Response
 */
async function handleWhatsAppMessage(text: string, customerPhone: string, businessPhoneNumberId: string) {
  console.log(`[Meta Webhook] Received message from ${customerPhone} to ${businessPhoneNumberId}: "${text}"`)

  // 1. Find which agent is connected to this phone number
  const { data: channelData, error: channelError } = await supabaseAdmin
    .from('agent_channels')
    .select('agent_id, channel_config')
    .eq('channel_type', 'whatsapp')
    .filter('channel_config->>phoneNumberId', 'eq', businessPhoneNumberId)
    .single()

  if (channelError || !channelData) {
    console.error(`[Meta Webhook] No agent found configured for phone number ID: ${businessPhoneNumberId}`)
    return
  }

  const agentId = channelData.agent_id
  const accessToken = channelData.channel_config.accessToken

  if (!accessToken) {
    console.error(`[Meta Webhook] Access token missing for agent ${agentId}`)
    return
  }

  // 2. Fetch the Agent configuration
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (agentError || !agent || !agent.is_active) {
    console.log(`[Meta Webhook] Agent ${agentId} is inactive or not found.`)
    return
  }

  // 3. Find or create a Conversation for this customer
  const customerIdentifier = `wa_${customerPhone}`
  
  // Look for an active conversation
  let { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('agent_id', agentId)
    .eq('channel', 'whatsapp')
    .eq('customer_identifier', customerIdentifier)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let conversationId = conversation?.id

  if (!conversation) {
    // Create new conversation
    const { data: newConv, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        agent_id: agentId,
        channel: 'whatsapp',
        customer_identifier: customerIdentifier,
        is_test: false,
      })
      .select()
      .single()

    if (convError || !newConv) {
      console.error('[Meta Webhook] Failed to create conversation', convError)
      return
    }
    conversationId = newConv.id
  }

  // 4. Save the user's message
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: text,
  })

  // 5. RAG: Search knowledge base
  const contextString = await searchKnowledge(agentId, text, 3)

  // 6. Get chat history for context
  const { data: history } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10) // Last 10 messages for context window

  // 7. Generate AI Response
  const aiResponseText = await generateChatResponse(
    agent.system_prompt,
    history || [{ role: 'user', content: text }],
    contextString
  )

  // 8. Save AI response to DB
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: aiResponseText,
  })

  // 9. Send response back to user via WhatsApp
  await sendWhatsAppMessage({
    to: customerPhone,
    text: aiResponseText,
    phoneNumberId: businessPhoneNumberId,
    accessToken: accessToken,
  })

  console.log(`[Meta Webhook] Replied to ${customerPhone} successfully.`)
}
