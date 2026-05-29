'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Menu, X, Zap, Building2, Wrench, ShoppingCart, Shield, FileText, BarChart3, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = {
  landlord: [
    { step: '01', icon: Building2, title: 'List your property', body: 'Tell us about your rooftop — size, orientation, grid connection, and strata details. Takes about 5 minutes.' },
    { step: '02', icon: FileText, title: 'Sign a long-term contract', body: 'Choose between a PPA, roof lease, or combined contract. All agreements include our mandatory Make-Good Penalty clause.' },
    { step: '03', icon: Zap, title: 'Collect monthly payments', body: 'Rent hits your account every month via Zai escrow. No chasing invoices, no surprises — just passive income.' },
  ],
  tenant: [
    { step: '01', icon: Building2, title: 'Browse available rooftops', body: 'Search verified commercial properties with solar capacity in your region. Filter by output, location, and tariff rate.' },
    { step: '02', icon: FileText, title: 'Sign a Power Purchase Agreement', body: 'Lock in a below-market solar tariff for 10–25 years. Your rate escalates at a fixed 3% annually — far below grid tariff increases.' },
    { step: '03', icon: Zap, title: 'Access cheaper clean energy', body: 'Track your real-time generation, savings vs retail tariff, and monthly kWh output from your tenant dashboard.' },
  ],
  contractor: [
    { step: '01', icon: Wrench, title: 'Create your contractor profile', body: 'Register your licence, CEC accreditation, and service areas. Get verified in 24 hours.' },
    { step: '02', icon: FileText, title: 'Bid on posted jobs', body: 'Browse open installation, maintenance, inspection, and repair jobs. Submit a bid with your price and cover note.' },
    { step: '03', icon: Shield, title: 'Get paid via escrow', body: 'Awarded jobs are funded in escrow before you start. Funds are released upon completion — zero payment risk.' },
  ],
}

const ROLES = [
  {
    icon: Building2,
    title: 'Property Owners',
    subtitle: 'Turn idle rooftops into income',
    color: 'emerald',
    benefits: ['Zero upfront capital required', 'Minimum 10-year guaranteed contracts', 'Make-Good Penalty protects your asset', 'Passive monthly rental income'],
    cta: 'List your rooftop',
    href: '/auth/signup',
  },
  {
    icon: Zap,
    title: 'Energy Tenants',
    subtitle: 'Lock in below-market solar rates',
    color: 'blue',
    benefits: ['Solar tariffs below retail grid rates', 'Fixed 3% annual escalation cap', 'Real-time energy dashboard', 'No hardware ownership required'],
    cta: 'Access solar energy',
    href: '/auth/signup',
  },
  {
    icon: Wrench,
    title: 'Solar Contractors',
    subtitle: 'Win jobs, get paid fast',
    color: 'amber',
    benefits: ['Browse open jobs in your area', 'Transparent budget ranges upfront', 'Escrow-backed payment guarantee', 'Build your verified rating'],
    cta: 'Join the network',
    href: '/auth/signup',
  },
  {
    icon: ShoppingCart,
    title: 'Equipment Buyers',
    subtitle: 'Quality secondhand solar hardware',
    color: 'violet',
    benefits: ['CEC-grade panels and inverters', 'Verified age and condition ratings', 'Browse by capacity and location', 'Secure marketplace transactions'],
    cta: 'Browse listings',
    href: '/marketplace',
  },
]

const FEATURES = [
  { icon: BarChart3, title: 'Virtual Power Plant Dashboard', body: 'Admins get a live fleet overview — total capacity (kW→MW), 30-day output, hardware health, and pending escrow positions across all properties.' },
  { icon: FileText, title: 'Smart Contract Generator', body: 'Create PPA, roof lease, or combined contracts in minutes. Every contract auto-includes the $50k Make-Good Penalty clause and minimum 10-year term.' },
  { icon: Shield, title: 'Zai Escrow Payments', body: 'Every payment — rent, job award, equipment sale — flows through Zai escrow and is split automatically between landlord, admin, and contractor.' },
  { icon: Wrench, title: 'Contractor Job Board', body: 'Post installation, maintenance, or inspection jobs with budget ranges. Contractors bid, you award, funds release on completion.' },
  { icon: ShoppingCart, title: 'Equipment Marketplace', body: 'Recovered commercial solar hardware listed with condition badges, capacity ratings, and location. A circular economy for solar assets.' },
  { icon: Zap, title: 'Affiliate Partner Portal', body: 'Hardware manufacturers (Fronius, Sungrow, SMA) register to track referral leads, conversions, and commission earnings in real time.' },
]

