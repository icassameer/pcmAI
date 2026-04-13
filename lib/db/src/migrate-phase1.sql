-- =============================================================================
-- Phase 1 Migration: Multi-tenant schema changes
-- Apply via: sudo -u postgres psql -d inventopro -f /var/www/inventopro/lib/db/src/migrate-phase1.sql
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. NEW TABLE: plans
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2) NOT NULL,
  price_yearly  NUMERIC(10,2) NOT NULL,
  max_users     INTEGER,       -- NULL = unlimited
  max_products  INTEGER,       -- NULL = unlimited
  features      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. NEW TABLE: tenants
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                        SERIAL PRIMARY KEY,
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL UNIQUE,
  plan                      TEXT NOT NULL DEFAULT 'free',
  status                    TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at             TIMESTAMPTZ,
  razorpay_customer_id      TEXT,
  razorpay_subscription_id  TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. ADD tenant_id TO ALL EXISTING TABLES
--    (nullable so existing rows are not affected)
-- ─────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);

-- ─────────────────────────────────────────────
-- 4. FIX UNIQUE CONSTRAINTS
--    categories.name: global unique → per-tenant unique
--    sales.invoice_no: global unique → per-tenant unique
-- ─────────────────────────────────────────────

-- Drop old global unique on categories.name
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
-- Add composite unique per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenant_name_unique'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_tenant_name_unique UNIQUE (tenant_id, name);
  END IF;
END$$;

-- Drop old global unique on sales.invoice_no
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_no_key;
-- Add composite unique per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_tenant_invoice_no_unique'
  ) THEN
    ALTER TABLE sales
      ADD CONSTRAINT sales_tenant_invoice_no_unique UNIQUE (tenant_id, invoice_no);
  END IF;
END$$;

-- ─────────────────────────────────────────────
-- 5. ADD PERFORMANCE INDEXES on tenant_id
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS users_tenant_idx            ON users(tenant_id);
CREATE INDEX IF NOT EXISTS suppliers_tenant_idx        ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS customers_tenant_idx        ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS products_tenant_idx         ON products(tenant_id);
CREATE INDEX IF NOT EXISTS purchases_tenant_idx        ON purchases(tenant_id);
CREATE INDEX IF NOT EXISTS sales_tenant_idx            ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS business_profile_tenant_idx ON business_profile(tenant_id);
CREATE INDEX IF NOT EXISTS audit_log_tenant_idx        ON audit_log(tenant_id);

COMMIT;

SELECT 'Migration complete. Run seed-tenant.sql next.' AS status;
