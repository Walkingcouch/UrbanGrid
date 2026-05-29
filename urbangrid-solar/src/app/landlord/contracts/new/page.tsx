'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

const TOTAL_STEPS = 4

type ContractForm = {
  property_id: string
  contract_type: 'ppa' | 'roof_lease' | 'combined'
  term_years: string
  monthly_rent_rate: string
  ppa_rate_per_kwh: string
  annual_escalation_pct: string
  make_good_penalty_amount: string
  early_termination_fee: string
  start_date: string
}

const INITIAL: ContractForm = {
  property_id: '',
  contract_type: 'combined',
  term_years: '10',
  monthly_rent_rate: '',
  ppa_rate_per_kwh: '',
  annual_escalation_pct: '3',
  make_good_penalty_amount: '50000',
  early_termination_fee: '',
  start_date: '',
}

export default function NewContractPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ContractForm>(INITIAL)
  const [properties, setProperties] = useState<Property[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient()
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
      setProperties(data ?? [])
    }
    loadProperties()
  }, [])

  function set(field: keyof ContractForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const selectedProperty = properties.find(p => p.id === form.property_id)
  const monthlyRent = parseFloat(form.monthly_rent_rate) || 0
  const annualRent = monthlyRent * 12
  const termYears = parseInt(form.term_years) || 10
  const totalRent = annualRent * termYears
  const makeGoodPenalty = parseFloat(form.make_good_penalty_amount) || 50000
  const earlyTermFee = parseFloat(form.early_termination_fee) || 0

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('contracts').insert({
      property_id: form.property_id,
      landlord_id: user.id,
      contract_type: form.contract_type,
      term_years: termYears,
      monthly_rent_rate: monthlyRent,
      ppa_rate_per_kwh: form.ppa_rate_per_kwh ? parseFloat(form.ppa_rate_per_kwh) : null,
      annual_escalation_pct: parseFloat(form.annual_escalation_pct) || 3,
      make_good_penalty_amount: makeGoodPenalty,
      early_termination_fee: earlyTermFee || null,
      start_date: form.start_date || null,
      status: 'draft',
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/landlord/dashboard?contract=created')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Generate Contract</h1>
          <p className="text-slate-500 mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Contract Type & Property'}
              {step === 2 && 'Financial Terms'}
              {step === 3 && 'Make-Good & Penalty Clauses'}
              {step === 4 && 'Review & Generate'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select the property and the type of agreement to generate.'}
              {step === 2 && 'Define the rent rate, PPA tariff, and escalation terms.'}
              {step === 3 && 'Mandatory penalty clauses protecting the solar asset investment.'}
              {step === 4 && 'Review all terms before generating the draft contract.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Select Property *</Label>
                  <Select value={form.property_id} onValueChange={v => set('property_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address_line1}, {p.suburb} {p.state} — {p.roof_size_sqm}m²
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {properties.length === 0 && (
                    <p className="text-sm text-amber-600">No properties found. <a href="/landlord/onboarding" className="underline">Add a property first.</a></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Contract Type *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['ppa', 'roof_lease', 'combined'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set('contract_type', type)}
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          form.contract_type === type
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-sm capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {type === 'ppa' && 'Tenant pays per kWh consumed'}
                          {type === 'roof_lease' && 'Fixed monthly roof rental'}
                          {type === 'combined' && 'Roof lease + PPA tariff'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Term (years) *</Label>
                  <Select value={form.term_years} onValueChange={v => set('term_years', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 12, 15, 20, 25].map(y => (
                        <SelectItem key={y} value={String(y)}>{y} years{y === 10 ? ' (minimum)' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">10-year minimum term is mandatory per UrbanGrid Solar policy.</p>
                </div>
                <div className="space-y-2">
                  <Label>Commencement Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Monthly Roof Rental Rate (AUD) *</Label>
                  <Input
                    type="number"
                    value={form.monthly_rent_rate}
                    onChange={e => set('monthly_rent_rate', e.target.value)}
                    placeholder="e.g. 2500"
                    min="0"
                    step="0.01"
                    required
                  />
                  {monthlyRent > 0 && (
                    <p className="text-xs text-emerald-700">Annual: {formatCurrency(annualRent)} · {termYears}-yr total: {formatCurrency(totalRent)}</p>
                  )}
                </div>
                {(form.contract_type === 'ppa' || form.contract_type === 'combined') && (
                  <div className="space-y-2">
                    <Label>PPA Rate (AUD/kWh)</Label>
                    <Input
                      type="number"
                      value={form.ppa_rate_per_kwh}
                      onChange={e => set('ppa_rate_per_kwh', e.target.value)}
                      placeholder="e.g. 0.15"
                      min="0"
                      step="0.001"
                    />
                    <p className="text-xs text-slate-500">Tenant pays this rate for solar energy consumed. Typically 20–40% below retail tariff.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Annual Escalation Rate (%)</Label>
                  <Input
                    type="number"
                    value={form.annual_escalation_pct}
                    onChange={e => set('annual_escalation_pct', e.target.value)}
                    placeholder="3"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500">CPI-linked rent escalation applied annually. Typically 3–5%.</p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1">
                  <p className="font-semibold">Mandatory Clause: Change of Ownership / Asset Removal Make-Good Penalty</p>
                  <p>This clause is required by UrbanGrid Solar policy. If the property is sold or the landlord seeks to terminate the lease early and requires removal of the solar assets, the make-good penalty is payable to compensate for decommissioning, transport, and lost revenue.</p>
                </div>
                <div className="space-y-2">
                  <Label>Make-Good Penalty Amount (AUD) *</Label>
                  <Input
                    type="number"
                    value={form.make_good_penalty_amount}
                    onChange={e => set('make_good_penalty_amount', e.target.value)}
                    placeholder="50000"
                    min="0"
                    step="1000"
                    required
                  />
                  <p className="text-xs text-slate-500">Minimum recommended: {formatCurrency(50000)}. Scales with system size.</p>
                </div>
                <div className="space-y-2">
                  <Label>Early Termination Fee (AUD)</Label>
                  <Input
                    type="number"
                    value={form.early_termination_fee}
                    onChange={e => set('early_termination_fee', e.target.value)}
                    placeholder="e.g. 25000"
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-slate-500">Additional fee for terminating the lease before the agreed term expires, separate from make-good.</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-slate-700">
                  <p className="font-medium">Clause Preview — Change of Ownership / Asset Removal Make-Good</p>
                  <div className="rounded-lg bg-slate-100 p-4 text-xs leading-relaxed font-mono">
                    <p>In the event that the Landlord sells, transfers, or otherwise disposes of the Property during the Term, or requires the removal of the Solar Assets for any reason prior to the expiry of the Term, the Landlord shall pay to UrbanGrid Solar Pty Ltd a Make-Good Penalty of <strong>{formatCurrency(makeGoodPenalty)}</strong> (the &quot;Penalty Amount&quot;) within thirty (30) days of the triggering event.</p>
                    <br />
                    <p>The Penalty Amount represents a genuine pre-estimate of loss including, but not limited to: (a) decommissioning and removal costs; (b) transport and storage of the Solar Assets; (c) lost revenue for the remainder of the Term; and (d) administrative costs. This clause survives termination of this Agreement.</p>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <ReviewRow label="Property" value={selectedProperty ? `${selectedProperty.address_line1}, ${selectedProperty.suburb}` : '—'} />
                    <ReviewRow label="Contract Type" value={form.contract_type.replace('_', ' ').toUpperCase()} />
                    <ReviewRow label="Term" value={`${termYears} years`} />
                    <ReviewRow label="Start Date" value={form.start_date || 'TBD'} />
                    <ReviewRow label="Monthly Rent" value={formatCurrency(monthlyRent)} />
                    <ReviewRow label="Annual Rent" value={formatCurrency(annualRent)} />
                    {form.ppa_rate_per_kwh && <ReviewRow label="PPA Rate" value={`${form.ppa_rate_per_kwh} ¢/kWh`} />}
                    <ReviewRow label="Annual Escalation" value={`${form.annual_escalation_pct}% p.a.`} />
                    <ReviewRow label="Total Rent Value" value={formatCurrency(totalRent)} />
                    <ReviewRow label="Make-Good Penalty" value={formatCurrency(makeGoodPenalty)} highlight />
                    {earlyTermFee > 0 && <ReviewRow label="Early Termination Fee" value={formatCurrency(earlyTermFee)} />}
                  </div>
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Draft status — no signatures yet</Badge>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700">Make-Good clause included</Badge>
                    <Badge variant="outline">{termYears}-year minimum term</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    The contract will be saved as a draft. You can then send it to the tenant for review and e-signature from your dashboard.
                  </p>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Back</Button>
              {step < TOTAL_STEPS
                ? <Button onClick={() => setStep(s => s + 1)} className="bg-emerald-600 hover:bg-emerald-700">Next</Button>
                : <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? 'Generating…' : 'Generate Contract Draft'}
                  </Button>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <>
      <p className="text-slate-500">{label}</p>
      <p className={`font-medium ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
    </>
  )
}
