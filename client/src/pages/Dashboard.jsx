import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import '../styles/ui.css';
import './Dashboard.css';

// Companies can each carry a different currency, so a single blended sum
// across all of them would be misleading (adding USD to INR is meaningless).
// Group and sum per currency instead, and show one figure per currency
// actually in use.
function sumByCurrency(companies, field) {
  const totals = {};
  for (const c of companies) {
    const currency = c.currency || 'USD';
    totals[currency] = (totals[currency] || 0) + Number(c[field] || 0);
  }
  return totals;
}

function formatSince(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // These are fetched independently on purpose — the brand hero is a
    // nice-to-have, and its failure should never take down the actual
    // companies list, which is the page's real job.
    api
      .get('/companies')
      .then(({ data }) => {
        if (!cancelled) setCompanies(data.companies);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your companies.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    api
      .get('/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data.settings);
      })
      .catch(() => {
        // Silent on purpose: no hero section is a fine fallback, it
        // shouldn't block or error out the rest of the dashboard.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = companies.filter((c) => c.status === 'active').length;
  const committedByCurrency = !isAdmin ? sumByCurrency(companies, 'capital_committed') : {};

  return (
    <div>
      {!isAdmin && !loading && settings && (settings.tagline || settings.brand_story || settings.vision) && (
        <div className="brand-hero">
          <div className="ledger-rules brand-hero-rules" />
          <div className="brand-hero-content">
            <div className="brand-hero-mark">
              JN Venture<span>OS</span>
            </div>
            {settings.tagline && <p className="brand-hero-tagline">{settings.tagline}</p>}
            <div className="brand-hero-columns">
              {settings.brand_story && (
                <div>
                  <div className="brand-hero-label">Our Story</div>
                  <p>{settings.brand_story}</p>
                </div>
              )}
              {settings.vision && (
                <div>
                  <div className="brand-hero-label">Our Vision</div>
                  <p>{settings.vision}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        <div className="chip-row">
          <div className="chip">
            <span className="chip-value">{companies.length}</span>
            <span className="chip-label">{isAdmin ? 'Companies' : 'Held'}</span>
          </div>
          <div className="chip">
            <span className="chip-value">{activeCount}</span>
            <span className="chip-label">Active</span>
          </div>
          {!isAdmin &&
            Object.entries(committedByCurrency).map(([currency, total]) => (
              <div className="chip" key={currency}>
                <span className="chip-value mono">{formatCurrency(total, currency)}</span>
                <span className="chip-label">Committed{Object.keys(committedByCurrency).length > 1 ? ` · ${currency}` : ''}</span>
              </div>
            ))}
        </div>
      )}

      <div className="card card-pad">
        <div className="section-title">
          {isAdmin ? 'Portfolio Companies' : 'Your Companies'}
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
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Since</th>
                  <th>Status</th>
                  {isAdmin ? (
                    <>
                      <th className="num">Sales (This Month)</th>
                      <th className="num">Total Invested</th>
                      <th className="num">Returns Received</th>
                    </>
                  ) : (
                    <>
                      <th className="num">Invested</th>
                      <th className="num">Returns %</th>
                      <th className="num">Received So Far</th>
                      <th className="num">Pending</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className="clickable"
                    onClick={() => navigate(`/dashboard/companies/${c.id}`)}
                  >
                    <td>{c.name}</td>
                    <td style={{ color: 'var(--slate)' }}>{formatSince(c.created_at)}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                    {isAdmin ? (
                      <>
                        <td className="num">{formatCurrency(c.sales_this_month, c.currency)}</td>
                        <td className="num">{formatCurrency(c.total_invested, c.currency)}</td>
                        <td className="num">{formatCurrency(c.total_returns_received, c.currency)}</td>
                      </>
                    ) : (
                      <>
                        <td className="num">{formatCurrency(c.capital_committed, c.currency)}</td>
                        <td className="num">{Number(c.returns_percent || 0).toFixed(1)}%</td>
                        <td className="num">{formatCurrency(c.returns_received_so_far, c.currency)}</td>
                        <td className="num">{formatCurrency(c.pending_to_receive, c.currency)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
