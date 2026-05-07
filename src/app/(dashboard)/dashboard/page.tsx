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
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h1 className="text-3xl font-heading font-bold tracking-tight">
          Hola, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí está el resumen de tu negocio hoy.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-premium glass hover-lift border-border/30 relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Agentes activos</p>
                <p className="text-4xl font-heading font-bold tracking-tight mt-1">{agentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium glass hover-lift border-border/30 relative overflow-hidden group animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D68F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Chats atendidos</p>
                <p className="text-4xl font-heading font-bold tracking-tight mt-1">{totalConversations}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#00D68F]/10 flex items-center justify-center text-[#00D68F] group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            {/* Sparkline decoration */}
            <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiPjxwYXRoIGQ9Ik0wLDIwIEwxMCwxMCBMMjAsMTUgTDMwLDUgTDQwLDEyIEw1MCwyIEw2MCw4IEw3MCwwIEw4MCw2IEw5MCwyIEwxMDAsMTAgTDEwMCwyMCBaIiBmaWxsPSIjMDBENjhGIi8+PC9zdmc+')] bg-cover bg-no-repeat bg-bottom" />
          </CardContent>
        </Card>

        <Card className="shadow-premium glass hover-lift border-border/30 relative overflow-hidden group animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tasa de resolución</p>
                <p className="text-4xl font-heading font-bold tracking-tight mt-1">{resolutionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium glass hover-lift border-border/30 relative overflow-hidden group animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tiempo ahorrado</p>
                <p className="text-4xl font-heading font-bold tracking-tight mt-1">
                  {Math.round(totalConversations * 3.5)}
                  <span className="text-base font-normal text-muted-foreground ml-1">min</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="shadow-premium glass border-border/30 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-heading font-semibold">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentCount === 0 ? (
              <Link href="/dashboard/agents">
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Crea tu primer agente</p>
                      <p className="text-xs text-muted-foreground">
                        Configura un agente de IA para tu negocio
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ) : (
              <>
                <Link href="/dashboard/playground">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Probar agente</p>
                        <p className="text-xs text-muted-foreground">Abre el Testing Ground</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link href="/dashboard/insights">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-[#00D68F]/50 hover:shadow-lg hover:shadow-[#00D68F]/10 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#00D68F]/10 text-[#00D68F] flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Ver insights</p>
                        <p className="text-xs text-muted-foreground">Descubre tendencias de tus clientes</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#00D68F] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card className="shadow-premium glass border-border/30 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-heading font-semibold">Insights recientes</CardTitle>
            {recentInsights.length > 0 && (
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                  Ver todos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentInsights.length === 0 ? (
              <div className="text-center py-10 relative overflow-hidden rounded-xl border border-dashed border-border/50 bg-card/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                <Sparkles className="w-12 h-12 mx-auto text-primary/40 mb-4 animate-[pulse_3s_ease-in-out_infinite]" />
                <p className="text-sm font-medium">No hay insights aún</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                  Los insights aparecerán cuando tu agente empiece a conversar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 rounded-xl bg-card border border-border/50 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
                        insight.category === 'opportunity' ? 'bg-[#00D68F] shadow-[#00D68F]/50' :
                        insight.category === 'complaint' ? 'bg-red-500 shadow-red-500/50' :
                        insight.category === 'trend' ? 'bg-primary shadow-primary/50' : 'bg-gray-500'
                      }`} />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {insight.category === 'trend' ? 'Tendencia' :
                         insight.category === 'complaint' ? 'Queja' :
                         insight.category === 'opportunity' ? 'Oportunidad' : 'Métrica'}
                      </span>
                    </div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{insight.insight_summary}</p>
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
