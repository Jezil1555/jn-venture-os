import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wallet, ArrowDownToLine, PieChart, Clock } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, CURRENCY_OPTIONS } from '../utils/currency.js';
import ImportSalesPanel from '../components/ImportSalesPanel.jsx';
import '../styles/ui.css';

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

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
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [salesFilter, setSalesFilter] = useState({ from: '', to: '' });

  const [linkForm, setLinkForm] = useState({ investorId: '', ownershipPercentage: '', capitalCommitted: '' });
  const [linkError, setLinkError] = useState(null);
  const [linking, setLinking] = useState(false);

  const [editingInvestorId, setEditingInvestorId] = useState(null);
  const [editStakeForm, setEditStakeForm] = useState({ ownershipPercentage: '', capitalCommitted: '' });
  const [savingStake, setSavingStake] = useState(false);

  const [saleForm, setSaleForm] = useState({ saleDate: '', amount: '', notes: '' });
  const [saleError, setSaleError] = useState(null);
  const [savingSale, setSavingSale] = useState(false);

  const [returnForm, setReturnForm] = useState({ receivedOn: '', amount: '', notes: '' });
  const [returnError, setReturnError] = useState(null);
  const [savingReturn, setSavingReturn] = useState(false);

  const [distForm, setDistForm] = useState({ investorId: '', distributedOn: '', amount: '', notes: '' });
  const [distError, setDistError] = useState(null);
  const [savingDist, setSavingDist] = useState(false);
  const [editingDistId, setEditingDistId] = useState(null);

  const [savingCurrency, setSavingCurrency] = useState(false);

  const loadSales = useCallback(async () => {
    const params = {};
    if (salesFilter.from) params.from = salesFilter.from;
    if (salesFilter.to) params.to = salesFilter.to;
    const { data } = await api.get(`/companies/${id}/sales`, { params });
    setSales(data.sales);
    setSalesTotal(data.total);
  }, [id, salesFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/companies/${id}`);
      setCompany(data.company);

      const distRes = await api.get(`/companies/${id}/distributions`);
      setDistributions(distRes.data.distributions);
      await loadSales();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  useEffect(() => {
    if (!loading) loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesFilter]);

  const chartData = useMemo(() => {
    const byMonth = {};
    for (const s of sales) {
      const key = monthKey(s.sale_date);
      byMonth[key] = (byMonth[key] || 0) + Number(s.amount);
    }
    return Object.keys(byMonth)
      .sort()
      .map((key) => ({ month: monthLabel(key), total: byMonth[key] }));
  }, [sales]);

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

  function startEditStake(inv) {
    setEditingInvestorId(inv.id);
    setEditStakeForm({
      ownershipPercentage: String(inv.ownership_percentage),
      capitalCommitted: String(inv.capital_committed),
    });
  }

  async function handleSaveStake(investorId) {
    setSavingStake(true);
    try {
      await api.put(`/companies/${id}/investors/${investorId}`, {
        ownershipPercentage: Number(editStakeForm.ownershipPercentage) || 0,
        capitalCommitted: Number(editStakeForm.capitalCommitted) || 0,
      });
      setEditingInvestorId(null);
      load();
    } catch {
      setError('Could not update that stake.');
    } finally {
      setSavingStake(false);
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

  function startEditDistribution(d) {
    setEditingDistId(d.id);
    setDistForm({
      investorId: d.investor_id,
      distributedOn: d.distributed_on.slice(0, 10),
      amount: String(d.amount),
      notes: d.notes || '',
    });
  }

  function cancelEditDistribution() {
    setEditingDistId(null);
    setDistForm({ investorId: '', distributedOn: '', amount: '', notes: '' });
  }

  async function handleSubmitDistribution(e) {
    e.preventDefault();
    setDistError(null);
    if (!distForm.investorId || !distForm.distributedOn || distForm.amount === '') {
      setDistError('Investor, date, and amount are all required.');
      return;
    }
    setSavingDist(true);
    try {
      if (editingDistId) {
        await api.patch(`/companies/${id}/distributions/${editingDistId}`, {
          distributedOn: distForm.distributedOn,
          amount: Number(distForm.amount),
          notes: distForm.notes,
        });
      } else {
        await api.post(`/companies/${id}/distributions`, {
          investorId: distForm.investorId,
          distributedOn: distForm.distributedOn,
          amount: Number(distForm.amount),
          notes: distForm.notes,
        });
      }
      setDistForm({ investorId: '', distributedOn: '', amount: '', notes: '' });
      setEditingDistId(null);
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
      if (editingDistId === distId) cancelEditDistribution();
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

  async function handleDeleteCompany() {
    if (deleteConfirmText.trim() !== company.name) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/companies/${id}`);
      navigate('/dashboard/companies', { replace: true });
    } catch {
      setError('Could not delete this company.');
      setDeleting(false);
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
          <div className="stat-card tone-amber">
            <div className="label-row">
              <TrendingUp size={15} />
              <div className="label">Total Sales</div>
            </div>
            <div className="value">{formatCurrency(company.total_sales, currency)}</div>
          </div>
          <div className="stat-card tone-teal">
            <div className="label-row">
              <Wallet size={15} />
              <div className="label">Total Invested</div>
            </div>
            <div className="value">{formatCurrency(company.total_invested, currency)}</div>
          </div>
          <div className="stat-card tone-brass">
            <div className="label-row">
              <ArrowDownToLine size={15} />
              <div className="label">Returns Received</div>
            </div>
            <div className="value">{formatCurrency(company.total_returns_received, currency)}</div>
          </div>
        </div>
      )}

      {!isAdmin && company.ownership_percentage !== undefined && (
        <div className="stat-grid">
          <div className="stat-card tone-teal">
            <div className="label-row">
              <PieChart size={15} />
              <div className="label">Your Ownership</div>
            </div>
            <div className="value">{Number(company.ownership_percentage)}%</div>
          </div>
          <div className="stat-card tone-amber">
            <div className="label-row">
              <Wallet size={15} />
              <div className="label">Capital Committed</div>
            </div>
            <div className="value">{formatCurrency(company.capital_committed, currency)}</div>
          </div>
          <div className="stat-card tone-violet">
            <div className="label-row">
              <TrendingUp size={15} />
              <div className="label">Returns %</div>
            </div>
            <div className="value">{Number(company.returns_percent || 0).toFixed(1)}%</div>
          </div>
          <div className="stat-card tone-positive">
            <div className="label-row">
              <ArrowDownToLine size={15} />
              <div className="label">Received So Far</div>
            </div>
            <div className="value">{formatCurrency(company.returns_received_so_far, currency)}</div>
          </div>
          <div className="stat-card tone-brass">
            <div className="label-row">
              <Clock size={15} />
              <div className="label">Pending</div>
            </div>
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

        {isAdmin && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ImportSalesPanel companyId={id} currency={currency} onImported={load} />
          </div>
        )}

        {sales.length >= 2 && (
          <div style={{ height: 180, marginBottom: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--slate)' }}
                  axisLine={{ stroke: 'var(--line)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--slate)' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => formatCurrency(v, currency)}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value, currency)}
                  contentStyle={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <Bar dataKey="total" fill="var(--accent-amber)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div
          className="form-grid"
          style={{ gridTemplateColumns: '1fr 1fr auto', alignItems: 'end', display: 'grid', marginBottom: '1rem' }}
        >
          <div className="field">
            <label htmlFor="salesFrom">From</label>
            <input
              id="salesFrom"
              type="date"
              value={salesFilter.from}
              onChange={(e) => setSalesFilter({ ...salesFilter, from: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="salesTo">To</label>
            <input
              id="salesTo"
              type="date"
              value={salesFilter.to}
              onChange={(e) => setSalesFilter({ ...salesFilter, to: e.target.value })}
            />
          </div>
          {(salesFilter.from || salesFilter.to) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSalesFilter({ from: '', to: '' })}
            >
              Clear
            </button>
          )}
        </div>

        {sales.length === 0 && (
          <div className="empty-state">
            <h3>No sales in this range</h3>
            <p>
              {isAdmin
                ? 'Add an entry below, or clear the date filter above.'
                : 'Nothing has been logged for this period.'}
            </p>
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
                {investors.map((inv) =>
                  editingInvestorId === inv.id ? (
                    <tr key={inv.id}>
                      <td>{inv.name}</td>
                      <td>{inv.email}</td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editStakeForm.ownershipPercentage}
                          onChange={(e) =>
                            setEditStakeForm({ ...editStakeForm, ownershipPercentage: e.target.value })
                          }
                          style={{ width: '90px', textAlign: 'right' }}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editStakeForm.capitalCommitted}
                          onChange={(e) =>
                            setEditStakeForm({ ...editStakeForm, capitalCommitted: e.target.value })
                          }
                          style={{ width: '130px', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-dark"
                          disabled={savingStake}
                          onClick={() => handleSaveStake(inv.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          {savingStake ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setEditingInvestorId(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={inv.id}>
                      <td>{inv.name}</td>
                      <td>{inv.email}</td>
                      <td className="num">{Number(inv.ownership_percentage)}%</td>
                      <td className="num">{formatCurrency(inv.capital_committed, currency)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => startEditStake(inv)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleUnlink(inv.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                )}
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

      <div className="card card-pad" style={{ marginBottom: isAdmin ? '1.5rem' : 0 }}>
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
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => startEditDistribution(d)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
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
              {editingDistId ? 'Edit payout' : 'Record a payout'}
            </div>
            {distError && <div className="banner-error">{distError}</div>}
            <form
              className="form-grid"
              style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr auto', alignItems: 'end', display: 'grid' }}
              onSubmit={handleSubmitDistribution}
            >
              <div className="field">
                <label htmlFor="distInvestor">Investor</label>
                <select
                  id="distInvestor"
                  value={distForm.investorId}
                  disabled={!!editingDistId}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-dark" type="submit" disabled={savingDist}>
                  {savingDist ? 'Saving…' : editingDistId ? 'Update' : 'Add'}
                </button>
                {editingDistId && (
                  <button type="button" className="btn btn-outline" onClick={cancelEditDistribution}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="card card-pad" style={{ borderColor: 'var(--negative)' }}>
          <div className="section-title" style={{ color: 'var(--negative)' }}>
            Danger Zone
          </div>
          <p style={{ fontSize: 'var(--step-sm)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Deleting a company removes it and its sales, returns, and distribution history.
            Investors linked to it lose access immediately. This cannot be undone from here.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--negative)', color: 'var(--white)' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete This Company
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--step-sm)', marginBottom: '0.75rem' }}>
                Type <strong className="mono">{company.name}</strong> below to confirm.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={company.name}
                  autoFocus
                  style={{
                    padding: '0.6rem 0.8rem',
                    border: '1px solid var(--negative)',
                    borderRadius: 'var(--radius-sm)',
                    minWidth: '220px',
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--negative)', color: 'var(--white)' }}
                  disabled={deleting || deleteConfirmText.trim() !== company.name}
                  onClick={handleDeleteCompany}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
