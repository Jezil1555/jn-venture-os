import { getSettings, updateSettings } from '../models/settingsModel.js';
import { sendTestEmail } from '../services/emailService.js';

export async function get(req, res) {
  const settings = await getSettings();
  return res.json({ settings });
}

export async function patch(req, res) {
  const { tagline, purpose, vision, mission, promise, brandStory, coreValues } = req.body;
  const settings = await updateSettings({ tagline, purpose, vision, mission, promise, brandStory, coreValues });
  return res.json({ settings });
}

export async function postTestEmail(req, res) {
  const result = await sendTestEmail(req.user.email);
  if (!result.success) {
    return res.status(502).json({ error: `Could not send: ${result.error}` });
  }
  return res.json({ sent: true, to: req.user.email });
}
