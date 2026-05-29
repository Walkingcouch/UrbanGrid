'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Database } from '@/types/database'

type Job = Database['public']['Tables']['jobs']['Row']

export default function JobDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [coverNote, setCoverNote] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingBid, setExistingBid] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: jobData }, { data: bid }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('job_bids').select('id').eq('job_id', id).eq('contractor_id', user?.id ?? '').maybeSingle(),
      ])
      setJob(jobData)
      setExistingBid(!!bid)
    }
    load()
  }, [id])

  async function handleBid(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('job_bids').insert({
      job_id: id,
      contractor_id: user.id,
      bid_amount: parseFloat(bidAmount),
      cover_note: coverNote || null,
      estimated_days: estimatedDays ? parseInt(estimatedDays) : null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/contractor/dashboard'), 2000)
  }

  if (!job) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription className="mt-1 capitalize">{job.job_type.replace(/_/g, ' ')}</CardDescription>
              </div>
              <Badge>{job.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">{job.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {job.budget_min && job.budget_max && (
                <>
                  <span className="text-slate-500">Budget Range</span>
                  <span className="font-medium">{formatCurrency(Number(job.budget_min))} – {formatCurrency(Number(job.budget_max))}</span>
                </>
              )}
              {job.scheduled_date && (
                <>
                  <span className="text-slate-500">Scheduled</span>
                  <span className="font-medium">{formatDate(job.scheduled_date)}</span>
                </>
              )}
              <span className="text-slate-500">Posted</span>
              <span>{formatDate(job.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {success ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center text-emerald-800">
            <p className="font-semibold text-lg">Bid submitted!</p>
            <p className="text-sm mt-1">Redirecting to your dashboard…</p>
          </div>
        ) : existingBid ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-center text-amber-800">
            <p className="font-semibold">You have already submitted a bid for this job.</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Bid</CardTitle>
              <CardDescription>Your bid is visible to the admin once submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBid} className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Bid Amount (AUD) *</Label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={job.budget_min ? `e.g. ${job.budget_min}` : 'e.g. 5000'}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Completion (days)</Label>
                  <Input type="number" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)} placeholder="e.g. 5" min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Cover Note</Label>
                  <Textarea
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    placeholder="Describe your experience, approach, and why you're the right contractor for this job…"
                    rows={4}
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={loading}>
                    {loading ? 'Submitting…' : 'Submit Bid'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
