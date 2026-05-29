-- ============================================================
-- UrbanGrid Solar — Row Level Security Policies
-- ============================================================

-- Helper: get role of the current authenticated user
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users see their own profile; admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR auth_role() = 'admin');

-- Users update their own profile; admins update any
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR auth_role() = 'admin');

-- Only the trigger (SECURITY DEFINER) inserts profiles
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (FALSE);

-- Only admins can delete profiles (soft deletes preferred)
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- PROPERTIES
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Landlords see their own; admins see all; tenants see properties they have a contract on
CREATE POLICY "properties_select" ON properties FOR SELECT
  USING (
    landlord_id = auth.uid()
    OR auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.property_id = properties.id
        AND contracts.tenant_id = auth.uid()
        AND contracts.status = 'active'
    )
  );

CREATE POLICY "properties_insert" ON properties FOR INSERT
  WITH CHECK (landlord_id = auth.uid() AND auth_role() = 'landlord');

CREATE POLICY "properties_update" ON properties FOR UPDATE
  USING (landlord_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "properties_delete" ON properties FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- SOLAR ASSETS
-- ============================================================
ALTER TABLE solar_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solar_assets_select" ON solar_assets FOR SELECT
  USING (
    auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = solar_assets.property_id
        AND (
          properties.landlord_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.property_id = properties.id
              AND contracts.tenant_id = auth.uid()
              AND contracts.status = 'active'
          )
        )
    )
    -- Contractors see assets linked to their awarded jobs
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.asset_id = solar_assets.id
        AND jobs.awarded_to = auth.uid()
    )
  );

CREATE POLICY "solar_assets_insert" ON solar_assets FOR INSERT
  WITH CHECK (
    auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = solar_assets.property_id
        AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "solar_assets_update" ON solar_assets FOR UPDATE
  USING (
    auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = solar_assets.property_id
        AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "solar_assets_delete" ON solar_assets FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- CONTRACTS
-- ============================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts FOR SELECT
  USING (
    landlord_id = auth.uid()
    OR tenant_id = auth.uid()
    OR auth_role() = 'admin'
  );

-- Only admins and landlords can create contracts
CREATE POLICY "contracts_insert" ON contracts FOR INSERT
  WITH CHECK (
    auth_role() = 'admin'
    OR (auth_role() = 'landlord' AND landlord_id = auth.uid())
  );

CREATE POLICY "contracts_update" ON contracts FOR UPDATE
  USING (
    auth_role() = 'admin'
    OR (auth_role() = 'landlord' AND landlord_id = auth.uid() AND status = 'draft')
  );

CREATE POLICY "contracts_delete" ON contracts FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- JOBS
-- ============================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Admins see all; contractors see open/bidding jobs and their own awarded jobs; landlords see jobs on their properties
CREATE POLICY "jobs_select" ON jobs FOR SELECT
  USING (
    auth_role() = 'admin'
    OR posted_by = auth.uid()
    OR awarded_to = auth.uid()
    OR (auth_role() = 'contractor' AND status IN ('open', 'bidding'))
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = jobs.property_id
        AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "jobs_insert" ON jobs FOR INSERT
  WITH CHECK (auth_role() = 'admin' AND posted_by = auth.uid());

CREATE POLICY "jobs_update" ON jobs FOR UPDATE
  USING (auth_role() = 'admin' OR posted_by = auth.uid());

CREATE POLICY "jobs_delete" ON jobs FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- JOB BIDS
-- ============================================================
ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_bids_select" ON job_bids FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_bids.job_id AND jobs.posted_by = auth.uid()
    )
  );

CREATE POLICY "job_bids_insert" ON job_bids FOR INSERT
  WITH CHECK (
    auth_role() = 'contractor'
    AND contractor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_bids.job_id AND jobs.status IN ('open', 'bidding')
    )
  );

CREATE POLICY "job_bids_update" ON job_bids FOR UPDATE
  USING (contractor_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "job_bids_delete" ON job_bids FOR DELETE
  USING (contractor_id = auth.uid() OR auth_role() = 'admin');

-- ============================================================
-- EQUIPMENT MARKETPLACE
-- ============================================================
ALTER TABLE equipment_marketplace ENABLE ROW LEVEL SECURITY;

-- Public read for active listings; sellers and admins see all their listings
CREATE POLICY "marketplace_select" ON equipment_marketplace FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR auth_role() = 'admin'
  );

CREATE POLICY "marketplace_insert" ON equipment_marketplace FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    AND auth_role() IN ('admin', 'landlord', 'contractor')
  );

CREATE POLICY "marketplace_update" ON equipment_marketplace FOR UPDATE
  USING (seller_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "marketplace_delete" ON equipment_marketplace FOR DELETE
  USING (seller_id = auth.uid() OR auth_role() = 'admin');

-- ============================================================
-- TRANSACTIONS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (
    payer_id = auth.uid()
    OR auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = transactions.contract_id
        AND contracts.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = transactions.job_id
        AND jobs.awarded_to = auth.uid()
    )
  );

-- Only system/admin creates transactions (via service role in API routes)
CREATE POLICY "transactions_insert" ON transactions FOR INSERT
  WITH CHECK (auth_role() = 'admin');

CREATE POLICY "transactions_update" ON transactions FOR UPDATE
  USING (auth_role() = 'admin');

CREATE POLICY "transactions_delete" ON transactions FOR DELETE
  USING (FALSE); -- transactions are immutable

-- ============================================================
-- AFFILIATES
-- ============================================================
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_select" ON affiliates FOR SELECT
  USING (user_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "affiliates_insert" ON affiliates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "affiliates_update" ON affiliates FOR UPDATE
  USING (user_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "affiliates_delete" ON affiliates FOR DELETE
  USING (auth_role() = 'admin');

-- ============================================================
-- AFFILIATE LEADS
-- ============================================================
ALTER TABLE affiliate_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_leads_select" ON affiliate_leads FOR SELECT
  USING (
    auth_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_leads.affiliate_id
        AND affiliates.user_id = auth.uid()
    )
  );

-- Public insert allowed (referral tracking on signup)
CREATE POLICY "affiliate_leads_insert" ON affiliate_leads FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "affiliate_leads_update" ON affiliate_leads FOR UPDATE
  USING (auth_role() = 'admin');
