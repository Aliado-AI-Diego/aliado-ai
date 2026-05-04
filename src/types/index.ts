// ============================================
// Database Types for Aliado AI
// ============================================

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'standard' | 'enterprise'
  monthly_conversation_limit: number
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  company_name: string
  industry: string | null
  website_url: string | null
  logo_url: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  stripe_current_period_end?: string | null
  created_at: string
}

export interface Agent {
  id: string
  company_id: string
  agent_name: string
  system_prompt: string
  tone: 'formal' | 'empatico' | 'persuasivo' | 'profesional' | 'amigable' | 'custom'
  model_used: string
  is_active: boolean
  widget_config: WidgetConfig
  created_at: string
  updated_at: string
}

export interface WidgetConfig {
  primaryColor: string
  position: 'bottom-right' | 'bottom-left'
  greeting: string
}

export interface KnowledgeChunk {
  id: string
  agent_id: string
  source_name: string
  chunk_text: string
  embedding: number[] | null
  source_type: 'text' | 'pdf' | 'csv' | 'docx' | 'url'
  chunk_index: number
  created_at: string
}

export interface AgentChannel {
  id: string
  agent_id: string
  channel_type: 'web_widget' | 'whatsapp' | 'facebook' | 'instagram' | 'voice'
  channel_config: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface Conversation {
  id: string
  agent_id: string
  channel: 'web_widget' | 'whatsapp' | 'facebook' | 'instagram' | 'testing' | 'voice'
  customer_identifier: string | null
  status: 'active' | 'resolved' | 'escalated'
  is_test: boolean
  created_at: string
  closed_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface Insight {
  id: string
  company_id: string
  category: 'trend' | 'complaint' | 'opportunity' | 'metric'
  insight_summary: string
  actionable_advice: string | null
  confidence_score: number | null
  generation_type: 'daily' | 'on_demand'
  generated_at: string
}

// ============================================
// API Types
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  agent_id: string
  conversation_id?: string
  message: string
  is_test?: boolean
}

export interface InsightRequest {
  company_id: string
}

// ============================================
// UI Types
// ============================================

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: string
}

export interface MetricCard {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
}
