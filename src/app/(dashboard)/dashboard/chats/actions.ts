'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function toggleConversationStatus(conversationId: string, currentStatus: string) {
  const supabase = await createClient()
  const newStatus = currentStatus === 'escalated' ? 'active' : 'escalated'
  
  const { error } = await supabase
    .from('conversations')
    .update({ status: newStatus })
    .eq('id', conversationId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/chats')
  return newStatus
}

export async function sendHumanMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: content,
      metadata: { is_human: true }
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function submitMessageFeedback(messageId: string, feedback: 'up' | 'down') {
  const supabase = await createClient()
  
  const { data: msg } = await supabase
    .from('messages')
    .select('metadata')
    .eq('id', messageId)
    .single()
    
  const currentMeta = (msg?.metadata as Record<string, unknown>) || {}
  
  const { error } = await supabase
    .from('messages')
    .update({
      metadata: { ...currentMeta, feedback }
    })
    .eq('id', messageId)

  if (error) throw new Error(error.message)
}
