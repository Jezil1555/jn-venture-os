import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ui.css';

function formatCurrency(value) {
  const n = Number(value);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [company, setCompany] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [allInvestors, setAllInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [linkForm, setLinkForm] = useState({ investorId: '', ownershipPercentage: '', capitalCommitted: '' });
  const [linkError, setLinkError] = useState(null);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/companies/${id}`);
      setCompany(data.company);

      if (isAdmin) {
        const [investorsRes, usersRes] = await Promise.all([
          api.get(`/companies/${id}/investors`),
          api.get('/users?role=investor'),
        ]);
        setInvestors(investorsRes.data.investors);
        setAllInvestors(usersRes.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load this company.');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLinkInvestor(e) {
    e.preventDefault();
    setLinkError(null);
    if (!linkForm.investorId) {
      setLinkError('Choose an investor to link.');
      return;
    }
    setLinking(true);
    try {
      await api.put(`/companies/${id}/investors/${linkForm.investorId}`, {
        ownershipPercentage: Number(linkForm.ownershipPercentage) || 0,
        capitalCommitted: Number(linkForm.capitalCommitted) || 0,
      });
      setLinkForm({ investorId: '', ownershipPercentage: '', capitalCommitted: '' });
      load();
    } catch (err) {
      setLinkError(err.response?.data?.error || 'Could not link that investor.');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(investorId) {
    try {
      await api.delete(`/companies/${id}/investors/${investorId}`);
      load();
    } catch {
      setError('Could not remove that investor.');
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--slate)' }}>Loading…</p>;
  }

  if (error && !company) {
    return (
      <div>
        <button className="back-link" onClick={() => navigate('/dashboard/companies')}>
          ← Back to companies
        </button>
        <div className="banner-error">{error}</div>
      </div>
    );
  }

  const linkedInvestorIds = new Set(investors.map((i) => i.id));
  const availableToLink = allInvestors.filter((u) => !linkedInvestorIds.has(u.id));

  return (
    <div>
      <button className="back-link" onClick={() => navigate('/dashboard/companies')}>
        ← Back to companies
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">{company.industry || 'Company'}</div>
          <h1>{company.name}</h1>
          {company.description && <p className="lede">{company.description}</p>}
        </div>
        <span className={`badge ${company.status}`}>{company.status}</span>
      </div>

      {!isAdmin && company.ownership_percentage !== undefined && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Your Ownership</div>
            <div className="value">{Number(company.ownership_percentage)}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Capital Committed</div>
            <div className="value">{formatCurrency(company.capital_committed)}</div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card card-pad">
          <div className="section-title">Investors</div>

          {investors.length === 0 && (
            <div className="empty-state">
              <h3>No investors linked yet</h3>
              <p>Link an investor below to give them visibility into this company.</p>
            </div>
          )}

          {investors.length > 0 && (
            <table className="data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Email</th>
                  <th className="num">Ownership</th>
                  <th className="num">Capital Committed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.name}</td>
                    <td>{inv.email}</td>
                    <td className="num">{Number(inv.ownership_percentage)}%</td>
                    <td className="num">{formatCurrency(inv.capital_committed)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleUnlink(inv.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {availableToLink.length > 0 ? (
            <>
              <div className="section-title" style={{ fontSize: 'var(--step-sm)' }}>
                Link an investor
              </div>
              {linkError && <div className="banner-error">{linkError}</div>}
              <form
                className="form-grid"
                style={{ gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end', display: 'grid' }}
                onSubmit={handleLinkInvestor}
              >
                <div className="field">
                  <label htmlFor="investorId">Investor</label>
                  <select
                    id="investorId"
                    value={linkForm.investorId}
                    onChange={(e) => setLinkForm({ ...linkForm, investorId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.8rem',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <option value="">Select…</option>
                    {availableToLink.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ownership">Ownership %</label>
                  <input
                    id="ownership"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={linkForm.ownershipPercentage}
                    onChange={(e) => setLinkForm({ ...linkForm, ownershipPercentage: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="capital">Capital Committed</label>
                  <input
                    id="capital"
                    type="number"
                    step="0.01"
                    min="0"
                    value={linkForm.capitalCommitted}
                    onChange={(e) => setLinkForm({ ...linkForm, capitalCommitted: e.target.value })}
                  />
                </div>
                <button className="btn btn-dark" type="submit" disabled={linking}>
                  {linking ? 'Linking…' : 'Link'}
                </button>
              </form>
            </>
          ) : (
            <p style={{ color: 'var(--slate)', fontSize: 'var(--step-sm)' }}>
              Every investor account is already linked to this company.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
