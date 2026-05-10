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
  opportunity: { label: 'Oportunidad', icon: Lightbulb, color: 'bg-emerald-500' },
  metric: { label: 'Métrica', icon: BarChart3, color: 'bg-amber-500' },
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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Reportes</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Inteligencia de negocio generada por IA.
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={generating}
          size="sm"
          className="shadow-command h-8 text-[13px] font-semibold gap-1.5"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generar
            </>
          )}
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-children">
        <Card className="shadow-command border-border accent-strip">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Chats atendidos</p>
                <p className="text-3xl font-heading font-bold tracking-tight mt-1 tabular-nums">{totalChats}</p>
              </div>
              <div className="p-1.5 bg-muted text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-command border-border accent-strip-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resolución</p>
                <p className="text-3xl font-heading font-bold tracking-tight mt-1 tabular-nums">{resolutionRate}%</p>
              </div>
              <div className="p-1.5 bg-muted text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-command border-border accent-strip-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tiempo ahorrado</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-heading font-bold tracking-tight tabular-nums">
                    {Math.round(totalChats * 3.5)}
                  </p>
                  <span className="text-sm font-medium text-muted-foreground">min</span>
                </div>
              </div>
              <div className="p-1.5 bg-muted text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Feed */}
      <Card className="shadow-command border-border">
        <CardHeader className="border-b border-border bg-muted/40 py-3 px-4">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Feed de Inteligencia</CardTitle>
          <CardDescription className="text-[12px]">
            Patrones, quejas y oportunidades extraídos de conversaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="font-semibold text-sm mb-1">Sin datos aún</h3>
              <p className="text-[12px] text-muted-foreground max-w-sm mx-auto mb-4">
                Cuando tu agente tenga conversaciones, podrás generar insights desde aquí.
              </p>
              <Button
                onClick={generateInsights}
                disabled={generating}
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-semibold gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                Intentar generar
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {insights.map((insight) => {
                const config = categoryConfig[insight.category] || categoryConfig.trend
                const Icon = config.icon
                return (
                  <div
                    key={insight.id}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-2 h-2 mt-1.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[9px] font-bold gap-0.5 uppercase tracking-wider">
                          <Icon className="w-2.5 h-2.5" />
                          {config.label}
                        </Badge>
                        {insight.confidence_score && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {insight.confidence_score}%
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 ml-auto tabular-nums">
                          {new Date(insight.generated_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium leading-snug mb-0.5">{insight.insight_summary}</p>
                      {insight.actionable_advice && (
                        <p className="text-[12px] text-muted-foreground leading-snug">
                          → {insight.actionable_advice}
                        </p>
                      )}
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
