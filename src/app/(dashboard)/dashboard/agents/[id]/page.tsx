'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Trash2,
  Upload,
  CheckCircle2,
  BookOpen,
  Globe,
  Code,
  Copy,
  MessageSquare,
} from 'lucide-react'
import type { Agent, KnowledgeChunk } from '@/types'
import Link from 'next/link'
import { canUseWhatsApp, canUseVoice } from '@/lib/permissions'

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [knowledgeSources, setKnowledgeSources] = useState<{name: string; count: number; type: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingKnowledge, setUploadingKnowledge] = useState(false)
  const [knowledgeText, setKnowledgeText] = useState('')
  const [knowledgeSourceName, setKnowledgeSourceName] = useState('')

  // Agent form state
  const [agentName, setAgentName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tone, setTone] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Widget config state
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#000000')
  const [widgetPosition, setWidgetPosition] = useState('bottom-right')
  const [widgetGreeting, setWidgetGreeting] = useState('¡Hola! Estoy aquí para ayudarte. ¿Qué necesitas?')

  const [whatsappPhoneId, setWhatsappPhoneId] = useState('')
  const [whatsappToken, setWhatsappToken] = useState('')
  const [channelId, setChannelId] = useState<string | null>(null)
  const [savingChannel, setSavingChannel] = useState(false)
  const [savedChannel, setSavedChannel] = useState(false)
  
  // Voice Calls state
  const [voiceCalls, setVoiceCalls] = useState<any[]>([])
  
  const [plan, setPlan] = useState<string>('free')

  const router = useRouter()

  useEffect(() => {
    loadAgent()
  }, [id])

  async function loadAgent() {
    const supabase = createClient()
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (agentData) {
      setAgent(agentData)
      setAgentName(agentData.agent_name)
      setSystemPrompt(agentData.system_prompt)
      setTone(agentData.tone)
      setIsActive(agentData.is_active)
      
      if (agentData.widget_config) {
        setWidgetPrimaryColor(agentData.widget_config.primaryColor || '#000000')
        setWidgetPosition(agentData.widget_config.position || 'bottom-right')
        setWidgetGreeting(agentData.widget_config.greeting || '¡Hola! Estoy aquí para ayudarte. ¿Qué necesitas?')
      }
      
      const { data: companyData } = await supabase
        .from('companies')
        .select('subscription_plan')
        .eq('id', agentData.company_id)
        .single()
        
      if (companyData) {
        setPlan(companyData.subscription_plan || 'free')
      }
    }

    // Load knowledge sources (grouped by source_name)
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('source_name, source_type')
      .eq('agent_id', id)

    if (chunks) {
      const grouped = chunks.reduce((acc, chunk) => {
        const existing = acc.find(s => s.name === chunk.source_name)
        if (existing) {
          existing.count++
        } else {
          acc.push({ name: chunk.source_name, count: 1, type: chunk.source_type })
        }
        return acc
      }, [] as {name: string; count: number; type: string}[])
      setKnowledgeSources(grouped)
    }

    // Load channels
    const { data: channels } = await supabase
      .from('agent_channels')
      .select('*')
      .eq('agent_id', id)
      .eq('channel_type', 'whatsapp')

    if (channels && channels.length > 0) {
      setChannelId(channels[0].id)
      setWhatsappPhoneId(channels[0].channel_config.phoneNumberId || '')
      setWhatsappToken(channels[0].channel_config.accessToken || '')
    }

    // Load voice calls
    const { data: calls } = await supabase
      .from('conversations')
      .select('id, customer_identifier, created_at, messages(content, metadata)')
      .eq('agent_id', id)
      .eq('channel', 'voice')
      .order('created_at', { ascending: false })

    if (calls) {
      setVoiceCalls(calls)
    }

    setLoading(false)
  }

  async function saveAgent() {
    setSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('agents')
      .update({
        agent_name: agentName,
        system_prompt: systemPrompt,
        tone,
        is_active: isActive,
        widget_config: {
          primaryColor: widgetPrimaryColor,
          position: widgetPosition,
          greeting: widgetGreeting,
        }
      })
      .eq('id', id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      // Trigger Vapi sync in background
      fetch(`/api/agents/${id}/sync-vapi`, { method: 'POST' }).catch(console.error)
    }
    setSaving(false)
  }

  async function saveWhatsAppChannel() {
    setSavingChannel(true)
    const supabase = createClient()
    
    const channelConfig = {
      phoneNumberId: whatsappPhoneId.trim(),
      accessToken: whatsappToken.trim(),
    }

    let error;

    if (channelId) {
      // Update existing
      const res = await supabase
        .from('agent_channels')
        .update({
          channel_config: channelConfig,
          is_active: whatsappPhoneId.trim() !== '' && whatsappToken.trim() !== ''
        })
        .eq('id', channelId)
      error = res.error
    } else {
      // Insert new
      const res = await supabase
        .from('agent_channels')
        .insert({
          agent_id: id,
          channel_type: 'whatsapp',
          channel_config: channelConfig,
          is_active: whatsappPhoneId.trim() !== '' && whatsappToken.trim() !== ''
        })
        .select()
        .single()
      error = res.error
      if (res.data) {
        setChannelId(res.data.id)
      }
    }

    if (!error) {
      setSavedChannel(true)
      setTimeout(() => setSavedChannel(false), 2000)
    } else {
      console.error('Error saving channel:', error)
    }
    setSavingChannel(false)
  }

  async function uploadKnowledge() {
    if (!knowledgeText.trim() || !knowledgeSourceName.trim()) return
    setUploadingKnowledge(true)

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: id,
          source_name: knowledgeSourceName,
          text: knowledgeText,
          source_type: 'text',
        }),
      })

      if (response.ok) {
        // Trigger Vapi sync in background since knowledge changed
        fetch(`/api/agents/${id}/sync-vapi`, { method: 'POST' }).catch(console.error)
        
        setKnowledgeText('')
        setKnowledgeSourceName('')
        await loadAgent()
      }
    } catch (error) {
      console.error('Error uploading knowledge:', error)
    }

    setUploadingKnowledge(false)
  }

  async function deleteKnowledgeSource(sourceName: string) {
    const supabase = createClient()
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('agent_id', id)
      .eq('source_name', sourceName)

    await loadAgent()
    
    // Trigger Vapi sync in background since knowledge changed
    fetch(`/api/agents/${id}/sync-vapi`, { method: 'POST' }).catch(console.error)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Agente no encontrado.</p>
        <Link href="/dashboard/agents">
          <Button variant="outline" className="mt-4">Volver a agentes</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{agent.agent_name}</h1>
          <p className="text-sm text-muted-foreground">
            Configuración y base de conocimiento
          </p>
        </div>
        <Link href={`/dashboard/playground?agent=${id}`}>
          <Button variant="outline" className="rounded-full px-5 text-sm">
            Probar agente
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="personality" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="personality" className="rounded-lg text-sm">
            Personalidad
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-lg text-sm">
            Conocimiento
          </TabsTrigger>
          <TabsTrigger value="deploy" className="rounded-lg text-sm">
            Desplegar
          </TabsTrigger>
          <TabsTrigger value="channels" className="rounded-lg text-sm">
            Canales de Mensajería
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-lg text-sm flex items-center gap-2">
            Llamadas Telefónicas
          </TabsTrigger>
        </TabsList>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Configuración del agente</CardTitle>
              <CardDescription>
                Define cómo se comporta y comunica tu agente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre del agente</Label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tono de comunicación</Label>
                  <Select value={tone} onValueChange={(v) => v && setTone(v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">🎩 Formal</SelectItem>
                      <SelectItem value="empatico">💛 Empático</SelectItem>
                      <SelectItem value="persuasivo">🎯 Persuasivo</SelectItem>
                      <SelectItem value="profesional">💼 Profesional</SelectItem>
                      <SelectItem value="amigable">😊 Amigable</SelectItem>
                      <SelectItem value="custom">✏️ Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instrucciones del sistema (System Prompt)</Label>
                <p className="text-xs text-muted-foreground">
                  Describe en detalle cómo quieres que se comporte tu agente.
                </p>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="rounded-xl resize-none text-sm"
                  placeholder="Eres un agente de servicio al cliente profesional..."
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Agente activo</p>
                  <p className="text-xs text-muted-foreground">
                    Si está desactivado, no responderá conversaciones.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button
                onClick={saveAgent}
                disabled={saving}
                className="rounded-full px-6 gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          {/* Add Knowledge */}
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Agregar conocimiento</CardTitle>
              <CardDescription>
                Pega texto de tus FAQs, políticas, catálogo de productos o cualquier información que tu agente deba conocer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la fuente</Label>
                <Input
                  value={knowledgeSourceName}
                  onChange={(e) => setKnowledgeSourceName(e.target.value)}
                  placeholder="Ej: Políticas de devolución"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  value={knowledgeText}
                  onChange={(e) => setKnowledgeText(e.target.value)}
                  rows={10}
                  className="rounded-xl resize-none text-sm font-mono"
                  placeholder="Pega aquí el contenido de tu documento, FAQ, políticas, catálogo de productos, precios, etc."
                />
              </div>
              <Button
                onClick={uploadKnowledge}
                disabled={uploadingKnowledge || !knowledgeText.trim() || !knowledgeSourceName.trim()}
                className="rounded-full px-6 gap-2"
              >
                {uploadingKnowledge ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Cargar conocimiento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Knowledge Sources */}
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Base de conocimiento</CardTitle>
              <CardDescription>
                {knowledgeSources.length} fuente{knowledgeSources.length !== 1 ? 's' : ''} cargada{knowledgeSources.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {knowledgeSources.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aún no has cargado conocimiento. Tu agente responderá sin contexto específico.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {knowledgeSources.map((source) => (
                    <div
                      key={source.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {source.count} fragmento{source.count !== 1 ? 's' : ''} · {source.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteKnowledgeSource(source.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deploy Tab */}
        <TabsContent value="deploy" className="space-y-6">
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Configuración del Widget</CardTitle>
              <CardDescription>
                Personaliza la apariencia y el saludo inicial de tu asistente web. No olvides guardar los cambios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Color Principal</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border shrink-0 shadow-sm">
                      <input 
                        type="color" 
                        value={widgetPrimaryColor}
                        onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['#000000', '#2563eb', '#16a34a', '#9333ea', '#e11d48'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setWidgetPrimaryColor(c)}
                          className="w-6 h-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Posición en la pantalla</Label>
                  <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/50">
                      <SelectValue placeholder="Selecciona una posición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Esquina Inferior Derecha</SelectItem>
                      <SelectItem value="bottom-left">Esquina Inferior Izquierda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Mensaje de Bienvenida</Label>
                  <Input 
                    value={widgetGreeting}
                    onChange={(e) => setWidgetGreeting(e.target.value)}
                    placeholder="¡Hola! ¿En qué puedo ayudarte?" 
                    className="h-11 rounded-xl bg-muted/50 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Este es el primer mensaje que verán tus visitantes al abrir el chat.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-apple-sm border-border/50 bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Código de Instalación</CardTitle>
              <CardDescription>
                Copia este código y pégalo justo antes de la etiqueta <code className="font-mono text-xs bg-muted px-1 rounded">{`</body>`}</code> en tu sitio web.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 text-sm font-mono overflow-x-auto shadow-inner">
                  <code>{`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'}/widget/embed.js" data-agent-id="${id}"${widgetPosition !== 'bottom-right' ? ` data-position="${widgetPosition}"` : ''}></script>`}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 hover:bg-slate-700 hover:text-white"
                  onClick={() => {
                    const embedCode = `<script src="${window.location.origin}/widget/embed.js" data-agent-id="${id}"${widgetPosition !== 'bottom-right' ? ` data-position="${widgetPosition}"` : ''}></script>`;
                    navigator.clipboard.writeText(embedCode);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 p-3.5 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
                <Globe className="w-5 h-5 shrink-0" />
                <p className="leading-snug">Los cambios de color y saludo se actualizan instantáneamente sin necesidad de volver a pegar este código.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={saveAgent}
              disabled={saving}
              className="rounded-full px-6 gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                WhatsApp (Cloud API)
              </CardTitle>
              <CardDescription>
                Conecta tu agente a WhatsApp para que responda automáticamente a tus clientes. 
                Necesitas obtener estos credenciales desde el <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Meta Developer Portal</a>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canUseWhatsApp(plan) ? (
                <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border/50 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">WhatsApp Bloqueado</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Tu plan actual no incluye la conexión a WhatsApp. Mejora tu plan para empezar a automatizar tus chats.
                  </p>
                  <Button onClick={() => router.push('/dashboard/settings')} className="rounded-full px-6">
                    Mejorar Plan
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone Number ID (ID del número de teléfono)</Label>
                      <Input
                        value={whatsappPhoneId}
                        onChange={(e) => setWhatsappPhoneId(e.target.value)}
                        placeholder="Ej: 104523678912345"
                        className="h-11 rounded-xl font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token Permanente</Label>
                      <Input
                        type="password"
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                        placeholder="EAAI..."
                        className="h-11 rounded-xl font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Asegúrate de generar un token permanente asociado a un usuario del sistema, no un token temporal de 24 horas.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <Button
                      onClick={saveWhatsAppChannel}
                      disabled={savingChannel || (!whatsappPhoneId.trim() && !whatsappToken.trim() && !channelId)}
                      className="rounded-full px-6 gap-2"
                    >
                      {savingChannel ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : savedChannel ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Conexión Guardada
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                    {channelId && whatsappPhoneId && whatsappToken && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Canal Activo
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Calls Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card className="shadow-apple-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Historial de Llamadas Telefónicas
              </CardTitle>
              <CardDescription>
                Escucha las grabaciones y lee las transcripciones de las llamadas atendidas por la IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canUseVoice(plan) ? (
                <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border/50 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Agentes Telefónicos Bloqueados</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Mejora al Plan Pro para desplegar Agentes de Voz capaces de atender llamadas telefónicas en tiempo real.
                  </p>
                  <Button onClick={() => router.push('/dashboard/settings')} className="rounded-full px-6">
                    Mejorar al Plan Pro
                  </Button>
                </div>
              ) : voiceCalls.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border/50">
                  <p className="text-muted-foreground text-sm">No hay llamadas registradas aún.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {voiceCalls.map((call) => {
                    const message = call.messages?.[0]
                    const recordingUrl = message?.metadata?.recordingUrl
                    const content = message?.content

                    return (
                      <div key={call.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{call.customer_identifier}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(call.created_at).toLocaleString('es-ES')}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-background">Completada</Badge>
                        </div>
                        
                        {recordingUrl && (
                          <div className="pt-2">
                            <audio controls src={recordingUrl} className="w-full h-10" />
                          </div>
                        )}
                        
                        {content && (
                          <div className="pt-2">
                            <details className="text-sm">
                              <summary className="font-medium cursor-pointer text-blue-500 hover:text-blue-600 transition-colors">
                                Ver transcripción completa
                              </summary>
                              <div className="mt-2 p-3 bg-muted/30 rounded-lg text-muted-foreground whitespace-pre-wrap text-xs font-mono">
                                {content}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