const FAQS = [
  { q: 'What is the minimum contract length?', a: 'All UrbanGrid Solar contracts have a minimum term of 10 years, enforced at the database level. Available terms are 10, 12, 15, 20, and 25 years. This protects both parties and ensures the solar asset can be fully amortised.' },
  { q: 'What is the Make-Good Penalty clause?', a: 'Every contract on our platform includes a mandatory Make-Good Penalty clause (default $50,000). This protects the landlord if a tenant terminates early or fails to remove equipment at end of term. It is non-negotiable and embedded in every generated contract.' },
  { q: 'How does escrow payment work?', a: 'Payments are processed through Zai, an Australian-licensed payment platform. Funds are held in escrow and only released when both parties confirm completion. Disbursements are split automatically — landlord share, admin fee, and contractor payment — in a single transaction.' },
  { q: 'Who manages the solar assets?', a: 'UrbanGrid Solar admins manage the fleet through the VPP (Virtual Power Plant) dashboard. Contractors handle physical installation and maintenance via the job board. Tenants monitor their own energy output and savings via their dashboard.' },
  { q: 'Can I list a property in strata?', a: 'Yes. The onboarding wizard captures strata status and strata plan number. Strata properties may have additional approval requirements, and our contract templates include clauses to address this.' },
  { q: 'Is my data secure?', a: 'All data is stored in Supabase with Row Level Security (RLS). Each role — admin, landlord, tenant, contractor, buyer — can only access their own data. The service-role key is never exposed to the browser.' },
]

const STATS = [
  { value: '$0', label: 'Upfront cost for landlords' },
  { value: '10–25yr', label: 'Guaranteed contract terms' },
  { value: '5 roles', label: 'Platform participants' },
  { value: '100%', label: 'Escrow-backed payments' },
]

