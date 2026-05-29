import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
      <div className="text-center space-y-8 px-6">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">UrbanGrid Solar</h1>
          </div>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Commercial rooftop solar leasing, Virtual Power Plant management,
            contractor services, and secondhand equipment marketplace.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-slate-400 text-white hover:bg-slate-700">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto">
          {[
            { label: 'Landlords', desc: 'Earn passive roof rental income' },
            { label: 'Tenants', desc: 'Reduce your energy bills' },
            { label: 'Contractors', desc: 'Bid on solar install jobs' },
            { label: 'Marketplace', desc: 'Buy & sell solar equipment' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-left">
              <p className="font-semibold text-white">{label}</p>
              <p className="text-sm text-slate-300 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
