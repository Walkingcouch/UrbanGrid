import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function LandlordDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'landlord') redirect(`/${profile?.role}/dashboard`)

  const [{ data: properties }, { data: contracts }, { data: transactions }] = await Promise.all([
    supabase.from('properties').select('*').eq('landlord_id', user.id),
    supabase.from('contracts').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').eq('payer_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const activeContracts = contracts?.filter(c => c.status === 'active') ?? []
  const monthlyYield = activeContracts.reduce((sum, c) => sum + Number(c.monthly_rent_rate), 0)
  const annualYield = monthlyYield * 12

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
          <Badge variant="outline" className="capitalize">{profile?.role}</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Landlord Dashboard</h1>
          <p className="text-slate-500 mt-1">Your roof rental portfolio at a glance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Monthly Yield"
            value={formatCurrency(monthlyYield)}
            subtitle="From active contracts"
            color="emerald"
          />
          <KpiCard
            title="Annual Yield"
            value={formatCurrency(annualYield)}
            subtitle="Projected (pre-escalation)"
            color="blue"
          />
          <KpiCard
            title="Properties"
            value={String(properties?.length ?? 0)}
            subtitle="In your portfolio"
            color="purple"
          />
          <KpiCard
            title="Active Contracts"
            value={String(activeContracts.length)}
            subtitle={`of ${contracts?.length ?? 0} total`}
            color="amber"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/landlord/onboarding">+ Add Property</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/landlord/contracts/new">Generate Contract</Link>
          </Button>
        </div>

        {/* Properties */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Property Portfolio</h2>
          {!properties?.length ? (
            <EmptyState
              message="No properties yet."
              cta="Add your first property"
              href="/landlord/onboarding"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(p => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.address_line1}</CardTitle>
                    <CardDescription>{p.suburb}, {p.state} {p.postcode}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <Row label="Building" value={p.building_type} />
                    <Row label="Roof Size" value={`${p.roof_size_sqm} m²`} />
                    <Row label="Strata" value={p.strata_status ? 'Yes' : 'No'} />
                    <Row label="Added" value={formatDate(p.created_at)} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Contracts */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Contracts</h2>
          {!contracts?.length ? (
            <EmptyState
              message="No contracts yet."
              cta="Generate a contract"
              href="/landlord/contracts/new"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Type', 'Status', 'Monthly Rent', 'Term', 'Start Date', 'Make-Good Penalty'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 capitalize">{c.contract_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(c.monthly_rent_rate))}</td>
                      <td className="px-4 py-3">{c.term_years} yrs</td>
                      <td className="px-4 py-3">{c.start_date ? formatDate(c.start_date) : '—'}</td>
                      <td className="px-4 py-3 text-amber-700 font-medium">{formatCurrency(Number(c.make_good_penalty_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Payments</h2>
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Date', 'Amount', 'Landlord Share', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-3">{formatCurrency(Number(t.gross_amount))}</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">{formatCurrency(Number(t.landlord_share))}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
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

function KpiCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
      <p className="text-slate-500 mb-3">{message}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-slate-100 text-slate-700',
    pending_signature: 'bg-blue-100 text-blue-800',
    terminated: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-700',
    disbursed: 'bg-emerald-100 text-emerald-800',
    in_escrow: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
