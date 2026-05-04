import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInsights } from '@/lib/ai/gemini'
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { company_id } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })
    }

    // Verify ownership
    const { data: company } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('id', company_id)
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    // Get all agents for this company
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('company_id', company_id)

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        insights: [],
        message: 'No hay agentes configurados.',
      })
    }

    const agentIds = agents.map(a => a.id)

    // Get recent conversations and messages
    const { data: conversations } = await serviceSupabase
      .from('conversations')
      .select(`
        id,
        channel,
        status,
        created_at,
        is_test
      `)
      .in('agent_id', agentIds)
      .eq('is_test', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        insights: [],
        message: 'No hay conversaciones suficientes para generar insights. Las conversaciones de prueba no se incluyen.',
      })
    }

    // Get messages for these conversations
    const convIds = conversations.map(c => c.id)
    const { data: messages } = await serviceSupabase
      .from('messages')
      .select('conversation_id, role, content')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: true })

    // Group messages by conversation
    const conversationSummaries = conversations.map(conv => {
      const convMessages = messages?.filter(m => m.conversation_id === conv.id) || []
      const transcript = convMessages
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Agente'}: ${m.content}`)
        .join('\n')
      return `--- Conversación (${conv.channel}, ${conv.status}) ---\n${transcript}`
    }).join('\n\n')

    // Generate insights with Gemini
    const insightsJson = await generateInsights(conversationSummaries, company.company_name)
    
    let parsedInsights
    try {
      parsedInsights = JSON.parse(insightsJson)
    } catch {
      return NextResponse.json({
        insights: [],
        message: 'Error al procesar los insights generados.',
      })
    }

    // Store insights
    const insightsToStore = (Array.isArray(parsedInsights) ? parsedInsights : [parsedInsights]).map(
      (insight: { category?: string; insight_summary?: string; actionable_advice?: string; confidence_score?: number }) => ({
        company_id,
        category: insight.category || 'trend',
        insight_summary: insight.insight_summary || '',
        actionable_advice: insight.actionable_advice || '',
        confidence_score: insight.confidence_score || 50,
        generation_type: 'on_demand',
      })
    )

    const { data: stored, error } = await serviceSupabase
      .from('insights')
      .insert(insightsToStore)
      .select()

    if (error) {
      console.error('Error storing insights:', error)
    }

    return NextResponse.json({
      insights: stored || [],
      message: `Se generaron ${stored?.length || 0} insights.`,
    })
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
