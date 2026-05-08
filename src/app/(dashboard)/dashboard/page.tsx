import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Bot,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)

  const company = companies?.[0]

  // Fetch agents count
  let agentCount = 0
  let totalConversations = 0
  let resolvedConversations = 0
  let recentInsights: { id: string; insight_summary: string; category: string; generated_at: string }[] = []

  if (company) {
    const { count: aCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
    agentCount = aCount || 0

    // Get agent IDs for this company
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('company_id', company.id)

    if (agents && agents.length > 0) {
      const agentIds = agents.map(a => a.id)
      
      const { count: totalCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .eq('is_test', false)
      totalConversations = totalCount || 0

      const { count: resolvedCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .eq('status', 'resolved')
        .eq('is_test', false)
      resolvedConversations = resolvedCount || 0
    }

    // Get recent insights
    const { data: insights } = await supabase
      .from('insights')
      .select('id, insight_summary, category, generated_at')
      .eq('company_id', company.id)
      .order('generated_at', { ascending: false })
      .limit(4)
    recentInsights = insights || []
  }

  const resolutionRate = totalConversations > 0 
    ? Math.round((resolvedConversations / totalConversations) * 100) 
    : 0

  const firstName = profile?.full_name?.split(' ')[0] || 'usuario'

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header Ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
            Resumen Ejecutivo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bienvenido, {firstName}. Aquí tienes el estado actual de tus operaciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents">
            <Button className="shadow-executive">Crear Agente</Button>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas - Clean Corporate Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-executive border-border/60 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Agentes Activos</p>
                <p className="text-4xl font-heading font-bold">{agentCount}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Bot className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-executive border-border/60 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Chats Atendidos</p>
                <p className="text-4xl font-heading font-bold">{totalConversations}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-md text-blue-500">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-executive border-border/60 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Tasa de Resolución</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-heading font-bold">{resolutionRate}</p>
                  <span className="text-xl font-semibold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="p-2 bg-green-500/10 rounded-md text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-executive border-border/60 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Horas Ahorradas</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-heading font-bold">
                    {(totalConversations * 3.5 / 60).toFixed(1)}
                  </p>
                  <span className="text-sm font-medium text-muted-foreground">hrs</span>
                </div>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-md text-purple-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección Inferior: Reportes y Accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Insights Section */}
        <Card className="shadow-executive border-border/60 flex flex-col">
          <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Reporte de Inteligencia
              </CardTitle>
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">Ver Reporte Completo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <TrendingUp className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No hay datos suficientes para generar el reporte.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-1">
                      {insight.category === 'opportunity' ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                      ) : insight.category === 'complaint' ? (
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {insight.category === 'opportunity' ? 'Oportunidad' :
                           insight.category === 'complaint' ? 'Alerta' : 'Tendencia'}
                        </span>
                        <span className="text-xs text-muted-foreground opacity-70">
                          {new Date(insight.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-foreground/90">
                        {insight.insight_summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Acceso Rápido
          </h3>
          
          <Link href="/dashboard/playground" className="block">
            <Card className="shadow-sm border-border/60 hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Simulador de IA</p>
                    <p className="text-xs text-muted-foreground">Prueba tus agentes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/chats" className="block">
            <Card className="shadow-sm border-border/60 hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Operaciones en Vivo</p>
                    <p className="text-xs text-muted-foreground">Monitoriza las conversaciones</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>

      </div>
    </div>
  )
}
