import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processAndStoreKnowledge } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { agent_id, source_name, text, source_type = 'text' } = body

    if (!agent_id || !source_name || !text) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: agent_id, source_name, text' },
        { status: 400 }
      )
    }

    // Verify user owns this agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id, company_id')
      .eq('id', agent_id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', agent.company_id)
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Process and store knowledge
    const chunksCreated = await processAndStoreKnowledge(
      agent_id,
      source_name,
      text,
      source_type
    )

    return NextResponse.json({
      success: true,
      chunks_created: chunksCreated,
      message: `Se procesaron ${chunksCreated} fragmentos de conocimiento.`,
    })
  } catch (error) {
    console.error('Knowledge API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
