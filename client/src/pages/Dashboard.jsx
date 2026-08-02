import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ui.css';

function formatCurrency(value) {
  const n = Number(value);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/companies')
      .then(({ data }) => {
        if (!cancelled) setCompanies(data.companies);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load companies.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === 'admin';
  const totalCommitted = companies.reduce((sum, c) => sum + Number(c.capital_committed || 0), 0);
  const activeCount = companies.filter((c) => c.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="lede">
            {isAdmin
              ? 'A holding-level view across every portfolio company.'
              : 'A summary of the companies you hold a position in.'}
          </p>
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {!loading && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">{isAdmin ? 'Portfolio Companies' : 'Companies You Hold'}</div>
            <div className="value">{companies.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Active</div>
            <div className="value">{activeCount}</div>
          </div>
          {!isAdmin && (
            <div className="stat-card">
              <div className="label">Total Capital Committed</div>
              <div className="value">{formatCurrency(totalCommitted)}</div>
            </div>
          )}
        </div>
      )}

      <div className="card card-pad">
        <div className="section-title">
          {isAdmin ? 'Recently Added Companies' : 'Your Companies'}
        </div>

        {loading && <p style={{ color: 'var(--slate)' }}>Loading…</p>}

        {!loading && companies.length === 0 && (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>
              {isAdmin
                ? 'Add your first portfolio company to get started.'
                : "You haven't been linked to a company yet. Reach out to the holding admin."}
            </p>
          </div>
        )}

        {!loading && companies.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Status</th>
                {!isAdmin && <th style={{ textAlign: 'right' }}>Your Stake</th>}
              </tr>
            </thead>
            <tbody>
              {companies.slice(0, 6).map((c) => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => navigate(`/dashboard/companies/${c.id}`)}
                >
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
