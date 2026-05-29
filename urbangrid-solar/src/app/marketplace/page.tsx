import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('equipment_marketplace')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const types = Array.from(new Set(listings?.map(l => l.asset_type) ?? []))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">UrbanGrid Solar — Marketplace</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/marketplace/sell">List Equipment</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Secondhand Solar Marketplace</h1>
          <p className="text-slate-500 mt-1">Recovered and depreciated commercial solar hardware</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50">All</Badge>
          {types.map(t => (
            <Badge key={t} variant="outline" className="cursor-pointer hover:bg-emerald-50 capitalize">
              {t.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings?.map(listing => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-tight">{listing.title}</CardTitle>
                  <ConditionBadge condition={listing.condition} />
                </div>
                <CardDescription>{listing.manufacturer} · {listing.model}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="capitalize">{listing.asset_type.replace(/_/g, ' ')}
                    {listing.capacity_kw ? ` · ${listing.capacity_kw} kW` : ''}
                    {listing.age_years ? ` · ${listing.age_years} yrs old` : ''}
                  </p>
                  <p>{listing.location_suburb}, {listing.location_state}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900">{formatCurrency(Number(listing.asking_price))}</span>
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                    <Link href={`/marketplace/${listing.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!listings?.length && (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-16 text-center">
            <p className="text-slate-400 text-lg">No listings available at the moment.</p>
            <p className="text-slate-400 mt-1">Check back soon as hardware becomes available from our fleet.</p>
          </div>
        )}
      </main>
    </div>
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0 ${styles[condition] ?? 'bg-slate-100 text-slate-700'}`}>
      {condition}
    </span>
  )
}
