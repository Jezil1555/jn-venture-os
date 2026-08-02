-- Migration 003: organization settings (brand story / vision)
--
-- Paste into your Neon SQL Editor and click Run. Safe to run once —
-- the singleton row is only inserted if it doesn't already exist.

CREATE TABLE IF NOT EXISTS org_settings (
    id          INT PRIMARY KEY DEFAULT 1,
    tagline     VARCHAR(300),
    brand_story TEXT,
    vision      TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (id = 1)
);

INSERT INTO org_settings (id, tagline, brand_story, vision)
VALUES (
    1,
    'One ledger for every company you hold, and every investor who holds a piece of it.',
    'Write a short paragraph here about how JN Ventures got started and what it stands for — this is edited from Settings, in the app, by an admin.',
    'Write a sentence or two here about where the holding company is headed — also edited from Settings.'
)
ON CONFLICT (id) DO NOTHING;
