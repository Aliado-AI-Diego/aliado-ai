import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
      .limit(3)
    recentInsights = insights || []
  }

  const resolutionRate = totalConversations > 0 
    ? Math.round((resolvedConversations / totalConversations) * 100) 
    : 0

  const firstName = profile?.full_name?.split(' ')[0] || 'usuario'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí está el resumen de tu negocio hoy.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-apple-sm hover-lift border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Agentes activos</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{agentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-apple-sm hover-lift border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Chats atendidos</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{totalConversations}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-apple-sm hover-lift border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tasa de resolución</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{resolutionRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-apple-sm hover-lift border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tiempo ahorrado</p>
                <p className="text-3xl font-bold tracking-tight mt-1">
                  {Math.round(totalConversations * 3.5)}
                  <span className="text-base font-normal text-muted-foreground ml-1">min</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="shadow-apple-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentCount === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-center transition-colors hover:bg-muted/40 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Crea tu primer agente</h3>
                <p className="text-sm text-muted-foreground mb-6">Empieza a automatizar la atención a tus clientes en minutos.</p>
                <Link href="/dashboard/agents" className="w-full">
                  <Button className="w-full shadow-apple hover:shadow-apple-hover group/btn">
                    Comenzar ahora
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/dashboard/playground">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Probar agente</p>
                        <p className="text-xs text-muted-foreground">Abre el Testing Ground</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link href="/dashboard/insights">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ver insights</p>
                        <p className="text-xs text-muted-foreground">Descubre tendencias de tus clientes</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card className="shadow-apple-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Insights recientes</CardTitle>
            {recentInsights.length > 0 && (
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver todos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="relative mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-12 h-12 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5 text-muted-foreground/70" />
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Aún no hay insights</h4>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  La IA analizará tus conversaciones y te mostrará oportunidades y tendencias aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        insight.category === 'opportunity' ? 'bg-green-500' :
                        insight.category === 'complaint' ? 'bg-red-500' :
                        insight.category === 'trend' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {insight.category === 'trend' ? 'Tendencia' :
                         insight.category === 'complaint' ? 'Queja' :
                         insight.category === 'opportunity' ? 'Oportunidad' : 'Métrica'}
                      </span>
                    </div>
                    <p className="text-sm">{insight.insight_summary}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
