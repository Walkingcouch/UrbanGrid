import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatKw, formatDate } from '@/lib/utils'

export default async function AdminVppDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  const [
    { data: assets },
    { data: properties },
    { data: contracts },
    { data: jobs },
    { data: transactions },
    { count: userCount },
  ] = await Promise.all([
    supabase.from('solar_assets').select('*').eq('is_active', true),
    supabase.from('properties').select('*'),
    supabase.from('contracts').select('*').eq('status', 'active'),
    supabase.from('jobs').select('*').in('status', ['open', 'bidding', 'in_progress']).order('created_at', { ascending: false }).limit(8),
    supabase.from('transactions').select('*').in('status', ['in_escrow', 'pending']).order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const totalCapacityKw = assets?.reduce((sum, a) => sum + Number(a.capacity_kw), 0) ?? 0
  const totalOutputKwh30 = assets?.reduce((sum, a) => sum + Number(a.output_kwh_last30 ?? 0), 0) ?? 0
  const escrowHeld = transactions?.reduce((sum, t) => sum + Number(t.gross_amount), 0) ?? 0

  const panelCount = assets?.filter(a => a.asset_type === 'panel').length ?? 0
  const inverterCount = assets?.filter(a => a.asset_type === 'inverter').length ?? 0
  const batteryCount = assets?.filter(a => a.asset_type === 'battery').length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span className="font-bold text-white">UrbanGrid Solar — Admin VPP</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-600 text-white">Admin</Badge>
          <span className="text-slate-400 text-sm">{profile?.email}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Virtual Power Plant Dashboard</h1>
            <p className="text-slate-500 mt-1">Fleet-wide generation, hardware status, and operations</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/admin/jobs/new">Post Job</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </div>
        </div>

        {/* Fleet KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Fleet Capacity" value={formatKw(totalCapacityKw)} subtitle="Active assets" accent="emerald" />
          <KpiCard title="Output (30d)" value={`${(totalOutputKwh30 / 1000).toFixed(1)} MWh`} subtitle="Last 30 days" accent="blue" />
          <KpiCard title="Active Sites" value={String(properties?.length ?? 0)} subtitle={`${contracts?.length ?? 0} under contract`} accent="purple" />
          <KpiCard title="Escrow Held" value={formatCurrency(escrowHeld)} subtitle="Pending disbursement" accent="amber" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Solar Panels" value={String(panelCount)} subtitle="Active units" accent="emerald" />
          <KpiCard title="Inverters" value={String(inverterCount)} subtitle="Active units" accent="blue" />
          <KpiCard title="Batteries" value={String(batteryCount)} subtitle="Active units" accent="purple" />
          <KpiCard title="Platform Users" value={String(userCount ?? 0)} subtitle="All roles" accent="slate" />
        </div>

        {/* Hardware Status */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Hardware Fleet Status</h2>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Manufacturer', 'Model', 'Type', 'Capacity', 'Output (30d)', 'Condition', 'Installed', 'Next Service'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets?.slice(0, 15).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium">{a.manufacturer}</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.model}</td>
                    <td className="px-4 py-2.5 capitalize">{a.asset_type}</td>
                    <td className="px-4 py-2.5">{formatKw(Number(a.capacity_kw))}</td>
                    <td className="px-4 py-2.5">
                      {a.output_kwh_last30 ? `${Number(a.output_kwh_last30).toFixed(0)} kWh` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <ConditionBadge condition={a.condition} />
                    </td>
                    <td className="px-4 py-2.5">{formatDate(a.install_date)}</td>
                    <td className="px-4 py-2.5">{a.next_service_date ? formatDate(a.next_service_date) : '—'}</td>
                  </tr>
                ))}
                {!assets?.length && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No active hardware assets.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Active Deployment Jobs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Active Deployment Jobs</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/jobs">View All Jobs</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs?.map(j => (
              <Card key={j.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{j.title}</CardTitle>
                    <JobStatusBadge status={j.status} />
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-1">
                  <p className="capitalize">{j.job_type} · {j.scheduled_date ? formatDate(j.scheduled_date) : 'Date TBD'}</p>
                  {j.budget_min && j.budget_max && (
                    <p>Budget: {formatCurrency(Number(j.budget_min))} – {formatCurrency(Number(j.budget_max))}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {!jobs?.length && (
              <div className="col-span-2 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-slate-500 mb-2">No active jobs.</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/jobs/new">Post a Job</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Pending Transactions */}
        {transactions && transactions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Pending Escrow Transactions</h2>
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Date', 'Gross', 'Landlord', 'Admin', 'Contractor', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-2.5 font-medium">{formatCurrency(Number(t.gross_amount))}</td>
                      <td className="px-4 py-2.5 text-emerald-700">{formatCurrency(Number(t.landlord_share))}</td>
                      <td className="px-4 py-2.5 text-blue-700">{formatCurrency(Number(t.admin_share))}</td>
                      <td className="px-4 py-2.5 text-purple-700">{formatCurrency(Number(t.contractor_share))}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={t.status} />
                      </td>
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

function KpiCard({ title, value, subtitle, accent }: { title: string; value: string; subtitle: string; accent: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    amber: 'text-amber-700',
    slate: 'text-slate-700',
  }
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
        <p className={`text-xl font-bold mt-1 ${colors[accent]}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function ConditionBadge({ condition }: { condition: string }) {
  const styles: Record<string, string> = {
    new: 'bg-emerald-100 text-emerald-800',
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-amber-100 text-amber-800',
    poor: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[condition] ?? 'bg-slate-100 text-slate-700'}`}>
      {condition}
    </span>
  )
}

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    bidding: 'bg-purple-100 text-purple-800',
    awarded: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-emerald-100 text-emerald-800',
  }
  return (
    <Badge className={`text-xs capitalize shrink-0 ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_escrow: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
