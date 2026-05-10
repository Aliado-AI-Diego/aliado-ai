import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { getPlanIdByStripePriceId } from '@/config/pricing'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('Stripe-Signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Webhook Error: Missing signature or secret', { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed.', error.message)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const companyId = session.client_reference_id || session.metadata?.companyId
        
        if (companyId) {
          // Retrieve the subscription to get the price ID to determine the plan
          const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0].price.id
          
          const plan = getPlanIdByStripePriceId(priceId)

          await supabaseAdmin
            .from('companies')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              subscription_plan: plan,
              subscription_status: subscription.status,
              stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', companyId)
            
          console.log(`[Stripe] Company ${companyId} subscribed to ${plan} plan.`)
        }
        break
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        
        // Find company by customer ID
        const { data: companies } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .limit(1)

        if (companies && companies.length > 0) {
          const companyId = companies[0].id
          const status = subscription.status
          
          let plan = 'free'
          if (status === 'active' || status === 'trialing') {
            const priceId = subscription.items.data[0].price.id
            plan = getPlanIdByStripePriceId(priceId)
          }

          await supabaseAdmin
            .from('companies')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_plan: plan,
              subscription_status: status,
              stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', companyId)
            
          console.log(`[Stripe] Company ${companyId} subscription updated to ${status} (${plan}).`)
        }
        break
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Webhook Error', { status: 500 })
  }
}
