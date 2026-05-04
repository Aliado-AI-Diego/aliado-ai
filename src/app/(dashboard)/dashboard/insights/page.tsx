'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import type { Insight, Company } from '@/types'

const categoryConfig = {
  trend: { label: 'Tendencia', icon: TrendingUp, color: 'bg-blue-500' },
  complaint: { label: 'Queja', icon: AlertTriangle, color: 'bg-red-500' },
  opportunity: { label: 'Oportunidad', icon: Lightbulb, color: 'bg-green-500' },
  metric: { label: 'Métrica', icon: BarChart3, color: 'bg-purple-500' },
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [totalChats, setTotalChats] = useState(0)
  const [resolvedChats, setResolvedChats] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)

    if (companies && companies.length > 0) {
      setCompany(companies[0])

      // Load insights
      const { data: insightsData } = await supabase
        .from('insights')
        .select('*')
        .eq('company_id', companies[0].id)
        .order('generated_at', { ascending: false })
        .limit(20)

      setInsights(insightsData || [])

      // Load metrics
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('company_id', companies[0].id)

      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.id)

        const { count: total } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .in('agent_id', agentIds)
          .eq('is_test', false)

        const { count: resolved } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .in('agent_id', agentIds)
          .eq('status', 'resolved')
          .eq('is_test', false)

        setTotalChats(total || 0)
        setResolvedChats(resolved || 0)
      }
    }

    setLoading(false)
  }

  async function generateInsights() {
    if (!company) return
    setGenerating(true)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id }),
      })

      const data = await response.json()
      if (data.insights && data.insights.length > 0) {
        setInsights(prev => [...data.insights, ...prev])
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    }

    setGenerating(false)
  }

  const resolutionRate = totalChats > 0
    ? Math.round((resolvedChats / totalChats) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1">
            Inteligencia de negocio generada por IA.
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={generating}
          className="rounded-full px-5 gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar insights
            </>
          )}
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-apple-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Chats atendidos</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{totalChats}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-apple-sm border-border/50">
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

        <Card className="shadow-apple-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tiempo ahorrado</p>
                <p className="text-3xl font-bold tracking-tight mt-1">
                  {Math.round(totalChats * 3.5)}
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

      {/* Insights Feed */}
      <Card className="shadow-apple-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Feed de insights</CardTitle>
          <CardDescription>
            La IA analiza las conversaciones de tus clientes y extrae patrones, quejas y oportunidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-1">Sin insights aún</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Cuando tu agente tenga conversaciones con clientes reales, podrás generar insights desde aquí.
              </p>
              <Button
                onClick={generateInsights}
                disabled={generating}
                variant="outline"
                className="rounded-full gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                Intentar generar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => {
                const config = categoryConfig[insight.category] || categoryConfig.trend
                const Icon = config.icon
                return (
                  <div
                    key={insight.id}
                    className="p-5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                          {insight.confidence_score && (
                            <span className="text-xs text-muted-foreground">
                              {insight.confidence_score}% confianza
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(insight.generated_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{insight.insight_summary}</p>
                        {insight.actionable_advice && (
                          <p className="text-sm text-muted-foreground">
                            💡 {insight.actionable_advice}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
