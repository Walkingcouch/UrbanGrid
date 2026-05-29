import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/payments/escrow/disburse
// Triggers escrow release and split disbursement via Zai
export async function POST(request: Request) {
  try {
    const { transaction_id } = await request.json()

    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: txn, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single()

    if (fetchError || !txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (txn.status !== 'in_escrow') {
      return NextResponse.json({ error: `Cannot disburse — status is '${txn.status}'` }, { status: 409 })
    }

    if (!txn.zai_escrow_id) {
      return NextResponse.json({ error: 'No Zai escrow ID on this transaction' }, { status: 422 })
    }

    // --- Zai API: Release Escrow ---
    const releaseRes = await fetch(`${process.env.ZAI_API_BASE_URL}/escrows/${txn.zai_escrow_id}/release`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
      },
    })

    if (!releaseRes.ok) {
      const zaiError = await releaseRes.json()
      return NextResponse.json({ error: 'Zai escrow release failed', details: zaiError }, { status: 502 })
    }

    // --- Update transaction status ---
    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'disbursed', disbursed_at: new Date().toISOString() })
      .eq('id', transaction_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update transaction status', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ transaction: updated, disbursed: true })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}
