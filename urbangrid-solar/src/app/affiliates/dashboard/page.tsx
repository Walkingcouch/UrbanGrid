'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Database } from '@/types/database'

type Affiliate = Database['public']['Tables']['affiliates']['Row']
type Lead = Database['public']['Tables']['affiliate_leads']['Row']

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [form, setForm] = useState({ company_name: '', brand: '', commission_pct: '5' })
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: aff }, { data: leadData }] = await Promise.all([
        supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('affiliate_leads').select('*').eq('affiliate_id', user.id).order('created_at', { ascending: false }),
      ])

      setAffiliate(aff)
      setLeads(leadData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setRegistering(true)
    const res = await fetch('/api/affiliates/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setRegistering(false); return }
    setAffiliate(data.affiliate)
    setRegistering(false)
  }

  const conversions = leads.filter(l => l.converted).length

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <span className="font-bold text-slate-900">UrbanGrid Solar — Affiliate Portal</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {!affiliate ? (
          <div className="max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Register as an Affiliate Partner</CardTitle>
                <CardDescription>
                  Hardware manufacturers (Fronius, Sungrow, SMA, etc.) can register to track leads and earn commissions from UrbanGrid Solar installations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Fronius International GmbH" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand / Product Line *</Label>
                    <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Fronius Symo" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Rate (%)</Label>
                    <Input type="number" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))} min="0" max="100" step="0.5" />
                    <p className="text-xs text-slate-500">Default 5%. Negotiated rates apply for strategic partners.</p>
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={registering}>
                    {registering ? 'Registering…' : 'Register as Affiliate'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Affiliate Dashboard</h1>
              <p className="text-slate-500 mt-1">{affiliate.company_name} — {affiliate.brand}</p>
            </div>

            {/* Referral Code */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Your Referral Code</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-1 font-mono">{affiliate.referral_code}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Share link: {typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref={affiliate.referral_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-600 text-white">{affiliate.commission_pct}% commission</Badge>
                    <p className="text-xs text-emerald-600 mt-2">
                      {affiliate.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Leads" value={String(affiliate.total_leads)} />
              <KpiCard label="Conversions" value={String(conversions)} />
              <KpiCard label="Conversion Rate" value={affiliate.total_leads > 0 ? `${Math.round((conversions / affiliate.total_leads) * 100)}%` : '—'} />
              <KpiCard label="Total Earned" value={formatCurrency(Number(affiliate.total_earnings))} />
            </div>

            {/* Leads Table */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Lead Tracking</h2>
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {['Date', 'Email', 'Converted', 'Converted At', 'Commission'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map(l => (
                      <tr key={l.id}>
                        <td className="px-4 py-3">{formatDate(l.created_at)}</td>
                        <td className="px-4 py-3 text-slate-600">{l.email ?? '—'}</td>
                        <td className="px-4 py-3">
                          {l.converted
                            ? <Badge className="bg-emerald-100 text-emerald-800">Yes</Badge>
                            : <Badge variant="outline">No</Badge>
                          }
                        </td>
                        <td className="px-4 py-3">{l.converted_at ? formatDate(l.converted_at) : '—'}</td>
                        <td className="px-4 py-3 text-emerald-700 font-medium">
                          {Number(l.commission_earned) > 0 ? formatCurrency(Number(l.commission_earned)) : '—'}
                        </td>
                      </tr>
                    ))}
                    {!leads.length && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No leads yet. Share your referral code to start tracking.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
