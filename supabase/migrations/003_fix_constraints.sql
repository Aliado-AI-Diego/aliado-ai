-- Aliado AI - Database Schema Migration 003
-- Fixes missing 'voice' channel type and adds missing Stripe fields

-- 1. Update agent_channels constraint
ALTER TABLE public.agent_channels
DROP CONSTRAINT IF EXISTS agent_channels_channel_type_check;

ALTER TABLE public.agent_channels
ADD CONSTRAINT agent_channels_channel_type_check 
CHECK (channel_type IN ('web_widget', 'whatsapp', 'facebook', 'instagram', 'voice'));

-- 2. Update conversations constraint
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_channel_check;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_channel_check 
CHECK (channel IN ('web_widget', 'whatsapp', 'facebook', 'instagram', 'voice', 'testing'));

-- 3. Add stripe_current_period_end to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz;
