# UrbanGrid Solar: System Architecture & Implementation Guide

You are a senior full-stack engineer architecting a multi-sided B2B SaaS platform called "UrbanGrid Solar." This platform manages commercial rooftop solar leasing, a Virtual Power Plant (VPP) dashboard, a contractor job board, and a secondhand solar equipment marketplace.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, TypeScript, Supabase (PostgreSQL, Auth, RLS, Storage), Vercel (Hosting), and the Zai API for Escrow/Split Payments.

**Execution Mandate:** Optimize for the lowest possible launch cost. Rely entirely on Supabase's free tier capabilities and Vercel's serverless edge functions. Do not introduce unnecessary third-party paid services. Execute the following phases sequentially, confirming completion of each phase before proceeding.

### Phase 1: Project Initialization & Supabase Architecture
1. Initialize a Next.js 14 project with Tailwind, TypeScript, and shadcn/ui.
2. Set up the Supabase client environment variables.
3. Generate the SQL schema for a multi-role environment (`admin`, `landlord`, `tenant`, `contractor`, `buyer`).
4. Create tables: 
   - `properties` (building specs, roof size, strata status)
   - `solar_assets` (hardware tracking, age, output)
   - `contracts` (10-year term logic, penalty clauses, PDF links)
   - `jobs` (contractor tickets)
   - `equipment_marketplace` (refurbished hardware listings)
   - `transactions` (escrow tracking)
5. Implement strict Row Level Security (RLS) policies based on user roles.

### Phase 2: Onboarding Wizards & Dynamic Contracts
1. Build a stateful, multi-step onboarding wizard for the `landlord` role to capture property metadata.
2. Build a contract generator wizard. This must output a dynamic PPA and Roof Lease agreement containing:
   - 10-year minimum term.
   - Rent rate parameters.
   - A mandatory "Change of Ownership / Asset Removal Make-Good Penalty" clause.

### Phase 3: Role-Based Dashboards
1. **Landlord Dashboard:** Display monthly roof rental yield, active contracts, and property portfolio.
2. **Tenant Dashboard:** Display solar energy consumed vs. grid energy consumed, and net financial savings.
3. **Admin/VPP Dashboard:** Display aggregate MW generated across the urban fleet, hardware status, and active deployment jobs.

### Phase 4: Marketplaces & Integrations
1. **Contractor Portal:** Build a job board where `admin` posts maintenance/installation tickets, and `contractor` roles bid.
2. **Secondhand Marketplace:** Build an e-commerce interface routing recovered/depreciated solar hardware to public `buyers`.
3. **Zai Escrow API Integration:** Create Next.js API routes to accept monthly tenant payments, hold in escrow, and execute a split disbursement (e.g., Landlord rent, Admin revenue, Contractor maintenance fee).
4. **Affiliate Program:** Create an affiliate tracking table and UI for hardware manufacturers (e.g., Fronius, Sungrow) to register and track leads.

Begin Phase 1 immediately and output the terminal commands and SQL schemas required.