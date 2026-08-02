import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import '../styles/ui.css';

export default function Settings() {
  const [form, setForm] = useState({ tagline: '', brandStory: '', vision: '' });
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
          brandStory: s.brand_story || '',
          vision: s.vision || '',
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
            This is what your investors see at the top of their Overview page when they log in.
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
                Saved. Investors will see this next time they load their dashboard.
              </div>
            )}

            <div className="field">
              <label htmlFor="tagline">Tagline</label>
              <input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="A short line shown right under the wordmark"
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
                style={{
                  width: '100%',
                  padding: '0.7rem 0.8rem',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--step-base)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="vision">Our Vision</label>
              <textarea
                id="vision"
                value={form.vision}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
                rows={4}
                placeholder="Where the holding company is headed…"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.8rem',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--step-base)',
                  resize: 'vertical',
                }}
              />
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
