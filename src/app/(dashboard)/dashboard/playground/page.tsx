'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Bot, User, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import type { Agent } from '@/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function PlaygroundPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    }>
      <PlaygroundPage />
    </Suspense>
  )
}

function PlaygroundPage() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState(searchParams.get('agent') || '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText])

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  async function loadAgents() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)

    if (companies && companies.length > 0) {
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('company_id', companies[0].id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setAgents(agentsData || [])
      if (!selectedAgentId && agentsData && agentsData.length > 0) {
        setSelectedAgentId(agentsData[0].id)
      }
    }
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || !selectedAgentId || sending) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setSending(true)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setStreamingText('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          conversation_id: conversationId,
          message: userMessage,
        }),
      })

      if (!response.ok) throw new Error('Error en la respuesta')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.conversation_id) {
                setConversationId(data.conversation_id)
              }
              if (data.text) {
                fullText += data.text
                setStreamingText(fullText)
              }
              if (data.done) {
                setMessages(prev => [...prev, { role: 'assistant', content: fullText }])
                setStreamingText('')
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.' 
      }])
      setStreamingText('')
    }

    setSending(false)
  }

  function resetChat() {
    setMessages([])
    setConversationId(null)
    setStreamingText('')
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const markdownComponents = {
    strong: ({ node, ...props }: any) => <strong className="font-semibold" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 my-1.5 space-y-0.5" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5" {...props} />,
    li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
    h1: ({ node, ...props }: any) => <h1 className="text-base font-bold my-1.5" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-sm font-bold my-1.5" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-[13px] font-bold my-1.5" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-1.5 last:mb-0" {...props} />,
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-5.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-heading font-bold tracking-tight">Simulador</h1>
          <p className="text-[12px] text-muted-foreground">
            Prueba tu agente antes de publicarlo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAgentId} onValueChange={(val) => {
            if (val) setSelectedAgentId(val)
            resetChat()
          }}>
            <SelectTrigger className="w-44 h-8 text-[12px]">
              <SelectValue placeholder="Selecciona agente" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.agent_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={resetChat}
            className="h-8 w-8"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {agents.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center shadow-command border-border">
          <div className="text-center">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-[13px]">
              Crea un agente primero para probarlo aquí.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Chat Area */}
          <Card className="flex-1 flex flex-col shadow-command border-border overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 && !streamingText && (
                <div className="flex-1 flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-10 h-10 bg-muted flex items-center justify-center mb-3">
                    <Bot className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5">
                    {selectedAgent?.agent_name || 'Agente'}
                  </h3>
                  <p className="text-[12px] text-muted-foreground max-w-sm">
                    Escribe un mensaje para probar cómo responde tu agente.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] lg:max-w-[70%] px-3 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-muted/70 border border-border'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingText && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-[80%] lg:max-w-[70%] px-3 py-2.5 bg-muted/70 border border-border text-[13px] leading-relaxed">
                    <ReactMarkdown components={markdownComponents}>
                      {streamingText}
                    </ReactMarkdown>
                    <span className="inline-block w-1 h-3.5 bg-foreground/50 animate-pulse mt-0.5 ml-0.5" />
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {sending && !streamingText && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-3 py-2.5 bg-muted/70 border border-border">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={sending || !selectedAgentId}
                  className="h-9 flex-1 text-[13px]"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !inputValue.trim() || !selectedAgentId}
                  className="h-9 w-9"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
