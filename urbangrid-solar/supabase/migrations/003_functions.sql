-- ============================================================
-- UrbanGrid Solar — Database Functions & Helpers
-- ============================================================

-- Increment affiliate lead count atomically
CREATE OR REPLACE FUNCTION increment_affiliate_leads(affiliate_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE affiliates SET total_leads = total_leads + 1 WHERE id = affiliate_id;
$$;

-- Increment affiliate conversions and earnings
CREATE OR REPLACE FUNCTION convert_affiliate_lead(lead_id UUID, commission NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  aff_id UUID;
BEGIN
  UPDATE affiliate_leads
  SET converted = TRUE, converted_at = NOW(), commission_earned = commission
  WHERE id = lead_id
  RETURNING affiliate_id INTO aff_id;

  UPDATE affiliates
  SET
    total_conversions = total_conversions + 1,
    total_earnings = total_earnings + commission
  WHERE id = aff_id;
END;
$$;

-- Get VPP fleet summary for admin dashboard
CREATE OR REPLACE FUNCTION vpp_fleet_summary()
RETURNS TABLE(
  total_capacity_kw NUMERIC,
  total_output_kwh_30d NUMERIC,
  active_asset_count BIGINT,
  active_site_count BIGINT,
  active_contract_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    SUM(sa.capacity_kw) AS total_capacity_kw,
    SUM(COALESCE(sa.output_kwh_last30, 0)) AS total_output_kwh_30d,
    COUNT(sa.id) AS active_asset_count,
    COUNT(DISTINCT sa.property_id) AS active_site_count,
    (SELECT COUNT(*) FROM contracts WHERE status = 'active') AS active_contract_count
  FROM solar_assets sa
  WHERE sa.is_active = TRUE;
$$;

-- Auto-activate contract when both parties have signed
CREATE OR REPLACE FUNCTION check_contract_activation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.signed_landlord_at IS NOT NULL AND NEW.signed_tenant_at IS NOT NULL AND NEW.status = 'pending_signature' THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_activate_contract
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION check_contract_activation();
