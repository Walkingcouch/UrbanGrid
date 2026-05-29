import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface EscrowCreateBody {
  contract_id: string
  gross_amount: number
  landlord_share: number
  admin_share: number
  contractor_share: number
  period_start: string
  period_end: string
  payer_email: string
}

// POST /api/payments/escrow/create
// Creates a Zai payment item and escrow account, records transaction in Supabase
export async function POST(request: Request) {
  try {
    const body: EscrowCreateBody = await request.json()

    if (!body.contract_id || !body.gross_amount || !body.payer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sharesTotal = body.landlord_share + body.admin_share + body.contractor_share
    if (sharesTotal > body.gross_amount) {
      return NextResponse.json({ error: 'Split shares exceed gross amount' }, { status: 400 })
    }

    // --- Zai API: Create Payment Item ---
    const zaiPaymentRes = await fetch(`${process.env.ZAI_API_BASE_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        name: `UrbanGrid Solar — Monthly Payment`,
        amount: Math.round(body.gross_amount * 100), // Zai uses cents
        currency: 'AUD',
        payment_type: 'ESCROW',
        buyer_email: body.payer_email,
        seller_id: process.env.ZAI_ACCOUNT_ID,
        description: `Period: ${body.period_start} to ${body.period_end}`,
      }),
    })

    if (!zaiPaymentRes.ok) {
      const zaiError = await zaiPaymentRes.json()
      return NextResponse.json({ error: 'Zai payment creation failed', details: zaiError }, { status: 502 })
    }

    const zaiPayment = await zaiPaymentRes.json()

    // --- Zai API: Create Escrow Account ---
    const zaiEscrowRes = await fetch(`${process.env.ZAI_API_BASE_URL}/escrows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        payment_id: zaiPayment.items?.id,
        disbursements: [
          { account_id: zaiPayment.items?.seller_id, amount: Math.round(body.landlord_share * 100) },
          { account_id: process.env.ZAI_ACCOUNT_ID, amount: Math.round(body.admin_share * 100) },
        ],
      }),
    })

    const zaiEscrow = zaiEscrowRes.ok ? await zaiEscrowRes.json() : null

    // --- Record transaction in Supabase ---
    const supabase = createAdminClient()
    const { data: contract } = await supabase.from('contracts').select('tenant_id').eq('id', body.contract_id).single()

    const { data: transaction, error: dbError } = await supabase.from('transactions').insert({
      contract_id: body.contract_id,
      payer_id: contract?.tenant_id ?? '',
      status: 'in_escrow',
      gross_amount: body.gross_amount,
      landlord_share: body.landlord_share,
      admin_share: body.admin_share,
      contractor_share: body.contractor_share,
      zai_payment_id: zaiPayment.items?.id ?? null,
      zai_escrow_id: zaiEscrow?.escrows?.id ?? null,
      period_start: body.period_start,
      period_end: body.period_end,
    }).select().single()

    if (dbError) {
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      transaction,
      zai_payment_url: zaiPayment.items?.payment_url,
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}
