-- Add Stripe billing fields to companies table
ALTER TABLE public.companies
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text,
ADD COLUMN subscription_plan text DEFAULT 'free',
ADD COLUMN subscription_status text DEFAULT 'active';

-- Allow service role to update these fields (already covered by RLS bypassing, but good to ensure RLS for standard users doesn't block read)
-- Users can already view their own companies, so no additional RLS policy is needed for read access.
