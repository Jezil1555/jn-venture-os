import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import '../styles/ui.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'investor' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/users')
      .then(({ data }) => setUsers(data.users))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are all required.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/register', form);
      setForm({ name: '', email: '', password: '', role: 'investor' });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not create that account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Access</div>
          <h1>Users</h1>
          <p className="lede">Everyone with an account — admins and investors.</p>
        </div>
        <button type="button" className="btn btn-dark" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add Person'}
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">New Account</div>
          {formError && <div className="banner-error">{formError}</div>}
          <form className="form-grid" onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Temporary Password</label>
              <input
                id="password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
              <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0.35rem 0 0' }}>
                Share this with them directly — they can change it from their Account page after
                signing in.
              </p>
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.8rem',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <option value="investor">Investor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-dark" type="submit" disabled={saving} style={{ width: 'fit-content' }}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      <div className="card card-pad">
        {loading && <p style={{ color: 'var(--slate)' }}>Loading…</p>}

        {!loading && users.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: 'var(--step-sm)', color: 'var(--slate)' }}>
        Adding an investor here gives them a login. To let them see a specific company, go to that
        company's page and link them there with their ownership stake.
      </p>
    </div>
  );
}
