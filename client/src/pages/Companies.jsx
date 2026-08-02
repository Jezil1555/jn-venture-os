import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ui.css';

export default function Companies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', description: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  function loadCompanies() {
    setLoading(true);
    api
      .get('/companies')
      .then(({ data }) => setCompanies(data.companies))
      .catch(() => setError('Could not load companies.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadCompanies, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Company name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/companies', form);
      setForm({ name: '', industry: '', description: '' });
      setShowForm(false);
      loadCompanies();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not create the company.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Portfolio</div>
          <h1>Companies</h1>
          <p className="lede">
            {isAdmin
              ? 'Every company under the holding structure.'
              : 'Companies you currently hold a position in.'}
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-dark" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Add Company'}
          </button>
        )}
      </div>

      {error && <div className="banner-error">{error}</div>}

      {isAdmin && showForm && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">New Company</div>
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
              <label htmlFor="industry">Industry</label>
              <input
                id="industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. Logistics"
              />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <button className="btn btn-dark" type="submit" disabled={saving} style={{ width: 'fit-content' }}>
              {saving ? 'Saving…' : 'Create Company'}
            </button>
          </form>
        </div>
      )}

      <div className="card card-pad">
        {loading && <p style={{ color: 'var(--slate)' }}>Loading…</p>}

        {!loading && companies.length === 0 && (
          <div className="empty-state">
            <h3>No companies yet</h3>
            <p>
              {isAdmin
                ? 'Add your first portfolio company using the button above.'
                : "You haven't been linked to a company yet."}
            </p>
          </div>
        )}

        {!loading && companies.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Status</th>
                {!isAdmin && <th style={{ textAlign: 'right' }}>Your Stake</th>}
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/dashboard/companies/${c.id}`)}>
                  <td>{c.name}</td>
                  <td>{c.industry || '—'}</td>
                  <td>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                  {!isAdmin && (
                    <td className="num">
                      {c.ownership_percentage ? `${Number(c.ownership_percentage)}%` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
