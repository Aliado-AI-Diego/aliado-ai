'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bot, Plus, Settings, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import type { Agent, Company } from '@/types'
import Link from 'next/link'
import { canCreateAgent } from '@/lib/permissions'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentTone, setNewAgentTone] = useState('profesional')
  const router = useRouter()

  function handleCreateClick() {
    const plan = company?.subscription_plan || 'free'
    if (canCreateAgent(plan, agents.length)) {
      setDialogOpen(true)
    } else {
      setUpsellOpen(true)
    }
  }

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
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('company_id', companies[0].id)
        .order('created_at', { ascending: false })

      setAgents(agentsData || [])
    }
    setLoading(false)
  }

  async function createAgent() {
    if (!company || !newAgentName.trim()) return
    setCreating(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('agents')
      .insert({
        company_id: company.id,
        agent_name: newAgentName.trim(),
        tone: newAgentTone,
        system_prompt: getDefaultPrompt(newAgentTone),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      setCreating(false)
      return
    }

    setDialogOpen(false)
    setNewAgentName('')
    setNewAgentTone('profesional')
    setCreating(false)
    router.push(`/dashboard/agents/${data.id}`)
  }

  function getDefaultPrompt(tone: string): string {
    const tones: Record<string, string> = {
      formal: 'Eres un agente de servicio al cliente profesional y cortés. Usa un lenguaje formal y respetuoso. Siempre trata al cliente de "usted".',
      empatico: 'Eres un agente de servicio al cliente cálido y empático. Muestra comprensión y empatía ante las situaciones del cliente. Hazles sentir que realmente te importa su problema.',
      persuasivo: 'Eres un agente de servicio al cliente persuasivo y orientado a resultados. Destaca los beneficios de los productos o servicios y guía al cliente hacia la mejor decisión.',
      profesional: 'Eres un agente de servicio al cliente profesional y eficiente. Ofrece respuestas claras, directas y bien estructuradas. Equilibra formalidad con amabilidad.',
      amigable: 'Eres un agente de servicio al cliente amigable y cercano. Usa un tono casual pero respetuoso. Haz que la conversación sea natural y agradable.',
    }
    return tones[tone] || tones.profesional
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
          <p className="text-muted-foreground mt-1">
            Crea y configura tus agentes de IA.
          </p>
        </div>
        <div>
          <Button onClick={handleCreateClick} className="rounded-full px-5 gap-2">
            <Plus className="w-4 h-4" />
            Nuevo agente
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nuevo agente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre del agente</Label>
                <Input
                  placeholder="Ej: Asistente de ventas"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Tono de comunicación</Label>
                <Select value={newAgentTone} onValueChange={(v) => v && setNewAgentTone(v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">🎩 Formal</SelectItem>
                    <SelectItem value="empatico">💛 Empático</SelectItem>
                    <SelectItem value="persuasivo">🎯 Persuasivo</SelectItem>
                    <SelectItem value="profesional">💼 Profesional</SelectItem>
                    <SelectItem value="amigable">😊 Amigable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={createAgent}
                disabled={creating || !newAgentName.trim()}
                className="w-full h-11 rounded-xl"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Crear agente'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={upsellOpen} onOpenChange={setUpsellOpen}>
          <DialogContent className="sm:max-w-md text-center py-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Límite Alcanzado</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-2 mb-6">
              Tu plan actual solo permite crear 1 agente. Mejora al Plan Pro para desbloquear agentes ilimitados y funciones avanzadas como Llamadas de Voz.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/dashboard/settings')} className="rounded-full h-11">
                Ver planes disponibles
              </Button>
              <Button variant="ghost" onClick={() => setUpsellOpen(false)} className="rounded-full">
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card className="shadow-apple-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Sin agentes aún</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Crea tu primer agente de IA para empezar a atender a tus clientes automáticamente.
            </p>
            <Button
              onClick={handleCreateClick}
              className="rounded-full px-6 gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear mi primer agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="shadow-apple-sm hover-lift border-border/50 cursor-pointer group"
            >
              <Link href={`/dashboard/agents/${agent.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                      <Bot className="w-6 h-6" />
                    </div>
                    <Badge
                      variant={agent.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {agent.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{agent.agent_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize mb-4">
                    Tono: {agent.tone === 'empatico' ? 'Empático' : agent.tone}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Configurar
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Probar
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
