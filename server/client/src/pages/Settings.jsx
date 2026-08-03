import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import '../styles/ui.css';

const textareaStyle = {
  width: '100%',
  padding: '0.7rem 0.8rem',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--step-base)',
  resize: 'vertical',
};

export default function Settings() {
  const [form, setForm] = useState({
    tagline: '',
    purpose: '',
    vision: '',
    mission: '',
    promise: '',
    brandStory: '',
    coreValues: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => {
        const s = data.settings || {};
        setForm({
          tagline: s.tagline || '',
          purpose: s.purpose || '',
          vision: s.vision || '',
          mission: s.mission || '',
          promise: s.promise || '',
          brandStory: s.brand_story || '',
          coreValues: s.core_values || '',
        });
      })
      .catch(() => setError('Could not load current settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await api.patch('/settings', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save these settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Brand & Vision</h1>
          <p className="lede">
            This is what your investors see on their Home page when they log in.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        {loading && <p style={{ color: 'var(--slate)' }}>Loading…</p>}

        {!loading && (
          <form className="form-grid" onSubmit={handleSubmit}>
            {error && <div className="banner-error">{error}</div>}
            {success && (
              <div
                style={{
                  background: '#e5f0ea',
                  color: 'var(--positive)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--step-sm)',
                }}
              >
                Saved. Investors will see this next time they load their Home page.
              </div>
            )}

            <div className="field">
              <label htmlFor="tagline">Tagline</label>
              <input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="A short line shown right under the logo"
              />
            </div>

            <div className="field">
              <label htmlFor="purpose">Purpose</label>
              <input
                id="purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="One sentence — why the company exists"
              />
            </div>

            <div className="field">
              <label htmlFor="vision">Vision</label>
              <textarea
                id="vision"
                value={form.vision}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
                rows={3}
                placeholder="Where the holding company is headed…"
                style={textareaStyle}
              />
            </div>

            <div className="field">
              <label htmlFor="mission">Mission</label>
              <textarea
                id="mission"
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
                rows={3}
                placeholder="How the company operates day to day…"
                style={textareaStyle}
              />
            </div>

            <div className="field">
              <label htmlFor="promise">Promise</label>
              <input
                id="promise"
                value={form.promise}
                onChange={(e) => setForm({ ...form, promise: e.target.value })}
                placeholder="One sentence — the commitment made to investors"
              />
            </div>

            <div className="field">
              <label htmlFor="brandStory">Our Story</label>
              <textarea
                id="brandStory"
                value={form.brandStory}
                onChange={(e) => setForm({ ...form, brandStory: e.target.value })}
                rows={5}
                placeholder="How the holding company got started, what it stands for…"
                style={textareaStyle}
              />
            </div>

            <div className="field">
              <label htmlFor="coreValues">Core Values</label>
              <textarea
                id="coreValues"
                value={form.coreValues}
                onChange={(e) => setForm({ ...form, coreValues: e.target.value })}
                rows={5}
                placeholder="One value per line — shown as a row of tags"
                style={textareaStyle}
              />
              <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0.35rem 0 0' }}>
                One per line.
              </p>
            </div>

            <button className="btn btn-dark" type="submit" disabled={saving} style={{ width: 'fit-content' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
