import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatKwh, formatDate } from '@/lib/utils'

export default async function TenantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'tenant') redirect(`/${profile?.role}/dashboard`)

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, properties(*)')
    .eq('tenant_id', user.id)
    .eq('status', 'active')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('payer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Simulated energy data — in production this comes from smart meter API / Supabase edge function
  const solarKwhMonth = 4200
  const gridKwhMonth = 1800
  const totalKwh = solarKwhMonth + gridKwhMonth
  const solarPct = Math.round((solarKwhMonth / totalKwh) * 100)
  const retailRate = 0.28
  const ppaRate = contracts?.[0] ? Number(contracts[0].ppa_rate_per_kwh ?? 0.15) : 0.15
  const monthlySavings = solarKwhMonth * (retailRate - ppaRate)
  const annualSavings = monthlySavings * 12

  const activeContract = contracts?.[0]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">UrbanGrid Solar</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{profile?.full_name ?? profile?.email}</span>
          <Badge variant="outline">Tenant</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Energy Dashboard</h1>
          <p className="text-slate-500 mt-1">Your solar energy usage and financial savings</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Solar This Month" value={formatKwh(solarKwhMonth)} subtitle={`${solarPct}% of total usage`} icon="☀️" color="emerald" />
          <KpiCard title="Grid This Month" value={formatKwh(gridKwhMonth)} subtitle={`${100 - solarPct}% from grid`} icon="⚡" color="slate" />
          <KpiCard title="Monthly Savings" value={formatCurrency(monthlySavings)} subtitle="vs. full retail tariff" icon="💰" color="blue" />
          <KpiCard title="Annual Savings" value={formatCurrency(annualSavings)} subtitle="Projected full year" icon="📈" color="purple" />
        </div>

        {/* Energy Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Mix — This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700 font-medium">Solar ({solarPct}%)</span>
                <span>{formatKwh(solarKwhMonth)}</span>
              </div>
              <Progress value={solarPct} className="h-3 bg-slate-100 [&>div]:bg-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Grid ({100 - solarPct}%)</span>
                <span>{formatKwh(gridKwhMonth)}</span>
              </div>
              <Progress value={100 - solarPct} className="h-3 bg-slate-100 [&>div]:bg-slate-400" />
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
              <span>Your PPA rate: <strong>{ppaRate} ¢/kWh</strong> vs retail <strong>{retailRate} ¢/kWh</strong></span>
              <span className="font-bold">Saving {formatCurrency(monthlySavings)}/mo</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Contract */}
        {activeContract && (
          <Card>
            <CardHeader>
              <CardTitle>Your Solar Agreement</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <ContractDetail label="Contract Type" value={activeContract.contract_type.replace('_', ' ').toUpperCase()} />
              <ContractDetail label="PPA Rate" value={`${activeContract.ppa_rate_per_kwh ?? '—'} AUD/kWh`} />
              <ContractDetail label="Monthly Rent" value={formatCurrency(Number(activeContract.monthly_rent_rate))} />
              <ContractDetail label="Term" value={`${activeContract.term_years} years`} />
              {activeContract.start_date && <ContractDetail label="Start" value={formatDate(activeContract.start_date)} />}
              {activeContract.end_date && <ContractDetail label="Expiry" value={formatDate(activeContract.end_date)} />}
              <ContractDetail label="Annual Escalation" value={`${activeContract.annual_escalation_pct}%`} />
              <ContractDetail label="Status" value={activeContract.status.replace(/_/g, ' ')} />
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {transactions && transactions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Payment History</h2>
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Date', 'Period', 'Amount', 'Status', 'Escrow ID'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {t.period_start && t.period_end
                          ? `${formatDate(t.period_start)} – ${formatDate(t.period_end)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(t.gross_amount))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{t.zai_escrow_id ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    slate: 'text-slate-700',
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-1">
          <span>{icon}</span>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
        <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function ContractDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    disbursed: 'bg-emerald-100 text-emerald-800',
    in_escrow: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
    refunded: 'bg-red-100 text-red-800',
    disputed: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
