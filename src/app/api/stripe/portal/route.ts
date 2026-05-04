import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json()

    if (!companyId) {
      return new NextResponse('Missing companyId', { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, stripe_customer_id')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single()

    if (!company || !company.stripe_customer_id) {
      return new NextResponse('Customer not found', { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
