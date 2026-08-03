-- Migration 002: per-company currency
--
-- Your database already exists (schema.sql already ran once), so this is
-- a standalone ALTER, not a re-run of schema.sql. Paste this into your
-- Neon SQL Editor and click Run — it's safe to run even if some of it
-- was already applied, since everything here is idempotent.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD', 'INR', 'QAR'));
