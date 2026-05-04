import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    const { priceId, companyId } = await request.json()

    if (!priceId || !companyId) {
      return new NextResponse('Missing priceId or companyId', { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify company belongs to user
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return new NextResponse('Company not found', { status: 404 })
    }

    let customerId = company.stripe_customer_id

    // If no Stripe customer exists, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          companyId: company.id,
          userId: user.id,
        },
      })
      
      customerId = customer.id
      
      // We don't save the customer_id yet, we will save it on webhook confirmation.
      // Or we can save it now. Let's rely on webhook for cleaner architecture,
      // but passing client_reference_id is better.
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?canceled=true`,
      client_reference_id: company.id,
      metadata: {
        companyId: company.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