// ─── Components ──────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-emerald-600 transition-colors"
      >
        <span className="font-semibold text-slate-900">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-slate-600 leading-relaxed">{a}</p>}
    </div>
  )
}

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  amber: 'bg-amber-50 border-amber-200 hover:border-amber-400',
  violet: 'bg-violet-50 border-violet-200 hover:border-violet-400',
}
const iconColorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  violet: 'bg-violet-100 text-violet-600',
}
const btnColorMap: Record<string, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'landlord' | 'tenant' | 'contractor'>('landlord')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg">UrbanGrid Solar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How it works</a>
            <a href="#platform" className="hover:text-emerald-600 transition-colors">Platform</a>
            <a href="#roles" className="hover:text-emerald-600 transition-colors">Who it&apos;s for</a>
            <Link href="/marketplace" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-slate-600">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/auth/signup">Get started <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(o => !o)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3 text-sm font-medium text-slate-700">
            <a href="#how-it-works" className="block py-2" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#platform" className="block py-2" onClick={() => setMobileMenuOpen(false)}>Platform</a>
            <a href="#roles" className="block py-2" onClick={() => setMobileMenuOpen(false)}>Who it&apos;s for</a>
            <Link href="/marketplace" className="block py-2" onClick={() => setMobileMenuOpen(false)}>Marketplace</Link>
            <div className="flex gap-3 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1"><Link href="/auth/login">Sign in</Link></Button>
              <Button asChild size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Link href="/auth/signup">Get started</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white pt-24 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-300 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Australia&apos;s commercial rooftop solar platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Your rooftop.<br />
            <em className="not-italic text-emerald-400">Earning passively.</em>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            UrbanGrid Solar connects commercial property owners with energy tenants through long-term solar contracts — backed by escrow payments, a contractor network, and a VPP fleet dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white text-base px-8 h-12">
              <Link href="/auth/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-500 text-white hover:bg-slate-800 text-base px-8 h-12">
              <a href="#how-it-works">See how it works ↓</a>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-slate-400">
            {['Escrow-protected payments', 'CEC-accredited contractors', '10-year minimum contracts', 'Australian compliant'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-emerald-600 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-emerald-100 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Simple by design</p>
            <h2 className="text-4xl font-extrabold text-slate-900">How it <em className="not-italic text-emerald-600">works.</em></h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Select your role to see the journey.</p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
              {(['landlord', 'tenant', 'contractor'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'landlord' ? 'Property Owner' : tab === 'tenant' ? 'Energy Tenant' : 'Contractor'}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS[activeTab].map(({ step, icon: Icon, title, body }) => (
              <div key={step} className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm relative">
                <div className="absolute top-6 right-6 text-5xl font-black text-slate-100 select-none">{step}</div>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/auth/signup">
                {activeTab === 'landlord' ? 'List your rooftop' : activeTab === 'tenant' ? 'Access solar energy' : 'Join the contractor network'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section id="roles" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Four sides, one platform</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Built for <em className="not-italic text-emerald-600">everyone</em> in the solar chain.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map(role => (
              <div
                key={role.title}
                className={`rounded-2xl border-2 p-6 transition-all duration-200 cursor-default ${colorMap[role.color]}`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-5 ${iconColorMap[role.color]}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{role.title}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-4">{role.subtitle}</p>
                <ul className="space-y-2 mb-6">
                  {role.benefits.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className={`w-full text-white text-xs ${btnColorMap[role.color]}`}>
                  <Link href={role.href}>{role.cta} →</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section id="platform" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">The full stack</p>
            <h2 className="text-4xl font-extrabold">Everything in <em className="not-italic text-emerald-400">one platform.</em></h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">No patchwork of third-party tools. UrbanGrid Solar handles contracts, payments, fleet management, jobs, and marketplace — in one place.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-slate-800 rounded-2xl p-7 border border-slate-700 hover:border-emerald-500/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why UrbanGrid ── */}
      <section className="py-24 px-6 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Why UrbanGrid Solar</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Built with the hard parts <em className="not-italic text-emerald-600">already solved.</em></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Mandatory Make-Good Penalty', body: 'Every contract locks in a $50,000 make-good penalty. Landlords are protected if equipment isn\'t removed at end of term — no negotiation required.' },
              { title: 'Row-Level Security by role', body: 'Supabase RLS ensures each user sees only their own data. Landlords can\'t see tenant invoices. Contractors can\'t see contract rates. Data stays private.' },
              { title: 'Split disbursements via Zai', body: 'Payments don\'t flow manually. Zai splits every transaction into landlord share, admin fee, and contractor payment in a single atomic operation.' },
              { title: 'VPP-ready fleet management', body: 'Admins get a live Virtual Power Plant dashboard — total MW under management, 30-day output trends, and hardware health across the entire fleet.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-7 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-4" />
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Questions answered</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Frequently <em className="not-italic text-emerald-600">asked.</em></h2>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 px-8 divide-y divide-slate-200">
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold">Ready to put your rooftop <em className="not-italic text-emerald-400">to work?</em></h2>
          <p className="text-slate-300 text-lg">Join landlords, tenants, contractors, and equipment buyers already on the platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white text-base px-8 h-12">
              <Link href="/auth/signup">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-500 text-white hover:bg-slate-800 text-base px-8 h-12">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-white font-bold">UrbanGrid Solar</span>
              </div>
              <p className="text-sm leading-relaxed">Australia&apos;s commercial rooftop solar platform. Connecting properties, energy, and contractors.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Get started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Participants</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Property Owners</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Energy Tenants</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Contractors</Link></li>
                <li><Link href="/affiliates/dashboard" className="hover:text-white transition-colors">Affiliate Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} UrbanGrid Solar. All rights reserved.</p>
            <p>Built for the Australian commercial solar market.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
