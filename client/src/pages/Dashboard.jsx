import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import '../styles/ui.css';

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
  const activeCount = companies.filter((c) => c.status === 'active').length;
  const committedByCurrency = !isAdmin ? sumByCurrency(companies, 'capital_committed') : {};

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
          {!isAdmin &&
            Object.entries(committedByCurrency).map(([currency, total]) => (
              <div className="stat-card" key={currency}>
                <div className="label">
                  Capital Committed{Object.keys(committedByCurrency).length > 1 ? ` (${currency})` : ''}
                </div>
                <div className="value">{formatCurrency(total, currency)}</div>
              </div>
            ))}
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
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  {isAdmin ? (
                    <>
                      <th className="num">Total Sales</th>
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
                {companies.slice(0, 6).map((c) => (
                  <tr
                    key={c.id}
                    className="clickable"
                    onClick={() => navigate(`/dashboard/companies/${c.id}`)}
                  >
                    <td>{c.name}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                    {isAdmin ? (
                      <>
                        <td className="num">{formatCurrency(c.total_sales, c.currency)}</td>
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
