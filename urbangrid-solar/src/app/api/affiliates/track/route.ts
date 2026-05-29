import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/affiliates/track
// Track a referral click/signup via affiliate referral code
export async function POST(request: Request) {
  try {
    const { referral_code, email } = await request.json()

    if (!referral_code) {
      return NextResponse.json({ error: 'referral_code required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: affiliate, error: affError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referral_code', referral_code)
      .eq('is_active', true)
      .single()

    if (affError || !affiliate) {
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 404 })
    }

    const { data: lead, error: leadError } = await supabase.from('affiliate_leads').insert({
      affiliate_id: affiliate.id,
      referral_code,
      email: email ?? null,
    }).select().single()

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    // Increment affiliate lead count
    await supabase.rpc('increment_affiliate_leads', { affiliate_id: affiliate.id })

    return NextResponse.json({ lead }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}
