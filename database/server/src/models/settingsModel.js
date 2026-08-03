import { query } from '../config/db.js';

export async function getSettings() {
  const { rows } = await query(
    `SELECT id, tagline, purpose, vision, mission, promise, brand_story, core_values, updated_at
     FROM org_settings WHERE id = 1`
  );
  return rows[0] || null;
}

export async function updateSettings({ tagline, purpose, vision, mission, promise, brandStory, coreValues }) {
  const { rows } = await query(
    `INSERT INTO org_settings (id, tagline, purpose, vision, mission, promise, brand_story, core_values)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE
       SET tagline = EXCLUDED.tagline,
           purpose = EXCLUDED.purpose,
           vision = EXCLUDED.vision,
           mission = EXCLUDED.mission,
           promise = EXCLUDED.promise,
           brand_story = EXCLUDED.brand_story,
           core_values = EXCLUDED.core_values,
           updated_at = now()
     RETURNING id, tagline, purpose, vision, mission, promise, brand_story, core_values, updated_at`,
    [
      tagline || null,
      purpose || null,
      vision || null,
      mission || null,
      promise || null,
      brandStory || null,
      coreValues || null,
    ]
  );
  return rows[0];
}
