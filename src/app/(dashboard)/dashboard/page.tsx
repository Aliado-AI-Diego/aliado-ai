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

  const metrics = [
    {
      label: 'Agentes Activos',
      value: agentCount,
      suffix: '',
      icon: Bot,
      accentClass: 'accent-strip',
    },
    {
      label: 'Chats Atendidos',
      value: totalConversations,
      suffix: '',
      icon: MessageSquare,
      accentClass: 'accent-strip',
    },
    {
      label: 'Tasa de Resolución',
      value: resolutionRate,
      suffix: '%',
      icon: CheckCircle2,
      accentClass: 'accent-strip-success',
    },
    {
      label: 'Horas Ahorradas',
      value: (totalConversations * 3.5 / 60).toFixed(1),
      suffix: 'hrs',
      icon: Clock,
      accentClass: 'accent-strip-warning',
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header — Compact, authoritative */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-border">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground mb-0.5">
            Bienvenido, {firstName}
          </p>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
            Panel de Control
          </h1>
        </div>
        <Link href="/dashboard/agents">
          <Button size="sm" className="shadow-command h-8 text-[13px] font-medium">
            Crear Agente
          </Button>
        </Link>
      </div>

      {/* Metric Cards — Razor Command style with accent strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className={`shadow-command border-border overflow-hidden ${metric.accentClass}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-heading font-bold tabular-nums">
                        {metric.value}
                      </p>
                      {metric.suffix && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {metric.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-1.5 bg-muted text-muted-foreground">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lower Section: Reports + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        
        {/* Insights Section */}
        <Card className="shadow-command border-border flex flex-col">
          <CardHeader className="border-b border-border bg-muted/40 py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                Inteligencia
              </CardTitle>
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Ver Todo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-muted-foreground">
                <TrendingUp className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-[13px]">Sin datos para generar el reporte.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="mt-1.5 shrink-0">
                      {insight.category === 'opportunity' ? (
                        <div className="w-2 h-2 bg-emerald-500" />
                      ) : insight.category === 'complaint' ? (
                        <div className="w-2 h-2 bg-red-500" />
                      ) : (
                        <div className="w-2 h-2 bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {insight.category === 'opportunity' ? 'Oportunidad' :
                           insight.category === 'complaint' ? 'Alerta' : 'Tendencia'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                          {new Date(insight.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium leading-snug text-foreground/90">
                        {insight.insight_summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5 mb-1">
            Acceso Rápido
          </h3>
          
          <Link href="/dashboard/playground" className="block group">
            <Card className="shadow-command border-border hover:border-primary/50 transition-all hover-command">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">Simulador</p>
                    <p className="text-[11px] text-muted-foreground">Prueba tus agentes</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/chats" className="block group">
            <Card className="shadow-command border-border hover:border-primary/50 transition-all hover-command">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">Operaciones</p>
                    <p className="text-[11px] text-muted-foreground">Monitoriza conversaciones</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
