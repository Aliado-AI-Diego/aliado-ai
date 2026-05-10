import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxClient } from '@/components/inbox/inbox-client'

export default async function ChatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!companies) {
    return <div>No se encontró compañía.</div>
  }

  // Obtenemos los agentes de la compañía
  const { data: agents } = await supabase
    .from('agents')
    .select('id, agent_name')
    .eq('company_id', companies.id)

  const agentIds = agents?.map(a => a.id) || []

  // Obtenemos todas las conversaciones
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      agent_id,
      channel,
      customer_identifier,
      status,
      created_at,
      closed_at,
      is_test
    `)
    .in('agent_id', agentIds)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[500px] w-full animate-fade-in">
      <InboxClient 
        initialConversations={conversations || []} 
        agents={agents || []}
      />
    </div>
  )
}
