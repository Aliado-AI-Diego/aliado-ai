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
import { ThumbsUp, ThumbsDown, Send, Pause, Play, TerminalSquare, AlertTriangle } from 'lucide-react'

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
    <div className="grid grid-cols-[300px_1fr] h-[calc(100vh-8rem)] w-full border border-border bg-card shadow-brutalist font-mono overflow-hidden">
      
      {/* Left Panel: Conversation List */}
      <div className="border-r border-border flex flex-col bg-card h-full overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <TerminalSquare className="w-4 h-4" /> INBOX_LOG
          </h2>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
            <div className="flex flex-col">
              <span className="text-muted-foreground">ACTIVE_THREADS</span>
              <span className="text-primary text-sm">{conversations.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-muted-foreground">HALTED_THREADS</span>
              <span className="text-destructive text-sm">{conversations.filter(c => c.status === 'escalated').length}</span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground uppercase">
              NO_LOGS_AVAILABLE
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 border-b border-border transition-none uppercase
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="truncate pr-2 text-xs tracking-wider">
                        {conv.customer_identifier || 'ANON_USER'}
                      </span>
                      <span className="text-[9px] whitespace-nowrap opacity-70">
                        {format(new Date(conv.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1 py-0.5 border ${isSelected ? 'border-primary-foreground' : 'border-border'}`}>
                        {conv.channel}
                      </span>
                      {conv.status === 'escalated' && (
                        <span className="text-[9px] px-1 py-0.5 bg-destructive text-destructive-foreground font-bold">
                          HALTED
                        </span>
                      )}
                      {conv.is_test && (
                        <span className="text-[9px] px-1 py-0.5 border border-dashed">TEST</span>
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
      <div className="flex flex-col bg-background h-full overflow-hidden relative">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-bold">
                <span className="text-primary">TARGET:</span> 
                <span>{selectedConv.customer_identifier || 'ANON_USER'}</span>
                <span className="text-muted-foreground mx-2">|</span>
                <span className="text-muted-foreground">AGENT:</span>
                <span>{agents.find(a => a.id === selectedConv.agent_id)?.agent_name || 'UNKNOWN'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={statusUpdating}
                  className={`uppercase tracking-widest text-[10px] font-bold h-8 rounded-none border-2 transition-none
                    ${isPaused 
                      ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"}
                  `}
                >
                  {isPaused ? <Play className="w-3 h-3 mr-2" /> : <Pause className="w-3 h-3 mr-2" />}
                  {isPaused ? "RESUME_AUTO" : "HALT_SYSTEM"}
                </Button>
              </div>
            </div>

            {/* Chat Messages (Terminal Log Style) */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-2 bg-grid-matrix text-xs"
            >
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full text-primary uppercase animate-pulse">
                  &gt; Fetching_logs...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground uppercase">
                  &gt; No_data_found_in_buffer
                </div>
              ) : (
                messages.map((msg, idx) => {
                  if (msg.role === 'system') return null;
                  const isUser = msg.role === 'user';
                  const isHumanAgent = msg.metadata?.is_human === true;
                  
                  return (
                    <div key={msg.id || idx} className="flex flex-col mb-4 group font-mono">
                      <div className="flex items-center gap-2 mb-1 opacity-70">
                        <span className="text-[10px]">[{format(new Date(msg.created_at), "HH:mm:ss")}]</span>
                        <span className={`text-[10px] font-bold ${
                          isUser ? 'text-muted-foreground' : isHumanAgent ? 'text-blue-500' : 'text-primary'
                        }`}>
                          &lt;{isUser ? 'USER' : isHumanAgent ? 'SYS_ADMIN' : 'AI_NODE'}&gt;
                        </span>
                      </div>
                      <div className={`pl-4 py-1 border-l-2 ${
                        isUser ? 'border-muted-foreground text-foreground' : 
                        isHumanAgent ? 'border-blue-500 text-blue-500' : 
                        'border-primary text-primary'
                      }`}>
                        {msg.content}
                      </div>
                      
                      {/* Feedback UI for AI logs */}
                      {!isUser && !isHumanAgent && (
                        <div className="flex items-center gap-2 mt-1 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`p-0.5 hover:bg-muted ${msg.metadata?.feedback === 'up' ? 'text-green-500' : 'text-muted-foreground'}`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`p-0.5 hover:bg-muted ${msg.metadata?.feedback === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Area */}
            <div className={`p-4 border-t-2 ${isPaused ? 'border-destructive bg-destructive/5' : 'border-border bg-card'}`}>
              {isPaused ? (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-destructive font-bold">&gt;</span>
                    <Input 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="MANUAL_OVERRIDE_INPUT..." 
                      className="w-full pl-8 rounded-none border-destructive focus-visible:ring-0 focus-visible:border-destructive bg-background font-mono text-xs uppercase"
                      disabled={isSending}
                    />
                  </div>
                  <Button type="submit" disabled={!replyText.trim() || isSending} className="rounded-none font-bold uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    EXECUTE
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-3 p-3 text-xs text-primary border border-primary/30 bg-primary/5 font-bold uppercase tracking-widest">
                  <span className="animate-pulse">_</span>
                  AI_NODE_IS_HANDLING_STREAM. HALT_SYSTEM_TO_INTERVENE.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-grid-matrix font-mono uppercase tracking-widest">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">NO_TARGET_SELECTED</h3>
            <p className="text-xs">
              &gt; Please_select_a_thread_from_the_left_panel_to_inspect_logs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
