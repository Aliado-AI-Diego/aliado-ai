'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  getConversationMessages, 
  sendHumanMessage, 
  toggleConversationStatus,
  submitMessageFeedback
} from '@/app/(dashboard)/dashboard/chats/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThumbsUp, ThumbsDown, Send, User, Bot, AlertCircle, Info, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Conversation = {
  id: string
  agent_id: string
  channel: string
  customer_identifier: string | null
  status: 'active' | 'resolved' | 'escalated'
  created_at: string
  closed_at: string | null
  is_test: boolean
}

type Agent = {
  id: string
  agent_name: string
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata: Record<string, any>
}

export function InboxClient({ 
  initialConversations,
  agents 
}: { 
  initialConversations: Conversation[]
  agents: Agent[] 
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(
    initialConversations.length > 0 ? initialConversations[0] : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch messages
  useEffect(() => {
    if (!selectedConv) return

    let isMounted = true
    setIsLoadingMessages(true)
    
    getConversationMessages(selectedConv.id)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs || [])
          setIsLoadingMessages(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) setIsLoadingMessages(false)
      })

    return () => { isMounted = false }
  }, [selectedConv?.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedConv) return

    setIsSending(true)
    try {
      const newMsg = await sendHumanMessage(selectedConv.id, replyText)
      if (newMsg) {
        setMessages(prev => [...prev, newMsg as Message])
      }
      setReplyText('')
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleTogglePause = async () => {
    if (!selectedConv) return
    setStatusUpdating(true)
    try {
      const newStatus = await toggleConversationStatus(selectedConv.id, selectedConv.status)
      const updatedConv = { ...selectedConv, status: newStatus as any }
      setSelectedConv(updatedConv)
      setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c))
    } catch (error) {
      console.error("Error al pausar:", error)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleFeedback = async (messageId: string, type: 'up' | 'down') => {
    try {
      await submitMessageFeedback(messageId, type)
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, metadata: { ...m.metadata, feedback: type } }
        }
        return m
      }))
    } catch (error) {
      console.error("Error al enviar feedback", error)
    }
  }

  const isPaused = selectedConv?.status === 'escalated'

  if (!isMounted) return null

  return (
    <Card className="grid grid-cols-[300px_1fr] h-[calc(100vh-8rem)] w-full border-border/60 shadow-executive overflow-hidden bg-background">
      
      {/* Left Panel: Conversation List */}
      <div className="border-r border-border/60 flex flex-col bg-muted/30 h-full overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-background">
          <h2 className="font-semibold text-sm mb-3">Hilos de Conversación</h2>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activos</span>
              <span className="font-semibold text-primary">{conversations.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Requieren Atención</span>
              <span className="font-semibold text-orange-500">{conversations.filter(c => c.status === 'escalated').length}</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay conversaciones disponibles.
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 border-b border-border/40 transition-colors
                      ${isSelected 
                        ? 'bg-background shadow-[inset_3px_0_0_0_var(--color-primary)]' 
                        : 'hover:bg-background/50 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-sm font-medium truncate pr-2 ${isSelected ? 'text-foreground' : ''}`}>
                        {conv.customer_identifier || 'Cliente Anónimo'}
                      </span>
                      <span className="text-[10px] whitespace-nowrap opacity-70">
                        {format(new Date(conv.created_at), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-normal h-4 py-0 px-1.5">
                        {conv.channel}
                      </Badge>
                      {conv.status === 'escalated' && (
                        <Badge variant="secondary" className="text-[10px] font-medium h-4 py-0 px-1.5 bg-orange-500/10 text-orange-600 border-orange-200">
                          Atención
                        </Badge>
                      )}
                      {conv.is_test && (
                        <Badge variant="secondary" className="text-[10px] font-normal h-4 py-0 px-1.5">Test</Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel: Chat Viewer (Threaded Document) */}
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="h-16 px-6 border-b border-border/60 flex items-center justify-between bg-card shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border/60">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{selectedConv.customer_identifier || 'Cliente Anónimo'}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Agente asignado: <span className="font-medium text-foreground">{agents.find(a => a.id === selectedConv.agent_id)?.agent_name || 'Desconocido'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isPaused ? (
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200 font-medium px-2 py-1">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Control Humano Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 font-medium px-2 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> IA Operando
                  </Badge>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={statusUpdating}
                  className="shadow-sm"
                >
                  {isPaused ? "Reanudar IA" : "Asumir Control Manual"}
                </Button>
              </div>
            </div>

            {/* Document Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-muted/10 p-6"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No hay mensajes en este hilo.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    if (msg.role === 'system') return null;
                    const isUser = msg.role === 'user';
                    const isHumanAgent = msg.metadata?.is_human === true;
                    
                    return (
                      <div key={msg.id || idx} className="bg-card border border-border/60 rounded-md shadow-sm overflow-hidden">
                        {/* Header del Mensaje */}
                        <div className={`px-4 py-2 border-b border-border/40 flex items-center justify-between text-xs
                          ${isUser ? 'bg-muted/30' : 'bg-primary/5'}
                        `}>
                          <div className="flex items-center gap-2 font-medium">
                            {isUser ? (
                              <><User className="w-3.5 h-3.5 text-muted-foreground" /> Cliente</>
                            ) : isHumanAgent ? (
                              <><User className="w-3.5 h-3.5 text-blue-500" /> Soporte (Tú)</>
                            ) : (
                              <><Bot className="w-3.5 h-3.5 text-primary" /> Aliado AI</>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {!isUser && !isHumanAgent && (
                              <div className="flex items-center gap-1 border-l border-border/60 pl-3">
                                <button onClick={() => handleFeedback(msg.id, 'up')} className={`hover:text-green-500 ${msg.metadata?.feedback === 'up' ? 'text-green-500' : ''}`}>
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleFeedback(msg.id, 'down')} className={`hover:text-red-500 ${msg.metadata?.feedback === 'down' ? 'text-red-500' : ''}`}>
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Contenido del Mensaje */}
                        <div className="p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/60 bg-card z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              {isPaused ? (
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex flex-col gap-3">
                  <div className="text-xs font-medium text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Modo de respuesta manual activado. El cliente está esperando tu respuesta.
                  </div>
                  <div className="flex gap-3">
                    <Input 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta oficial aquí..." 
                      className="flex-1 shadow-sm border-border/60"
                      disabled={isSending}
                    />
                    <Button type="submit" disabled={!replyText.trim() || isSending} className="shadow-sm">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Respuesta
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground bg-muted/30 border border-border/60 rounded-md">
                  <Info className="w-4 h-4" />
                  La Inteligencia Artificial está gestionando este hilo. Asume el control manual si necesitas intervenir.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-card border border-border/60 flex items-center justify-center mb-4 shadow-sm">
              <Info className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Ningún hilo seleccionado</h3>
            <p className="text-sm max-w-[300px]">
              Selecciona una conversación del panel izquierdo para ver el historial o intervenir.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
