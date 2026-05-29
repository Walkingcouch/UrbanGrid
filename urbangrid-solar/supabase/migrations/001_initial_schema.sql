-- ============================================================
-- UrbanGrid Solar — Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'landlord', 'tenant', 'contractor', 'buyer');
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'active', 'terminated', 'expired');
CREATE TYPE job_status AS ENUM ('open', 'bidding', 'awarded', 'in_progress', 'completed', 'cancelled');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'reserved', 'delisted');
CREATE TYPE transaction_status AS ENUM ('pending', 'in_escrow', 'disbursed', 'refunded', 'disputed');
CREATE TYPE asset_condition AS ENUM ('new', 'excellent', 'good', 'fair', 'poor');
CREATE TYPE asset_type AS ENUM ('panel', 'inverter', 'battery', 'meter', 'ev_charger', 'other');
CREATE TYPE job_type AS ENUM ('installation', 'maintenance', 'inspection', 'removal', 'repair');
CREATE TYPE contract_type AS ENUM ('ppa', 'roof_lease', 'combined');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  role          user_role NOT NULL DEFAULT 'tenant',
  full_name     TEXT,
  company_name  TEXT,
  phone         TEXT,
  abn           TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE properties (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_line1         TEXT NOT NULL,
  address_line2         TEXT,
  suburb                TEXT NOT NULL,
  state                 TEXT NOT NULL,
  postcode              TEXT NOT NULL,
  building_type         TEXT NOT NULL,
  roof_size_sqm         NUMERIC(10,2) NOT NULL CHECK (roof_size_sqm > 0),
  roof_material         TEXT,
  roof_orientation      TEXT,
  roof_pitch_degrees    NUMERIC(5,2),
  strata_status         BOOLEAN NOT NULL DEFAULT FALSE,
  strata_plan_number    TEXT,
  grid_connection_type  TEXT,
  dnsp                  TEXT,
  nmi                   TEXT,
  annual_electricity_kwh NUMERIC(12,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_landlord ON properties(landlord_id);

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SOLAR ASSETS
-- ============================================================
CREATE TABLE solar_assets (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  serial_number        TEXT,
  manufacturer         TEXT NOT NULL,
  model                TEXT NOT NULL,
  asset_type           asset_type NOT NULL,
  capacity_kw          NUMERIC(10,3) NOT NULL CHECK (capacity_kw > 0),
  install_date         DATE NOT NULL,
  warranty_expiry      DATE,
  condition            asset_condition NOT NULL DEFAULT 'new',
  output_kwh_last30    NUMERIC(12,3),
  output_kwh_lifetime  NUMERIC(15,3),
  last_service_date    DATE,
  next_service_date    DATE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solar_assets_property ON solar_assets(property_id);
CREATE INDEX idx_solar_assets_active ON solar_assets(is_active);

CREATE TRIGGER solar_assets_updated_at BEFORE UPDATE ON solar_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id               UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  landlord_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  tenant_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contract_type             contract_type NOT NULL DEFAULT 'combined',
  status                    contract_status NOT NULL DEFAULT 'draft',
  term_years                INTEGER NOT NULL DEFAULT 10 CHECK (term_years >= 10),
  start_date                DATE,
  end_date                  DATE GENERATED ALWAYS AS (start_date + (term_years || ' years')::INTERVAL) STORED,
  monthly_rent_rate         NUMERIC(10,2) NOT NULL CHECK (monthly_rent_rate >= 0),
  ppa_rate_per_kwh          NUMERIC(8,4),
  annual_escalation_pct     NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  -- Make-Good / Change of Ownership Penalty (mandatory clause)
  make_good_penalty_amount  NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
  early_termination_fee     NUMERIC(12,2),
  pdf_url                   TEXT,
  signed_landlord_at        TIMESTAMPTZ,
  signed_tenant_at          TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_property ON contracts(property_id);
CREATE INDEX idx_contracts_landlord ON contracts(landlord_id);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_status ON contracts(status);

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOBS (Contractor Tickets)
-- ============================================================
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  asset_id        UUID REFERENCES solar_assets(id) ON DELETE SET NULL,
  posted_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  awarded_to      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  job_type        job_type NOT NULL,
  status          job_status NOT NULL DEFAULT 'open',
  budget_min      NUMERIC(10,2),
  budget_max      NUMERIC(10,2),
  awarded_amount  NUMERIC(10,2),
  scheduled_date  DATE,
  completed_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budget_range_valid CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_awarded_to ON jobs(awarded_to);

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOB BIDS
-- ============================================================
CREATE TABLE job_bids (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount     NUMERIC(10,2) NOT NULL CHECK (bid_amount > 0),
  cover_note     TEXT,
  estimated_days INTEGER,
  is_awarded     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, contractor_id)
);

CREATE INDEX idx_job_bids_job ON job_bids(job_id);
CREATE INDEX idx_job_bids_contractor ON job_bids(contractor_id);

-- ============================================================
-- EQUIPMENT MARKETPLACE
-- ============================================================
CREATE TABLE equipment_marketplace (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  asset_id         UUID REFERENCES solar_assets(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  manufacturer     TEXT NOT NULL,
  model            TEXT NOT NULL,
  asset_type       asset_type NOT NULL,
  condition        asset_condition NOT NULL,
  capacity_kw      NUMERIC(10,3),
  age_years        NUMERIC(5,2),
  asking_price     NUMERIC(12,2) NOT NULL CHECK (asking_price > 0),
  location_suburb  TEXT NOT NULL,
  location_state   TEXT NOT NULL,
  images           TEXT[] NOT NULL DEFAULT '{}',
  status           listing_status NOT NULL DEFAULT 'active',
  buyer_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_status ON equipment_marketplace(status);
CREATE INDEX idx_marketplace_seller ON equipment_marketplace(seller_id);
CREATE INDEX idx_marketplace_asset_type ON equipment_marketplace(asset_type);

CREATE TRIGGER marketplace_updated_at BEFORE UPDATE ON equipment_marketplace
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRANSACTIONS (Escrow Tracking)
-- ============================================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID REFERENCES contracts(id) ON DELETE SET NULL,
  listing_id      UUID REFERENCES equipment_marketplace(id) ON DELETE SET NULL,
  job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
  payer_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status          transaction_status NOT NULL DEFAULT 'pending',
  gross_amount    NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
  landlord_share  NUMERIC(12,2) NOT NULL DEFAULT 0,
  admin_share     NUMERIC(12,2) NOT NULL DEFAULT 0,
  contractor_share NUMERIC(12,2) NOT NULL DEFAULT 0,
  zai_payment_id  TEXT,
  zai_escrow_id   TEXT,
  disbursed_at    TIMESTAMPTZ,
  period_start    DATE,
  period_end      DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shares_lte_gross CHECK (
    (landlord_share + admin_share + contractor_share) <= gross_amount
  )
);

CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_contract ON transactions(contract_id);

CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AFFILIATES
-- ============================================================
CREATE TABLE affiliates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name       TEXT NOT NULL,
  brand              TEXT NOT NULL,
  referral_code      TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::TEXT), 1, 8)),
  commission_pct     NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (commission_pct BETWEEN 0 AND 100),
  total_leads        INTEGER NOT NULL DEFAULT 0,
  total_conversions  INTEGER NOT NULL DEFAULT 0,
  total_earnings     NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AFFILIATE LEADS
-- ============================================================
CREATE TABLE affiliate_leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id      UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code     TEXT NOT NULL,
  email             TEXT,
  converted         BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at      TIMESTAMPTZ,
  commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_leads_affiliate ON affiliate_leads(affiliate_id);
CREATE INDEX idx_affiliate_leads_code ON affiliate_leads(referral_code);
