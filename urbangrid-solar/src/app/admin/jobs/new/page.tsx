'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Database, JobType } from '@/types/database'

type PropertySummary = Pick<Database['public']['Tables']['properties']['Row'], 'id' | 'address_line1' | 'suburb' | 'state'>

const JOB_TYPES = [
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'removal', label: 'Removal' },
  { value: 'repair', label: 'Repair' },
]

export default function PostJobPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    job_type: '',
    property_id: '',
    budget_min: '',
    budget_max: '',
    scheduled_date: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('properties').select('id, address_line1, suburb, state')
      setProperties(data ?? [])
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('jobs').insert({
      posted_by: user.id,
      title: form.title,
      description: form.description,
      job_type: form.job_type as JobType,
      property_id: form.property_id || null,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      scheduled_date: form.scheduled_date || null,
      status: 'open',
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/admin/dashboard?job=posted')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Post a Contractor Job</CardTitle>
            <CardDescription>Create a new job ticket for contractors to bid on</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Inverter replacement at Parramatta site" required />
              </div>
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select value={form.job_type} onValueChange={v => set('job_type', v)} required>
                  <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property (optional)</Label>
                <Select value={form.property_id} onValueChange={v => set('property_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Assign to a property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.address_line1}, {p.suburb} {p.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the scope of work, access requirements, equipment involved…"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Budget Min (AUD)</Label>
                  <Input type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="e.g. 3000" min="0" step="100" />
                </div>
                <div className="space-y-2">
                  <Label>Budget Max (AUD)</Label>
                  <Input type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="e.g. 6000" min="0" step="100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={loading}>
                  {loading ? 'Posting…' : 'Post Job'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
