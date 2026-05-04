-- Aliado AI - Database Schema Migration
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. Enable required extensions
-- ============================================
create extension if not exists "vector" with schema "extensions";

-- ============================================
-- 2. Create tables
-- ============================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  subscription_tier text not null default 'standard' check (subscription_tier in ('free', 'standard', 'enterprise')),
  monthly_conversation_limit integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  industry text,
  website_url text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Agents
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  agent_name text not null,
  system_prompt text not null default '',
  tone text not null default 'profesional' check (tone in ('formal', 'empatico', 'persuasivo', 'profesional', 'amigable', 'custom')),
  model_used text not null default 'gemini-2.5-flash',
  is_active boolean not null default true,
  widget_config jsonb not null default '{"primaryColor": "#000000", "position": "bottom-right", "greeting": "¡Hola! ¿En qué puedo ayudarte?"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Knowledge Chunks (for RAG)
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade not null,
  source_name text not null,
  chunk_text text not null,
  embedding vector(768),
  source_type text not null default 'text' check (source_type in ('text', 'pdf', 'csv', 'docx', 'url')),
  chunk_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- Agent Channels (for deployment - Phase 2 Meta integration)
create table public.agent_channels (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade not null,
  channel_type text not null check (channel_type in ('web_widget', 'whatsapp', 'facebook', 'instagram')),
  channel_config jsonb not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade not null,
  channel text not null default 'testing' check (channel in ('web_widget', 'whatsapp', 'facebook', 'instagram', 'testing')),
  customer_identifier text,
  status text not null default 'active' check (status in ('active', 'resolved', 'escalated')),
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Insights
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  category text not null default 'trend' check (category in ('trend', 'complaint', 'opportunity', 'metric')),
  insight_summary text not null,
  actionable_advice text,
  confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
  generation_type text not null default 'on_demand' check (generation_type in ('daily', 'on_demand')),
  generated_at timestamptz not null default now()
);

-- ============================================
-- 3. Create indexes
-- ============================================

-- Foreign key indexes for performance
create index idx_companies_user_id on public.companies(user_id);
create index idx_agents_company_id on public.agents(company_id);
create index idx_knowledge_chunks_agent_id on public.knowledge_chunks(agent_id);
create index idx_agent_channels_agent_id on public.agent_channels(agent_id);
create index idx_conversations_agent_id on public.conversations(agent_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_insights_company_id on public.insights(company_id);

-- Vector similarity search index (using HNSW for fast approximate search)
create index idx_knowledge_chunks_embedding on public.knowledge_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Useful query indexes
create index idx_conversations_created_at on public.conversations(created_at desc);
create index idx_messages_created_at on public.messages(created_at);
create index idx_insights_generated_at on public.insights(generated_at desc);
create index idx_conversations_status on public.conversations(status);

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.agents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.agent_channels enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.insights enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Companies: users can CRUD their own companies
create policy "Users can view own companies"
  on public.companies for select
  using (user_id = auth.uid());

create policy "Users can create companies"
  on public.companies for insert
  with check (user_id = auth.uid());

create policy "Users can update own companies"
  on public.companies for update
  using (user_id = auth.uid());

create policy "Users can delete own companies"
  on public.companies for delete
  using (user_id = auth.uid());

-- Agents: users can CRUD agents belonging to their companies
create policy "Users can view own agents"
  on public.agents for select
  using (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Users can create agents"
  on public.agents for insert
  with check (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Users can update own agents"
  on public.agents for update
  using (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Users can delete own agents"
  on public.agents for delete
  using (company_id in (select id from public.companies where user_id = auth.uid()));

-- Knowledge Chunks: users can manage knowledge for their agents
create policy "Users can view own knowledge"
  on public.knowledge_chunks for select
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can create knowledge"
  on public.knowledge_chunks for insert
  with check (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can delete own knowledge"
  on public.knowledge_chunks for delete
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

-- Agent Channels: users can manage channels for their agents
create policy "Users can view own channels"
  on public.agent_channels for select
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can create channels"
  on public.agent_channels for insert
  with check (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can update own channels"
  on public.agent_channels for update
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can delete own channels"
  on public.agent_channels for delete
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

-- Conversations: users can view conversations of their agents
create policy "Users can view own conversations"
  on public.conversations for select
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can create conversations"
  on public.conversations for insert
  with check (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can update own conversations"
  on public.conversations for update
  using (agent_id in (
    select a.id from public.agents a
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

-- Messages: users can view/create messages in their conversations
create policy "Users can view own messages"
  on public.messages for select
  using (conversation_id in (
    select conv.id from public.conversations conv
    join public.agents a on conv.agent_id = a.id
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

create policy "Users can create messages"
  on public.messages for insert
  with check (conversation_id in (
    select conv.id from public.conversations conv
    join public.agents a on conv.agent_id = a.id
    join public.companies c on a.company_id = c.id
    where c.user_id = auth.uid()
  ));

-- Insights: users can view/manage insights for their companies
create policy "Users can view own insights"
  on public.insights for select
  using (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Users can create insights"
  on public.insights for insert
  with check (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Users can delete own insights"
  on public.insights for delete
  using (company_id in (select id from public.companies where user_id = auth.uid()));

-- ============================================
-- 5. Public access policies for widget/API
-- ============================================

-- Allow anonymous users to create conversations via widget
create policy "Public can create widget conversations"
  on public.conversations for insert
  with check (channel = 'web_widget' and is_test = false);

-- Allow anonymous users to insert messages into widget conversations
create policy "Public can create widget messages"
  on public.messages for insert
  with check (conversation_id in (
    select id from public.conversations where channel = 'web_widget'
  ));

-- Allow anonymous users to read messages in their widget conversation
create policy "Public can read widget messages"
  on public.messages for select
  using (conversation_id in (
    select id from public.conversations where channel = 'web_widget'
  ));

-- ============================================
-- 6. Functions and Triggers
-- ============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_agents_updated_at
  before update on public.agents
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- 7. Storage bucket for knowledge base files
-- ============================================
insert into storage.buckets (id, name, public) 
values ('knowledge-files', 'knowledge-files', false);

-- Storage RLS: users can upload files for their agents
create policy "Users can upload knowledge files"
  on storage.objects for insert
  with check (
    bucket_id = 'knowledge-files' 
    and auth.role() = 'authenticated'
  );

create policy "Users can view own knowledge files"
  on storage.objects for select
  using (
    bucket_id = 'knowledge-files' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own knowledge files"
  on storage.objects for delete
  using (
    bucket_id = 'knowledge-files' 
    and auth.role() = 'authenticated'
  );
