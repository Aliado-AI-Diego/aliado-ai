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
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Send, Pause, Play, User, Bot, Clock, AlertCircle, MessageSquare } from 'lucide-react'

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

  // Autoscroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch messages when a conversation is selected
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
      // Update local state
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
      // Optimistic update
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

  if (!isMounted) return null // Previene errores de hidratación

  return (
    <Card className="grid grid-cols-[300px_1fr] h-full w-full border-border/30 overflow-hidden shadow-premium glass relative">
      
      {/* Left Panel: Conversation List */}
      <div className="border-r border-border/30 flex flex-col bg-card/40 h-full overflow-hidden backdrop-blur-sm relative z-10">
        <div className="p-5 border-b border-border/30 bg-card/60 backdrop-blur-md">
          <h2 className="font-heading font-semibold text-xl">Bandeja de Entrada</h2>
          <div className="flex gap-6 mt-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activos</span>
              <span className="font-heading font-bold text-lg text-primary">{conversations.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pausados</span>
              <span className="font-heading font-bold text-lg text-orange-500">{conversations.filter(c => c.status === 'escalated').length}</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay conversaciones todavía.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                const agent = agents.find(a => a.id === conv.agent_id)
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 rounded-xl mb-1 transition-all duration-300 relative overflow-hidden group
                      ${isSelected 
                        ? 'bg-primary/10 shadow-[inset_4px_0_0_0_#2D6EFF]' 
                        : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                      }
                    `}
                  >
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />}
                    <div className="flex justify-between items-start mb-1 relative z-10">
                      <span className={`font-semibold truncate pr-2 text-sm ${isSelected ? 'text-primary' : ''}`}>
                        {conv.customer_identifier || 'Cliente Anónimo'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(conv.created_at), "d MMM, p", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 relative z-10">
                      <Badge variant="outline" className={`text-[10px] py-0 h-4 ${isSelected ? 'border-primary/30 text-primary' : ''}`}>
                        {conv.channel}
                      </Badge>
                      {conv.status === 'escalated' && (
                        <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-orange-500/10 text-orange-600 border-orange-200">
                          Pausado
                        </Badge>
                      )}
                      {conv.is_test && (
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">Test</Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel: Chat Viewer */}
      <div className="flex flex-col bg-background/50 h-full overflow-hidden relative z-10">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">{selectedConv.customer_identifier || 'Cliente Anónimo'}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Agente: <span className="font-medium text-foreground">{agents.find(a => a.id === selectedConv.agent_id)?.agent_name || 'Desconocido'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={isPaused ? "default" : "outline"}
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={statusUpdating}
                  className={isPaused ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                >
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? "Reanudar IA" : "Pausar IA"}
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground text-sm">
                  No hay mensajes en esta conversación.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  if (msg.role === 'system') return null;
                  const isUser = msg.role === 'user';
                  const isHumanAgent = msg.metadata?.is_human === true;
                  
                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!isUser && (
                            <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                              {isHumanAgent ? <User className="w-3.5 h-3.5 text-primary"/> : <Bot className="w-3.5 h-3.5 text-[#00D68F]"/>}
                              {isHumanAgent ? 'Tú (Humano)' : 'Aliado AI'}
                            </span>
                          )}
                          {isUser && (
                            <span className="text-xs font-medium text-muted-foreground ml-auto uppercase tracking-wider">
                              Cliente
                            </span>
                          )}
                        </div>
                        <div 
                          className={`p-3.5 text-sm leading-relaxed ${
                            isUser 
                              ? 'bg-muted border border-border/50 rounded-2xl rounded-tr-sm text-foreground shadow-sm' 
                              : isHumanAgent
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tl-sm shadow-md shadow-primary/20'
                                : 'bg-card border border-border/50 rounded-2xl rounded-tl-sm shadow-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        
                        {/* Message Meta & Feedback (Only for AI messages) */}
                        {!isUser && !isHumanAgent && (
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded hover:bg-muted ${msg.metadata?.feedback === 'up' ? 'text-green-500' : 'text-muted-foreground'}`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded hover:bg-muted ${msg.metadata?.feedback === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {format(new Date(msg.created_at), "p")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-xl relative z-20">
              {isPaused ? (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe un mensaje al cliente..." 
                    className="flex-1 bg-card/50 border-border/50 focus-visible:ring-primary h-11 rounded-xl"
                    disabled={isSending}
                  />
                  <Button type="submit" disabled={!replyText.trim() || isSending} className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-3 p-4 text-sm text-primary bg-primary/5 rounded-xl border border-primary/20 border-dashed relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <Bot className="w-5 h-5 relative z-10 animate-pulse" />
                  <span className="relative z-10 font-medium">La IA está respondiendo automáticamente. Pausa la IA para enviar un mensaje manual.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
            <div className="w-20 h-20 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-6 shadow-premium rotate-3 relative z-10">
              <MessageSquare className="w-10 h-10 text-primary/50 -rotate-3" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2 relative z-10">Ningún chat seleccionado</h3>
            <p className="text-sm max-w-sm relative z-10">
              Selecciona una conversación de la lista de la izquierda para ver el historial y tomar el control.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
