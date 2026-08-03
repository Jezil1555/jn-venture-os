-- Migration 004: remaining brand book content
--
-- Adds Purpose, Mission, Promise, and Core Values to org_settings, and
-- backfills them with the real text from the Evercrest Holdings brand
-- book. Paste into your Neon SQL Editor and click Run.
--
-- Note: the UPDATE only fills these in if they're currently empty, so
-- it won't stomp on anything you've already customized from Settings.

ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS promise TEXT;
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS core_values TEXT;

UPDATE org_settings
SET
  purpose = COALESCE(purpose, 'Build enduring businesses that create generational value.'),
  mission = COALESCE(mission, 'Invest with discipline, lead with integrity, build enduring partnerships, and create sustainable value across every business we own.'),
  promise = COALESCE(promise, 'Every decision protects trust before profit.'),
  core_values = COALESCE(core_values, 'Trust Above All
Stewardship
Long-Term Thinking
Partnership
Excellence
Accountability
Respect
Sustainable Growth')
WHERE id = 1;
