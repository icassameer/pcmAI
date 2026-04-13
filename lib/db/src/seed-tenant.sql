-- =============================================================================
-- Phase 1 Seed: Create default tenant, seed plans, backfill tenant_id
-- Run with:
--   export DATABASE_URL="postgresql://postgres:IcaCrm@2044@localhost:5432/inventopro"
--   psql $DATABASE_URL -f lib/db/src/seed-tenant.sql
-- =============================================================================

BEGIN;

-- 1. Seed default plans
INSERT INTO plans (name, price_monthly, price_yearly, max_users, max_products, features)
VALUES
  ('Free Trial', 0.00,   0.00,   1,    100,  '{"trial_days": 30}'::jsonb),
  ('Starter',   499.00, 4990.00, 3,    500,  '{"reports": true, "gst_filing": false}'::jsonb),
  ('Pro',       999.00, 9990.00, NULL, NULL, '{"reports": true, "gst_filing": true, "api_access": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. Create the default "Demo Agency" tenant for existing data
--    status = active (already live), plan = pro for now
INSERT INTO tenants (name, slug, plan, status, trial_ends_at)
VALUES ('Demo Agency', 'demo-agency', 'pro', 'active', NOW() + INTERVAL '30 days')
ON CONFLICT (slug) DO NOTHING;

-- 3. Backfill tenant_id = 1 on all existing rows
--    (safe to re-run: WHERE tenant_id IS NULL guards against double-updates)

UPDATE users          SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE categories     SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE suppliers      SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE customers      SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE products       SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE purchases      SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE purchase_items SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE sales          SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE sale_items     SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE business_profile SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE refresh_tokens SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE audit_log      SET tenant_id = 1 WHERE tenant_id IS NULL;

COMMIT;

-- Verify
SELECT 'tenants'         AS tbl, COUNT(*) FROM tenants
UNION ALL SELECT 'plans', COUNT(*) FROM plans
UNION ALL SELECT 'users with tenant', COUNT(*) FROM users WHERE tenant_id IS NOT NULL
UNION ALL SELECT 'products with tenant', COUNT(*) FROM products WHERE tenant_id IS NOT NULL
UNION ALL SELECT 'sales with tenant', COUNT(*) FROM sales WHERE tenant_id IS NOT NULL
UNION ALL SELECT 'purchases with tenant', COUNT(*) FROM purchases WHERE tenant_id IS NOT NULL;
