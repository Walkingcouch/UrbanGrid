import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/affiliates/register
// Register a new affiliate (hardware manufacturer, e.g., Fronius, Sungrow)
export async function POST(request: Request) {
  try {
    const { company_name, brand, commission_pct } = await request.json()

    if (!company_name || !brand) {
      return NextResponse.json({ error: 'company_name and brand are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('affiliates').insert({
      user_id: user.id,
      company_name,
      brand,
      commission_pct: commission_pct ?? 5,
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You are already registered as an affiliate' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ affiliate: data }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}
