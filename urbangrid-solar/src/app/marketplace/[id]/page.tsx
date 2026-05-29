'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Zap, Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Database } from '@/types/database'

type Listing = Database['public']['Tables']['equipment_marketplace']['Row']

const CONDITION_STYLES: Record<string, { label: string; className: string }> = {
  new:       { label: 'New',       className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  excellent: { label: 'Excellent', className: 'bg-green-100 text-green-800 border-green-200' },
  good:      { label: 'Good',      className: 'bg-blue-100 text-blue-800 border-blue-200' },
  fair:      { label: 'Fair',      className: 'bg-amber-100 text-amber-800 border-amber-200' },
  poor:      { label: 'Poor',      className: 'bg-red-100 text-red-800 border-red-200' },
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  panel: 'Solar Panel', inverter: 'Inverter', battery: 'Battery Storage',
  meter: 'Smart Meter', ev_charger: 'EV Charger', other: 'Other',
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)

  const [enquiry, setEnquiry] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [enquiryError, setEnquiryError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: listing }, { data: { user } }] = await Promise.all([
        supabase.from('equipment_marketplace').select('*').eq('id', id).maybeSingle(),
        supabase.auth.getUser(),
      ])
      setListing(listing)
      if (user) {
        setUser({ id: user.id, email: user.email ?? '' })
        setEnquiry(e => ({ ...e, email: user.email ?? '' }))
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleEnquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!listing) return
    setEnquiryError(null)
    setSending(true)

    // Store enquiry as a transaction note (re-using existing infrastructure)
    // In production this would send an email — for now we record interest
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      setEnquiryError('Please sign in to send an enquiry.')
      setSending(false)
      return
    }

    const { error } = await supabase.from('transactions').insert({
      listing_id: listing.id,
      payer_id: currentUser.id,
      gross_amount: Number(listing.asking_price),
      landlord_share: 0,
      admin_share: 0,
      contractor_share: 0,
      status: 'pending',
      notes: `ENQUIRY from ${enquiry.name} (${enquiry.phone}): ${enquiry.message}`,
    })

    if (error) {
      setEnquiryError('Failed to send enquiry. Please try again.')
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="text-slate-600 font-medium">Listing not found or no longer active.</p>
        <Button asChild variant="outline"><Link href="/marketplace">Back to Marketplace</Link></Button>
      </div>
    )
  }

  const condition = CONDITION_STYLES[listing.condition] ?? { label: listing.condition, className: 'bg-slate-100 text-slate-700' }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-sm">UrbanGrid Solar</span>
            </Link>
          </div>
          <Link href="/marketplace" className="text-sm text-emerald-600 hover:underline font-medium">
            All listings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left: Listing details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image placeholder */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 h-72 flex items-center justify-center border border-slate-200">
              <div className="text-center text-slate-400 space-y-2">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm">Equipment photo</p>
              </div>
            </div>

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${condition.className}`}>
                  {condition.label}
                </span>
                <Badge variant="outline" className="capitalize text-xs">
                  {ASSET_TYPE_LABELS[listing.asset_type] ?? listing.asset_type}
                </Badge>
                {listing.status !== 'active' && (
                  <Badge className="bg-red-100 text-red-700 capitalize text-xs">{listing.status}</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              <p className="text-slate-500 mt-1">{listing.manufacturer} · {listing.model}</p>
            </div>

            {/* Specs grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                  {[
                    { icon: Package, label: 'Type', value: ASSET_TYPE_LABELS[listing.asset_type] ?? listing.asset_type },
                    { icon: Zap, label: 'Capacity', value: listing.capacity_kw ? `${listing.capacity_kw} kW` : '—' },
                    { icon: Calendar, label: 'Age', value: listing.age_years ? `${listing.age_years} years` : '—' },
                    { icon: MapPin, label: 'Location', value: `${listing.location_suburb}, ${listing.location_state}` },
                    { icon: CheckCircle2, label: 'Condition', value: condition.label },
                    { icon: Calendar, label: 'Listed', value: formatDate(listing.created_at) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label}>
                      <dt className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Icon className="h-3.5 w-3.5" />{label}
                      </dt>
                      <dd className="font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Price & Enquiry ── */}
          <div className="space-y-5">

            {/* Price card */}
            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6">
                <p className="text-sm text-emerald-700 font-medium mb-1">Asking price</p>
                <p className="text-4xl font-extrabold text-emerald-700">{formatCurrency(Number(listing.asking_price))}</p>
                <p className="text-xs text-emerald-600 mt-1">AUD, ex GST. Negotiable.</p>
                <div className="mt-4 pt-4 border-t border-emerald-200 text-xs text-emerald-700 space-y-1.5">
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Verified seller listing</p>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />UrbanGrid marketplace guarantee</p>
                </div>
              </CardContent>
            </Card>

            {/* Enquiry form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send an enquiry</CardTitle>
                <CardDescription>The seller will respond within 48 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                {sent ? (
                  <div className="text-center py-6 space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-slate-900">Enquiry sent!</p>
                    <p className="text-sm text-slate-500">The seller will be in touch shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleEnquiry} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Your name *</Label>
                      <Input
                        value={enquiry.name}
                        onChange={e => setEnquiry(q => ({ ...q, name: e.target.value }))}
                        placeholder="Jane Smith"
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email *</Label>
                      <Input
                        type="email"
                        value={enquiry.email}
                        onChange={e => setEnquiry(q => ({ ...q, email: e.target.value }))}
                        placeholder="you@company.com"
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        type="tel"
                        value={enquiry.phone}
                        onChange={e => setEnquiry(q => ({ ...q, phone: e.target.value }))}
                        placeholder="04xx xxx xxx"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Message *</Label>
                      <Textarea
                        value={enquiry.message}
                        onChange={e => setEnquiry(q => ({ ...q, message: e.target.value }))}
                        placeholder="I'm interested in this listing. Can you tell me more about..."
                        rows={3}
                        required
                        className="text-sm resize-none"
                      />
                    </div>
                    {enquiryError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{enquiryError}</p>
                    )}
                    {!user && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                        You need to{' '}
                        <Link href="/auth/login" className="underline font-medium">sign in</Link>
                        {' '}to send an enquiry.
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                      disabled={sending || !user}
                    >
                      {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : 'Send enquiry'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Safety notice */}
            <div className="rounded-xl bg-slate-100 px-4 py-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">Safety tips</p>
              <p>· Inspect equipment before purchase</p>
              <p>· Request CEC certification paperwork</p>
              <p>· Use in-platform payment for buyer protection</p>
              <p>· Never pay outside the UrbanGrid platform</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
