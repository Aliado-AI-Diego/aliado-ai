import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

/**
 * GET /api/widget/[agentId]
 * Returns the agent config for the chat widget (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, agent_name, tone, widget_config, is_active')
    .eq('id', agentId)
    .eq('is_active', true)
    .single()

  if (error || !agent) {
    return NextResponse.json(
      { error: 'Agente no encontrado o inactivo' },
      { status: 404 }
    )
  }

  // CORS headers for embeddable widget
  return NextResponse.json(
    {
      id: agent.id,
      name: agent.agent_name,
      config: agent.widget_config,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
