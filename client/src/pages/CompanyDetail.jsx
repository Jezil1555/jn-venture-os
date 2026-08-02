import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, CURRENCY_OPTIONS } from '../utils/currency.js';
import '../styles/ui.css';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [company, setCompany] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [allInvestors, setAllInvestors] = useState([]);
  const [sales, setSales] = useState([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [returns, setReturns] = useState([]);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [linkForm, setLinkForm] = useState({ investorId: '', ownershipPercentage: '', capitalCommitted: '' });
  const [linkError, setLinkError] = useState(null);
  const [linking, setLinking] = useState(false);

  const [saleForm, setSaleForm] = useState({ saleDate: '', amount: '', notes: '' });
  const [saleError, setSaleError] = useState(null);
  const [savingSale, setSavingSale] = useState(false);

  const [returnForm, setReturnForm] = useState({ receivedOn: '', amount: '', notes: '' });
  const [returnError, setReturnError] = useState(null);
  const [savingReturn, setSavingReturn] = useState(false);

  const [distForm, setDistForm] = useState({ investorId: '', distributedOn: '', amount: '', notes: '' });
  const [distError, setDistError] = useState(null);
  const [savingDist, setSavingDist] = useState(false);

  const [savingCurrency, setSavingCurrency] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/companies/${id}`);
      setCompany(data.company);

      const [salesRes, distRes] = await Promise.all([
        api.get(`/companies/${id}/sales`),
        api.get(`/companies/${id}/distributions`),
      ]);
      setSales(salesRes.data.sales);
      setSalesTotal(salesRes.data.total);
      setDistributions(distRes.data.distributions);

      if (isAdmin) {
        const [investorsRes, usersRes, returnsRes] = await Promise.all([
          api.get(`/companies/${id}/investors`),
          api.get('/users?role=investor'),
          api.get(`/companies/${id}/returns`),
        ]);
        setInvestors(investorsRes.data.investors);
        setAllInvestors(usersRes.data.users);
        setReturns(returnsRes.data.returns);
        setReturnsTotal(returnsRes.data.total);
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

  async function handleAddSale(e) {
    e.preventDefault();
    setSaleError(null);
    if (!saleForm.saleDate || saleForm.amount === '') {
      setSaleError('Date and amount are both required.');
      return;
    }
    setSavingSale(true);
    try {
      await api.post(`/companies/${id}/sales`, {
        saleDate: saleForm.saleDate,
        amount: Number(saleForm.amount),
        notes: saleForm.notes,
      });
      setSaleForm({ saleDate: '', amount: '', notes: '' });
      load();
    } catch (err) {
      setSaleError(err.response?.data?.error || 'Could not save that entry.');
    } finally {
      setSavingSale(false);
    }
  }

  async function handleDeleteSale(saleId) {
    try {
      await api.delete(`/companies/${id}/sales/${saleId}`);
      load();
    } catch {
      setError('Could not remove that entry.');
    }
  }

  async function handleAddReturn(e) {
    e.preventDefault();
    setReturnError(null);
    if (!returnForm.receivedOn || returnForm.amount === '') {
      setReturnError('Date and amount are both required.');
      return;
    }
    setSavingReturn(true);
    try {
      await api.post(`/companies/${id}/returns`, {
        receivedOn: returnForm.receivedOn,
        amount: Number(returnForm.amount),
        notes: returnForm.notes,
      });
      setReturnForm({ receivedOn: '', amount: '', notes: '' });
      load();
    } catch (err) {
      setReturnError(err.response?.data?.error || 'Could not save that entry.');
    } finally {
      setSavingReturn(false);
    }
  }

  async function handleDeleteReturn(returnId) {
    try {
      await api.delete(`/companies/${id}/returns/${returnId}`);
      load();
    } catch {
      setError('Could not remove that entry.');
    }
  }

  async function handleAddDistribution(e) {
    e.preventDefault();
    setDistError(null);
    if (!distForm.investorId || !distForm.distributedOn || distForm.amount === '') {
      setDistError('Investor, date, and amount are all required.');
      return;
    }
    setSavingDist(true);
    try {
      await api.post(`/companies/${id}/distributions`, {
        investorId: distForm.investorId,
        distributedOn: distForm.distributedOn,
        amount: Number(distForm.amount),
        notes: distForm.notes,
      });
      setDistForm({ investorId: '', distributedOn: '', amount: '', notes: '' });
      load();
    } catch (err) {
      setDistError(err.response?.data?.error || 'Could not save that payout.');
    } finally {
      setSavingDist(false);
    }
  }

  async function handleDeleteDistribution(distId) {
    try {
      await api.delete(`/companies/${id}/distributions/${distId}`);
      load();
    } catch {
      setError('Could not remove that entry.');
    }
  }

  async function handleCurrencyChange(newCurrency) {
    setSavingCurrency(true);
    try {
      await api.patch(`/companies/${id}`, { currency: newCurrency });
      load();
    } catch {
      setError('Could not update the currency.');
    } finally {
      setSavingCurrency(false);
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
  const currency = company.currency || 'USD';

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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAdmin ? (
            <select
              value={currency}
              disabled={savingCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="mono"
              style={{
                padding: '0.4rem 0.6rem',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--white)',
              }}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <span className="mono" style={{ color: 'var(--slate)', fontSize: 'var(--step-sm)' }}>
              {currency}
            </span>
          )}
          <span className={`badge ${company.status}`}>{company.status}</span>
        </div>
      </div>

      {isAdmin && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total Sales</div>
            <div className="value">{formatCurrency(company.total_sales, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Invested</div>
            <div className="value">{formatCurrency(company.total_invested, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Returns Received</div>
            <div className="value">{formatCurrency(company.total_returns_received, currency)}</div>
          </div>
        </div>
      )}

      {!isAdmin && company.ownership_percentage !== undefined && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Your Ownership</div>
            <div className="value">{Number(company.ownership_percentage)}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Capital Committed</div>
            <div className="value">{formatCurrency(company.capital_committed, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Returns %</div>
            <div className="value">{Number(company.returns_percent || 0).toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Received So Far</div>
            <div className="value">{formatCurrency(company.returns_received_so_far, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending</div>
            <div className="value">{formatCurrency(company.pending_to_receive, currency)}</div>
          </div>
        </div>
      )}

      <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
        <div
          className="section-title"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <span>Sales</span>
          <span className="mono" style={{ fontSize: 'var(--step-sm)', color: 'var(--slate)' }}>
            Total: {formatCurrency(salesTotal, currency)}
          </span>
        </div>

        {sales.length === 0 && (
          <div className="empty-state">
            <h3>No sales recorded yet</h3>
            <p>{isAdmin ? 'Add the first entry below.' : 'Nothing has been logged for this company yet.'}</p>
          </div>
        )}

        {sales.length > 0 && (
          <table className="data-table" style={{ marginBottom: isAdmin ? '1.5rem' : 0 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Notes</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                  <td className="num">{formatCurrency(s.amount, currency)}</td>
                  <td>{s.notes || '—'}</td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="btn btn-outline" onClick={() => handleDeleteSale(s.id)}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isAdmin && (
          <>
            <div className="section-title" style={{ fontSize: 'var(--step-sm)' }}>
              Log a sale
            </div>
            {saleError && <div className="banner-error">{saleError}</div>}
            <form
              className="form-grid"
              style={{ gridTemplateColumns: '1fr 1fr 2fr auto', alignItems: 'end', display: 'grid' }}
              onSubmit={handleAddSale}
            >
              <div className="field">
                <label htmlFor="saleDate">Date</label>
                <input
                  id="saleDate"
                  type="date"
                  value={saleForm.saleDate}
                  onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="saleAmount">Amount</label>
                <input
                  id="saleAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={saleForm.amount}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="saleNotes">Notes</label>
                <input
                  id="saleNotes"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <button className="btn btn-dark" type="submit" disabled={savingSale}>
                {savingSale ? 'Saving…' : 'Add'}
              </button>
            </form>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
          <div
            className="section-title"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <span>Returns Received</span>
            <span className="mono" style={{ fontSize: 'var(--step-sm)', color: 'var(--slate)' }}>
              Total: {formatCurrency(returnsTotal, currency)}
            </span>
          </div>
          <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Money that's come back to the holding company from this portfolio company — visible to
            you only. Investors see their own share as "Pending" instead, once you distribute it.
          </p>

          {returns.length === 0 && (
            <div className="empty-state">
              <h3>No returns recorded yet</h3>
              <p>Add the first entry below.</p>
            </div>
          )}

          {returns.length > 0 && (
            <table className="data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.received_on).toLocaleDateString()}</td>
                    <td className="num">{formatCurrency(r.amount, currency)}</td>
                    <td>{r.notes || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDeleteReturn(r.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="section-title" style={{ fontSize: 'var(--step-sm)' }}>
            Log a return
          </div>
          {returnError && <div className="banner-error">{returnError}</div>}
          <form
            className="form-grid"
            style={{ gridTemplateColumns: '1fr 1fr 2fr auto', alignItems: 'end', display: 'grid' }}
            onSubmit={handleAddReturn}
          >
            <div className="field">
              <label htmlFor="returnDate">Date</label>
              <input
                id="returnDate"
                type="date"
                value={returnForm.receivedOn}
                onChange={(e) => setReturnForm({ ...returnForm, receivedOn: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="returnAmount">Amount</label>
              <input
                id="returnAmount"
                type="number"
                step="0.01"
                min="0"
                value={returnForm.amount}
                onChange={(e) => setReturnForm({ ...returnForm, amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="returnNotes">Notes</label>
              <input
                id="returnNotes"
                value={returnForm.notes}
                onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <button className="btn btn-dark" type="submit" disabled={savingReturn}>
              {savingReturn ? 'Saving…' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
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
                    <td className="num">{formatCurrency(inv.capital_committed, currency)}</td>
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

      <div className="card card-pad">
        <div className="section-title">Distributions</div>
        {!isAdmin && (
          <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Money actually paid out to you for this company.
          </p>
        )}

        {distributions.length === 0 && (
          <div className="empty-state">
            <h3>No distributions yet</h3>
            <p>
              {isAdmin
                ? 'Record a payout below once you distribute money to an investor.'
                : "You haven't received a payout for this company yet."}
            </p>
          </div>
        )}

        {distributions.length > 0 && (
          <table className="data-table" style={{ marginBottom: isAdmin ? '1.5rem' : 0 }}>
            <thead>
              <tr>
                {isAdmin && <th>Investor</th>}
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Notes</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {distributions.map((d) => (
                <tr key={d.id}>
                  {isAdmin && <td>{d.investor_name}</td>}
                  <td>{new Date(d.distributed_on).toLocaleDateString()}</td>
                  <td className="num">{formatCurrency(d.amount, currency)}</td>
                  <td>{d.notes || '—'}</td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDeleteDistribution(d.id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isAdmin && investors.length > 0 && (
          <>
            <div className="section-title" style={{ fontSize: 'var(--step-sm)' }}>
              Record a payout
            </div>
            {distError && <div className="banner-error">{distError}</div>}
            <form
              className="form-grid"
              style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr auto', alignItems: 'end', display: 'grid' }}
              onSubmit={handleAddDistribution}
            >
              <div className="field">
                <label htmlFor="distInvestor">Investor</label>
                <select
                  id="distInvestor"
                  value={distForm.investorId}
                  onChange={(e) => setDistForm({ ...distForm, investorId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.8rem',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <option value="">Select…</option>
                  {investors.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="distDate">Date</label>
                <input
                  id="distDate"
                  type="date"
                  value={distForm.distributedOn}
                  onChange={(e) => setDistForm({ ...distForm, distributedOn: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="distAmount">Amount</label>
                <input
                  id="distAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={distForm.amount}
                  onChange={(e) => setDistForm({ ...distForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="distNotes">Notes</label>
                <input
                  id="distNotes"
                  value={distForm.notes}
                  onChange={(e) => setDistForm({ ...distForm, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <button className="btn btn-dark" type="submit" disabled={savingDist}>
                {savingDist ? 'Saving…' : 'Add'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
