import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function ContractorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'contractor') redirect(`/${profile?.role}/dashboard`)

  const [
    { data: openJobs },
    { data: myBids },
    { data: awardedJobs },
  ] = await Promise.all([
    supabase.from('jobs').select('*').in('status', ['open', 'bidding']).order('created_at', { ascending: false }),
    supabase.from('job_bids').select('*, jobs(*)').eq('contractor_id', user.id).order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').eq('awarded_to', user.id).order('created_at', { ascending: false }),
  ])

  const totalEarned = awardedJobs?.filter(j => j.status === 'completed').reduce((sum, j) => sum + Number(j.awarded_amount ?? 0), 0) ?? 0
  const activePipeline = awardedJobs?.filter(j => j.status === 'in_progress')?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">UrbanGrid Solar</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{profile?.full_name ?? profile?.email}</span>
          <Badge variant="outline">Contractor</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractor Portal</h1>
          <p className="text-slate-500 mt-1">Browse and bid on solar installation and maintenance jobs</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Open Jobs" value={String(openJobs?.length ?? 0)} color="blue" />
          <KpiCard title="My Bids" value={String(myBids?.length ?? 0)} color="purple" />
          <KpiCard title="Active Jobs" value={String(activePipeline)} color="emerald" />
          <KpiCard title="Total Earned" value={formatCurrency(totalEarned)} color="amber" />
        </div>

        {/* Job Board */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Available Jobs</h2>
          <div className="space-y-3">
            {openJobs?.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        <Badge variant="outline" className="capitalize text-xs">{job.job_type.replace(/_/g, ' ')}</Badge>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {job.budget_min && job.budget_max && (
                          <span>Budget: {formatCurrency(Number(job.budget_min))} – {formatCurrency(Number(job.budget_max))}</span>
                        )}
                        {job.scheduled_date && <span>Scheduled: {formatDate(job.scheduled_date)}</span>}
                        <span>Posted: {formatDate(job.created_at)}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/contractor/jobs/${job.id}`}>Place Bid</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!openJobs?.length && (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                No open jobs at the moment. Check back soon.
              </div>
            )}
          </div>
        </section>

        {/* My Awarded Jobs */}
        {awardedJobs && awardedJobs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">My Jobs</h2>
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Job', 'Type', 'Status', 'Amount', 'Scheduled'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {awardedJobs.map(j => (
                    <tr key={j.id}>
                      <td className="px-4 py-3 font-medium">{j.title}</td>
                      <td className="px-4 py-3 capitalize">{j.job_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3"><JobStatusBadge status={j.status} /></td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">
                        {j.awarded_amount ? formatCurrency(Number(j.awarded_amount)) : '—'}
                      </td>
                      <td className="px-4 py-3">{j.scheduled_date ? formatDate(j.scheduled_date) : '—'}</td>
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

function KpiCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    amber: 'text-amber-700',
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    bidding: 'bg-purple-100 text-purple-800',
    awarded: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
