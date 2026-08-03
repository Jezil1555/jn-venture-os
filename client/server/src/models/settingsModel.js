import { query } from '../config/db.js';

export async function getSettings() {
  const { rows } = await query(
    `SELECT id, tagline, brand_story, vision, updated_at FROM org_settings WHERE id = 1`
  );
  return rows[0] || null;
}

export async function updateSettings({ tagline, brandStory, vision }) {
  const { rows } = await query(
    `INSERT INTO org_settings (id, tagline, brand_story, vision)
     VALUES (1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE
       SET tagline = EXCLUDED.tagline,
           brand_story = EXCLUDED.brand_story,
           vision = EXCLUDED.vision,
           updated_at = now()
     RETURNING id, tagline, brand_story, vision, updated_at`,
    [tagline || null, brandStory || null, vision || null]
  );
  return rows[0];
}
