'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

const TOTAL_STEPS = 4

type PropertyForm = {
  address_line1: string
  address_line2: string
  suburb: string
  state: string
  postcode: string
  building_type: string
  roof_size_sqm: string
  roof_material: string
  roof_orientation: string
  roof_pitch_degrees: string
  strata_status: string
  strata_plan_number: string
  grid_connection_type: string
  dnsp: string
  nmi: string
  annual_electricity_kwh: string
  notes: string
}

const INITIAL: PropertyForm = {
  address_line1: '', address_line2: '', suburb: '', state: '', postcode: '',
  building_type: '', roof_size_sqm: '', roof_material: '', roof_orientation: '',
  roof_pitch_degrees: '', strata_status: 'false', strata_plan_number: '',
  grid_connection_type: '', dnsp: '', nmi: '', annual_electricity_kwh: '', notes: '',
}

const BUILDING_TYPES = ['Commercial Office', 'Industrial Warehouse', 'Retail', 'Mixed Use', 'Factory', 'Storage', 'Other']
const ROOF_MATERIALS = ['Colorbond Steel', 'Zincalume', 'Concrete Tile', 'Terracotta Tile', 'Membrane', 'Gravel/Bitumen', 'Other']
const ORIENTATIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West', 'Flat']
const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']
const CONNECTION_TYPES = ['Single Phase', 'Three Phase', 'HV Connection', 'Embedded Network']

export default function LandlordOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<PropertyForm>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof PropertyForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function next() { if (step < TOTAL_STEPS) setStep(s => s + 1) }
  function back() { if (step > 1) setStep(s => s - 1) }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('properties').insert({
      landlord_id: user.id,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || null,
      suburb: form.suburb,
      state: form.state,
      postcode: form.postcode,
      building_type: form.building_type,
      roof_size_sqm: parseFloat(form.roof_size_sqm),
      roof_material: form.roof_material || null,
      roof_orientation: form.roof_orientation || null,
      roof_pitch_degrees: form.roof_pitch_degrees ? parseFloat(form.roof_pitch_degrees) : null,
      strata_status: form.strata_status === 'true',
      strata_plan_number: form.strata_plan_number || null,
      grid_connection_type: form.grid_connection_type || null,
      dnsp: form.dnsp || null,
      nmi: form.nmi || null,
      annual_electricity_kwh: form.annual_electricity_kwh ? parseFloat(form.annual_electricity_kwh) : null,
      notes: form.notes || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/landlord/dashboard?onboarded=true')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Add Your Property</h1>
          <p className="text-slate-500 mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Property Address'}
              {step === 2 && 'Roof Specifications'}
              {step === 3 && 'Grid Connection & Strata'}
              {step === 4 && 'Additional Details'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter the physical address of the commercial property.'}
              {step === 2 && 'Tell us about the roof — this determines solar capacity.'}
              {step === 3 && 'Grid and strata details affect system design and contracting.'}
              {step === 4 && 'Any extra notes for the UrbanGrid team.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="123 Industrial Ave" required />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Unit / Suite / Level" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Suburb *</Label>
                    <Input value={form.suburb} onChange={e => set('suburb', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Postcode *</Label>
                    <Input value={form.postcode} onChange={e => set('postcode', e.target.value)} maxLength={4} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select value={form.state} onValueChange={v => set('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Building Type *</Label>
                  <Select value={form.building_type} onValueChange={v => set('building_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select building type" /></SelectTrigger>
                    <SelectContent>{BUILDING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Usable Roof Size (m²) *</Label>
                  <Input type="number" value={form.roof_size_sqm} onChange={e => set('roof_size_sqm', e.target.value)} placeholder="e.g. 1500" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label>Roof Material</Label>
                  <Select value={form.roof_material} onValueChange={v => set('roof_material', v)}>
                    <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                    <SelectContent>{ROOF_MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Orientation</Label>
                  <Select value={form.roof_orientation} onValueChange={v => set('roof_orientation', v)}>
                    <SelectTrigger><SelectValue placeholder="Select orientation" /></SelectTrigger>
                    <SelectContent>{ORIENTATIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Roof Pitch (degrees)</Label>
                  <Input type="number" value={form.roof_pitch_degrees} onChange={e => set('roof_pitch_degrees', e.target.value)} placeholder="e.g. 10" min="0" max="90" />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Strata Title? *</Label>
                  <Select value={form.strata_status} onValueChange={v => set('strata_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No — freehold / company title</SelectItem>
                      <SelectItem value="true">Yes — strata plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.strata_status === 'true' && (
                  <div className="space-y-2">
                    <Label>Strata Plan Number</Label>
                    <Input value={form.strata_plan_number} onChange={e => set('strata_plan_number', e.target.value)} placeholder="SP12345" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Grid Connection Type</Label>
                  <Select value={form.grid_connection_type} onValueChange={v => set('grid_connection_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{CONNECTION_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>DNSP (Network Operator)</Label>
                    <Input value={form.dnsp} onChange={e => set('dnsp', e.target.value)} placeholder="e.g. Ausgrid" />
                  </div>
                  <div className="space-y-2">
                    <Label>NMI</Label>
                    <Input value={form.nmi} onChange={e => set('nmi', e.target.value)} placeholder="10-digit NMI" maxLength={11} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Annual Electricity Consumption (kWh)</Label>
                  <Input type="number" value={form.annual_electricity_kwh} onChange={e => set('annual_electricity_kwh', e.target.value)} placeholder="e.g. 120000" min="0" />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Any special access requirements, structural considerations, existing equipment, or other information…"
                    rows={5}
                  />
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 space-y-1">
                  <p className="font-semibold">Ready to submit?</p>
                  <p>Our team will review your property details and reach out within 2 business days to discuss your solar leasing options.</p>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
              {step < TOTAL_STEPS
                ? <Button onClick={next} className="bg-emerald-600 hover:bg-emerald-700">Next</Button>
                : <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? 'Submitting…' : 'Submit Property'}
                  </Button>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
