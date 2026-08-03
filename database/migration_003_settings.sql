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
    'Enduring Trust. Lasting Value.',
    'Evercrest Holdings was founded on one belief: trust is the most valuable asset any business can possess. We acquire, build and grow businesses with patience rather than speculation. Our ambition is not simply to own companies, but to strengthen them and leave them better for future generations.',
    'To become one of the world''s most trusted holding companies, building exceptional businesses that create lasting prosperity for generations.'
)
ON CONFLICT (id) DO NOTHING;
