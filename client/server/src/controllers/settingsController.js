import { getSettings, updateSettings } from '../models/settingsModel.js';

// GET /api/settings — any authenticated user (it's shown on the investor
// Overview page).
export async function get(req, res) {
  const settings = await getSettings();
  return res.json({ settings });
}

// PATCH /api/settings — admin only.
export async function patch(req, res) {
  const { tagline, brandStory, vision } = req.body;
  const settings = await updateSettings({ tagline, brandStory, vision });
  return res.json({ settings });
}
