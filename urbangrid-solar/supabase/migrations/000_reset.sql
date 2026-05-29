-- Reset script: drops everything so migrations can be re-run cleanly.
-- Run this ONCE in Supabase SQL Editor before re-running 001 and 002.

-- Drop tables (order matters for FK constraints)
DROP TABLE IF EXISTS affiliate_leads CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS equipment_marketplace CASCADE;
DROP TABLE IF EXISTS job_bids CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS solar_assets CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS auth_role() CASCADE;
DROP FUNCTION IF EXISTS increment_affiliate_leads(uuid) CASCADE;
DROP FUNCTION IF EXISTS convert_affiliate_lead(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS vpp_fleet_summary() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_contract_activation() CASCADE;

-- Drop auth trigger (lives outside public schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS asset_condition CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS job_type CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
