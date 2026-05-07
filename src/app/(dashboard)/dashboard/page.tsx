import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  ArrowRight,
  Terminal,
} from 'lucide-react'
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
      .limit(4)
    recentInsights = insights || []
  }

  const resolutionRate = totalConversations > 0 
    ? Math.round((resolvedConversations / totalConversations) * 100) 
    : 0

  const firstName = profile?.full_name?.split(' ')[0]?.toUpperCase() || 'SYS_ADMIN'

  return (
    <div className="w-full min-h-full flex flex-col font-mono">
      {/* Header Brutalista */}
      <div className="mb-12 border-l-4 border-primary pl-4 animate-slide-in-left">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-2 font-bold">
          [ AUTHENTICATED_SESSION : {firstName} ]
        </p>
        <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase">
          System_Status
        </h1>
      </div>

      {/* Massive Typographic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border shadow-brutalist bg-card mb-12">
        {/* Metric 1: Agents */}
        <div className="p-8 border-b md:border-b-0 md:border-r border-border relative overflow-hidden group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            [ NODE_01 ] ACTIVE_AGENTS
          </p>
          <div className="text-7xl md:text-8xl font-heading font-black text-foreground group-hover:text-primary transition-colors duration-200">
            {agentCount.toString().padStart(2, '0')}
          </div>
          <div className="absolute top-8 right-8 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>

        {/* Metric 2: Interactions */}
        <div className="p-8 border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden group">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            [ NODE_02 ] CHAT_OPERATIONS
          </p>
          <div className="text-7xl md:text-8xl font-heading font-black text-foreground group-hover:text-primary transition-colors duration-200">
            {totalConversations.toString().padStart(3, '0')}
          </div>
          <div className="absolute bottom-8 right-8 text-primary opacity-20">
             <Terminal className="w-16 h-16" />
          </div>
        </div>

        {/* Metric 3: Efficiency */}
        <div className="p-8 border-border relative overflow-hidden group bg-primary/5">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
            [ NODE_03 ] RESOLUTION_RATE
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl md:text-8xl font-heading font-black text-primary">
              {resolutionRate}
            </span>
            <span className="text-3xl font-heading font-bold text-primary/50">%</span>
          </div>
        </div>
      </div>

      {/* Action Data Split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 border-t border-border pt-8">
        
        {/* Command Matrix (Actions) */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            [ EXECUTE_COMMANDS ]
          </p>
          <div className="flex flex-col border border-border shadow-brutalist bg-card">
            <Link 
              href="/dashboard/playground"
              className="p-6 border-b border-border flex items-center justify-between hover:bg-muted group transition-none"
            >
              <div>
                <p className="font-bold text-sm uppercase">INIT_TEST_ENV</p>
                <p className="text-xs text-muted-foreground mt-1">Run simulation protocols</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </Link>
            
            <Link 
              href="/dashboard/agents"
              className="p-6 flex items-center justify-between hover:bg-muted group transition-none"
            >
              <div>
                <p className="font-bold text-sm uppercase">DEPLOY_AGENT</p>
                <p className="text-xs text-muted-foreground mt-1">Configure new intelligence</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </Link>
          </div>
        </div>

        {/* Stream Matrix (Insights) */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            [ DATA_STREAM_INSIGHTS ]
          </p>
          <div className="border border-border bg-card shadow-brutalist">
            {recentInsights.length === 0 ? (
              <div className="p-8 text-muted-foreground text-sm flex items-center gap-3">
                <span className="animate-pulse">_</span> AWAITING_DATA_INGESTION...
              </div>
            ) : (
              <div className="flex flex-col">
                {recentInsights.map((insight, i) => (
                  <div key={insight.id} className={`p-5 flex flex-col md:flex-row md:items-center gap-4 ${i !== recentInsights.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/50`}>
                    <div className="flex items-center gap-2 md:w-32 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider border ${
                        insight.category === 'opportunity' ? 'text-primary border-primary bg-primary/10' :
                        insight.category === 'complaint' ? 'text-destructive border-destructive bg-destructive/10' :
                        'text-muted-foreground border-border'
                      }`}>
                        {insight.category.substring(0, 4)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{insight.insight_summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
