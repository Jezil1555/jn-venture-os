import React, { useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ui.css';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Account</div>
          <h1>{user?.name}</h1>
          <p className="lede">{user?.email}</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 420 }}>
        <div className="section-title">Change Password</div>

        {error && <div className="banner-error">{error}</div>}
        {success && (
          <div
            style={{
              background: '#e5f0ea',
              color: 'var(--positive)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--step-sm)',
              marginBottom: '1.25rem',
            }}
          >
            Password changed. Use it next time you sign in.
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <button className="btn btn-dark" type="submit" disabled={saving} style={{ width: 'fit-content' }}>
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
