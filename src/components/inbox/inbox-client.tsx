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
import { ThumbsUp, ThumbsDown, Send, User, Bot, AlertCircle, Info, Clock, CheckCircle2, ArrowLeft } from 'lucide-react'
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
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

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

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv)
    setMobileView('chat')
  }

  const handleBackToList = () => {
    setMobileView('list')
  }

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
  const activeCount = conversations.filter(c => c.status === 'active').length
  const escalatedCount = conversations.filter(c => c.status === 'escalated').length

  if (!isMounted) return null

  return (
    <div className="flex h-full w-full overflow-hidden border border-border shadow-command bg-card">
      
      {/* ═══ Left Panel: Conversation List ═══ */}
      <div className={`
        w-full lg:w-80 border-r border-border flex flex-col bg-background h-full overflow-hidden shrink-0
        ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* List Header */}
        <div className="p-3 border-b border-border bg-card shrink-0">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Hilos
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary pulse-live" />
              <span className="text-[11px] font-semibold tabular-nums">{activeCount}</span>
              <span className="text-[10px] text-muted-foreground">activos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-amber-500" />
              <span className="text-[11px] font-semibold tabular-nums">{escalatedCount}</span>
              <span className="text-[10px] text-muted-foreground">requieren atención</span>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              Sin conversaciones.
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors
                      ${isSelected 
                        ? 'bg-card accent-strip shadow-command' 
                        : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[13px] font-medium truncate pr-2 ${isSelected ? 'text-foreground' : ''}`}>
                        {conv.customer_identifier || 'Cliente Anónimo'}
                      </span>
                      <span className="text-[10px] tabular-nums whitespace-nowrap opacity-60">
                        {format(new Date(conv.created_at), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-semibold h-4 py-0 px-1.5 uppercase tracking-wider">
                        {conv.channel}
                      </Badge>
                      {conv.status === 'escalated' && (
                        <Badge variant="secondary" className="text-[9px] font-bold h-4 py-0 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          Atención
                        </Badge>
                      )}
                      {conv.is_test && (
                        <Badge variant="secondary" className="text-[9px] font-semibold h-4 py-0 px-1.5">Test</Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ═══ Right Panel: Chat Viewer ═══ */}
      <div className={`
        flex-1 flex flex-col h-full overflow-hidden bg-background
        ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
      `}>
        {selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="h-13 px-3 lg:px-5 border-b border-border flex items-center justify-between bg-card shrink-0 shadow-command z-10">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={handleBackToList}
                  className="lg:hidden p-1 hover:bg-muted transition-colors mr-1"
                  aria-label="Volver a la lista"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="w-8 h-8 bg-muted flex items-center justify-center border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-[13px]">{selectedConv.customer_identifier || 'Cliente Anónimo'}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Bot className="w-2.5 h-2.5" />
                    <span>{agents.find(a => a.id === selectedConv.agent_id)?.agent_name || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-semibold text-[10px] px-2 py-0.5">
                    <AlertCircle className="w-3 h-3 mr-1" /> Manual
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-semibold text-[10px] px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> IA
                  </Badge>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={statusUpdating}
                  className="shadow-command h-7 text-[11px] font-semibold hidden sm:flex"
                >
                  {isPaused ? "Reanudar IA" : "Control Manual"}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-muted/20 p-3 lg:p-5"
            >
              <div className="max-w-3xl mx-auto space-y-3">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-[13px]">
                    Sin mensajes en este hilo.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    if (msg.role === 'system') return null;
                    const isUser = msg.role === 'user';
                    const isHumanAgent = msg.metadata?.is_human === true;
                    
                    return (
                      <div key={msg.id || idx} className={`bg-card border border-border shadow-command overflow-hidden ${isUser ? '' : isHumanAgent ? 'accent-strip' : ''}`}>
                        {/* Message Header */}
                        <div className={`px-3 py-1.5 border-b border-border/60 flex items-center justify-between text-[10px]
                          ${isUser ? 'bg-muted/30' : isHumanAgent ? 'bg-blue-500/5' : 'bg-primary/5'}
                        `}>
                          <div className="flex items-center gap-1.5 font-semibold">
                            {isUser ? (
                              <><User className="w-3 h-3 text-muted-foreground" /> Cliente</>
                            ) : isHumanAgent ? (
                              <><User className="w-3 h-3 text-blue-500" /> Soporte (Tú)</>
                            ) : (
                              <><Bot className="w-3 h-3 text-primary" /> Aliado AI</>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="flex items-center gap-1 tabular-nums">
                              <Clock className="w-2.5 h-2.5" /> {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {!isUser && !isHumanAgent && (
                              <div className="flex items-center gap-0.5 border-l border-border/60 pl-2">
                                <button 
                                  onClick={() => handleFeedback(msg.id, 'up')} 
                                  className={`p-0.5 hover:text-emerald-500 transition-colors ${msg.metadata?.feedback === 'up' ? 'text-emerald-500' : ''}`}
                                >
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                </button>
                                <button 
                                  onClick={() => handleFeedback(msg.id, 'down')} 
                                  className={`p-0.5 hover:text-red-500 transition-colors ${msg.metadata?.feedback === 'down' ? 'text-red-500' : ''}`}
                                >
                                  <ThumbsDown className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Message Content */}
                        <div className="px-3 py-2.5 text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-card z-10">
              {isPaused ? (
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex flex-col gap-2">
                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Control manual activado
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tu respuesta..." 
                      className="flex-1 shadow-command border-border h-9 text-[13px]"
                      disabled={isSending}
                    />
                    <Button type="submit" disabled={!replyText.trim() || isSending} size="sm" className="shadow-command h-9 text-[12px] font-semibold">
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Enviar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="max-w-3xl mx-auto flex items-center gap-2 p-2.5 text-[12px] text-muted-foreground bg-muted/40 border border-border">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>IA gestionando este hilo. Asume control manual para intervenir.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
            <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Sin hilo seleccionado</h3>
            <p className="text-[12px] max-w-[280px]">
              Selecciona una conversación del panel izquierdo para ver el historial.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
