import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wallet, ArrowDownToLine, PieChart, Clock, Landmark, Building2 } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, CURRENCY_OPTIONS } from '../utils/currency.js';
import ImportSalesPanel from '../components/ImportSalesPanel.jsx';
import ExportPanel from '../components/ExportPanel.jsx';
import ImportReturnsPanel from '../components/ImportReturnsPanel.jsx';
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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${pad2(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${pad2(m + 1)}-${pad2(lastDay)}`;
  return { from, to };
}

function fullMonthName(y, m) {
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
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
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [salesFilter, setSalesFilter] = useState(currentMonthRange());
  const [selectedSaleIds, setSelectedSaleIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedReturnIds, setSelectedReturnIds] = useState([]);
  const [bulkDeletingReturns, setBulkDeletingReturns] = useState(false);

  const [investmentForm, setInvestmentForm] = useState({ investorId: '', investedOn: '', amount: '', notes: '' });
  const [investmentError, setInvestmentError] = useState(null);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState(null);

  const [savingProjectCost, setSavingProjectCost] = useState(false);
  const [projectCostInput, setProjectCostInput] = useState('');
  const [savingEcInvestment, setSavingEcInvestment] = useState(false);
  const [ecInvestmentInput, setEcInvestmentInput] = useState('');

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
    setSelectedSaleIds([]);
  }, [id, salesFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/companies/${id}`);
      setCompany(data.company);

      const distRes = await api.get(`/companies/${id}/distributions`);
      setDistributions(distRes.data.distributions);
      const investmentsRes = await api.get(`/companies/${id}/investments`);
      setInvestments(investmentsRes.data.investments);
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
        setSelectedReturnIds([]);
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

  useEffect(() => {
    if (company) {
      setProjectCostInput(String(company.total_project_cost ?? 0));
      setEcInvestmentInput(String(company.ec_holding_investment ?? 0));
    }
  }, [company]);

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

  const salesRangeLabel = useMemo(() => {
    if (!salesFilter.from && !salesFilter.to) return 'All-Time Total';
    const thisMonth = currentMonthRange();
    if (salesFilter.from === thisMonth.from && salesFilter.to === thisMonth.to) {
      const now = new Date();
      return `${fullMonthName(now.getFullYear(), now.getMonth() + 1)} Total`;
    }
    if (salesFilter.from && salesFilter.to) return 'Selected Range Total';
    return 'Total';
  }, [salesFilter]);

  function toggleSelectSale(saleId) {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((sid) => sid !== saleId) : [...prev, saleId]
    );
  }

  function toggleSelectAllSales() {
    setSelectedSaleIds((prev) => (prev.length === sales.length ? [] : sales.map((s) => s.id)));
  }

  async function handleBulkDeleteSales() {
    if (selectedSaleIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedSaleIds.length} selected sale${selectedSaleIds.length === 1 ? '' : 's'}? This cannot be undone.`
    );
    if (!confirmed) return;
    setBulkDeleting(true);
    try {
      await api.post(`/companies/${id}/sales/bulk-delete`, { saleIds: selectedSaleIds });
      await loadSales();
    } catch {
      setError('Could not delete the selected sales.');
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleSelectReturn(returnId) {
    setSelectedReturnIds((prev) =>
      prev.includes(returnId) ? prev.filter((rid) => rid !== returnId) : [...prev, returnId]
    );
  }

  function toggleSelectAllReturns() {
    setSelectedReturnIds((prev) => (prev.length === returns.length ? [] : returns.map((r) => r.id)));
  }

  async function handleBulkDeleteReturns() {
    if (selectedReturnIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedReturnIds.length} selected return${selectedReturnIds.length === 1 ? '' : 's'}? This cannot be undone.`
    );
    if (!confirmed) return;
    setBulkDeletingReturns(true);
    try {
      await api.post(`/companies/${id}/returns/bulk-delete`, { returnIds: selectedReturnIds });
      await load();
    } catch {
      setError('Could not delete the selected returns.');
    } finally {
      setBulkDeletingReturns(false);
    }
  }

  async function handleUnlinkInvestor(investorId) {
    const confirmed = window.confirm(
      "Remove this investor's access to this company? Their investment history is kept, but they won't be able to see this company anymore until logged again."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/companies/${id}/investors/${investorId}`);
      load();
    } catch {
      setError('Could not remove that investor.');
    }
  }

  function startEditInvestment(inv) {
    setEditingInvestmentId(inv.id);
    setInvestmentForm({
      investorId: inv.investor_id,
      investedOn: inv.invested_on.slice(0, 10),
      amount: String(inv.amount),
      notes: inv.notes || '',
    });
  }

  function cancelEditInvestment() {
    setEditingInvestmentId(null);
    setInvestmentForm({ investorId: '', investedOn: '', amount: '', notes: '' });
  }

  async function handleSubmitInvestment(e) {
    e.preventDefault();
    setInvestmentError(null);
    if (!investmentForm.investorId || !investmentForm.investedOn || investmentForm.amount === '') {
      setInvestmentError('Investor, date, and amount are all required.');
      return;
    }
    setSavingInvestment(true);
    try {
      if (editingInvestmentId) {
        await api.patch(`/companies/${id}/investments/${editingInvestmentId}`, {
          investedOn: investmentForm.investedOn,
          amount: Number(investmentForm.amount),
          notes: investmentForm.notes,
        });
      } else {
        await api.post(`/companies/${id}/investments`, {
          investorId: investmentForm.investorId,
          investedOn: investmentForm.investedOn,
          amount: Number(investmentForm.amount),
          notes: investmentForm.notes,
        });
      }
      setInvestmentForm({ investorId: '', investedOn: '', amount: '', notes: '' });
      setEditingInvestmentId(null);
      load();
    } catch (err) {
      setInvestmentError(err.response?.data?.error || 'Could not save that investment.');
    } finally {
      setSavingInvestment(false);
    }
  }

  async function handleDeleteInvestment(investmentId) {
    try {
      await api.delete(`/companies/${id}/investments/${investmentId}`);
      if (editingInvestmentId === investmentId) cancelEditInvestment();
      load();
    } catch {
      setError('Could not remove that entry.');
    }
  }

  async function handleTotalProjectCostChange(newValue) {
    setSavingProjectCost(true);
    try {
      await api.patch(`/companies/${id}`, { totalProjectCost: Number(newValue) || 0 });
      load();
    } catch {
      setError('Could not update the total project cost.');
    } finally {
      setSavingProjectCost(false);
    }
  }

  async function handleEcInvestmentChange(newValue) {
    setSavingEcInvestment(true);
    try {
      await api.patch(`/companies/${id}`, { ecHoldingInvestment: Number(newValue) || 0 });
      load();
    } catch {
      setError("Could not update Evercrest Holdings' investment.");
    } finally {
      setSavingEcInvestment(false);
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

  const currency = company.currency || 'USD';

  return (
    <div>
      <button className="back-link" onClick={() => navigate('/dashboard/companies')}>
        ← Back to companies
      </button>

      {error && (
        <div className="banner-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="eyebrow">{company.industry || 'Company'}</div>
          <h1>{company.name}</h1>
          {company.description && <p className="lede">{company.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="totalProjectCost" style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)' }}>
                  Total Project Cost
                </label>
                <input
                  id="totalProjectCost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mono"
                  value={projectCostInput}
                  onChange={(e) => setProjectCostInput(e.target.value)}
                  onBlur={() => {
                    if (Number(projectCostInput) !== Number(company.total_project_cost)) {
                      handleTotalProjectCostChange(projectCostInput);
                    }
                  }}
                  disabled={savingProjectCost}
                  style={{
                    width: '140px',
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="ecInvestment" style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)' }}>
                  Evercrest's Own Investment
                </label>
                <input
                  id="ecInvestment"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mono"
                  value={ecInvestmentInput}
                  onChange={(e) => setEcInvestmentInput(e.target.value)}
                  onBlur={() => {
                    if (Number(ecInvestmentInput) !== Number(company.ec_holding_investment)) {
                      handleEcInvestmentChange(ecInvestmentInput);
                    }
                  }}
                  disabled={savingEcInvestment}
                  style={{
                    width: '140px',
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </span>
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
            </>
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
          <div className="stat-card tone-champagne">
            <div className="label-row">
              <Landmark size={15} />
              <div className="label">Total Project Cost</div>
            </div>
            <div className="value">{formatCurrency(company.total_project_cost, currency)}</div>
          </div>
          <div className="stat-card tone-navy">
            <div className="label-row">
              <Building2 size={15} />
              <div className="label">Total Evercrest Investment</div>
            </div>
            <div className="value">{formatCurrency(company.total_ec_holding_investment, currency)}</div>
          </div>
          <div className="stat-card tone-brass">
            <div className="label-row">
              <Wallet size={15} />
              <div className="label">Unmanaged Balance</div>
            </div>
            <div className="value">{formatCurrency(company.unmanaged_balance, currency)}</div>
          </div>
          <div className="stat-card tone-amber">
            <div className="label-row">
              <TrendingUp size={15} />
              <div className="label">Total Sales</div>
            </div>
            <div className="value">{formatCurrency(company.total_sales, currency)}</div>
          </div>
          <div className="stat-card tone-navy">
            <div className="label-row">
              <Wallet size={15} />
              <div className="label">Individual Investors Total</div>
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
          <div className="stat-card tone-champagne">
            <div className="label-row">
              <Landmark size={15} />
              <div className="label">Total Project Cost</div>
            </div>
            <div className="value">{formatCurrency(company.total_project_cost, currency)}</div>
          </div>
          <div className="stat-card tone-navy">
            <div className="label-row">
              <Building2 size={15} />
              <div className="label">Total Evercrest Investment</div>
            </div>
            <div className="value">{formatCurrency(company.total_ec_holding_investment, currency)}</div>
          </div>
          <div className="stat-card tone-navy">
            <div className="label-row">
              <PieChart size={15} />
              <div className="label">Your Ownership</div>
            </div>
            <div className="value">{Number(company.ownership_percentage).toFixed(1)}%</div>
          </div>
          <div className="stat-card tone-amber">
            <div className="label-row">
              <Wallet size={15} />
              <div className="label">Invested Amount</div>
            </div>
            <div className="value">{formatCurrency(company.capital_committed, currency)}</div>
          </div>
          <div className="stat-card tone-champagne">
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
            {salesRangeLabel}: {formatCurrency(salesTotal, currency)}
          </span>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ImportSalesPanel companyId={id} currency={currency} onImported={load} />
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <ExportPanel
            companyId={id}
            companyName={company.name}
            currency={currency}
            dataType="sales"
            isAdmin={isAdmin}
            label="Download Sales (Excel)"
          />
        </div>

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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSalesFilter(currentMonthRange())}
            >
              This Month
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSalesFilter({ from: '', to: '' })}
            >
              All Time
            </button>
          </div>
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

        {sales.length > 0 && isAdmin && selectedSaleIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--paper-dim)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: 'var(--step-sm)' }}>
              {selectedSaleIds.length} selected
            </span>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--negative)', color: 'var(--white)' }}
              disabled={bulkDeleting}
              onClick={handleBulkDeleteSales}
            >
              {bulkDeleting ? 'Deleting…' : `Delete ${selectedSaleIds.length} Selected`}
            </button>
          </div>
        )}

        {sales.length > 0 && (
          <table className="data-table" style={{ marginBottom: isAdmin ? '1.5rem' : 0 }}>
            <thead>
              <tr>
                {isAdmin && (
                  <th style={{ width: '2rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedSaleIds.length === sales.length}
                      onChange={toggleSelectAllSales}
                      aria-label="Select all"
                    />
                  </th>
                )}
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Notes</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSaleIds.includes(s.id)}
                        onChange={() => toggleSelectSale(s.id)}
                        aria-label={`Select sale from ${s.sale_date}`}
                      />
                    </td>
                  )}
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

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ImportReturnsPanel companyId={id} currency={currency} onImported={load} />
            <ExportPanel
              companyId={id}
              companyName={company.name}
              currency={currency}
              dataType="returns"
              isAdmin={isAdmin}
              label="Download Returns (Excel)"
            />
          </div>

          {returns.length === 0 && (
            <div className="empty-state">
              <h3>No returns recorded yet</h3>
              <p>Add the first entry below.</p>
            </div>
          )}

          {returns.length > 0 && selectedReturnIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--paper-dim)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: 'var(--step-sm)' }}>{selectedReturnIds.length} selected</span>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--negative)', color: 'var(--white)' }}
                disabled={bulkDeletingReturns}
                onClick={handleBulkDeleteReturns}
              >
                {bulkDeletingReturns ? 'Deleting…' : `Delete ${selectedReturnIds.length} Selected`}
              </button>
            </div>
          )}

          {returns.length > 0 && (
            <table className="data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '2rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedReturnIds.length === returns.length}
                      onChange={toggleSelectAllReturns}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedReturnIds.includes(r.id)}
                        onChange={() => toggleSelectReturn(r.id)}
                        aria-label={`Select return from ${r.received_on}`}
                      />
                    </td>
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
          <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Total invested and ownership % are calculated automatically from the investment ledger
            below — edit an entry there rather than here to correct a figure.
          </p>

          {investors.length === 0 && (
            <div className="empty-state">
              <h3>No investors yet</h3>
              <p>Log an investment below — that's what gives an investor access to this company.</p>
            </div>
          )}

          {investors.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Email</th>
                  <th className="num">Invested Amount</th>
                  <th className="num">Ownership</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.name}</td>
                    <td>{inv.email}</td>
                    <td className="num">{formatCurrency(inv.capital_committed, currency)}</td>
                    <td className="num">{Number(inv.ownership_percentage).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleUnlinkInvestor(inv.id)}
                      >
                        Remove Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">Investments</div>
        {!isAdmin && (
          <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Every amount you've invested in this company, including any additional investments
            beyond your initial one.
          </p>
        )}

        {investments.length === 0 && (
          <div className="empty-state">
            <h3>No investments logged yet</h3>
            <p>
              {isAdmin
                ? 'Log the first investment below.'
                : "You don't have an investment recorded for this company yet."}
            </p>
          </div>
        )}

        {investments.length > 0 && (
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
              {investments.map((inv) => (
                <tr key={inv.id}>
                  {isAdmin && <td>{inv.investor_name}</td>}
                  <td>{new Date(inv.invested_on).toLocaleDateString()}</td>
                  <td className="num">{formatCurrency(inv.amount, currency)}</td>
                  <td>{inv.notes || '—'}</td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => startEditInvestment(inv)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDeleteInvestment(inv.id)}
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

        {isAdmin && (
          <>
            <div className="section-title" style={{ fontSize: 'var(--step-sm)' }}>
              {editingInvestmentId ? 'Edit investment' : 'Log an investment'}
            </div>
            <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
              {editingInvestmentId
                ? 'Editing an existing entry.'
                : "Pick any investor — if this is their first investment here, it also gives them access to this company. To add more from an investor already linked, just log another entry for them."}
            </p>
            {investmentError && <div className="banner-error">{investmentError}</div>}
            <form
              className="form-grid"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto', alignItems: 'end', display: 'grid' }}
              onSubmit={handleSubmitInvestment}
            >
              <div className="field">
                <label htmlFor="investmentInvestor">Investor</label>
                <select
                  id="investmentInvestor"
                  value={investmentForm.investorId}
                  disabled={!!editingInvestmentId}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, investorId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.8rem',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <option value="">Select…</option>
                  {allInvestors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="investmentDate">Date</label>
                <input
                  id="investmentDate"
                  type="date"
                  value={investmentForm.investedOn}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, investedOn: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="investmentAmount">Amount</label>
                <input
                  id="investmentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="investmentNotes">Notes</label>
                <input
                  id="investmentNotes"
                  value={investmentForm.notes}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-dark" type="submit" disabled={savingInvestment}>
                  {savingInvestment ? 'Saving…' : editingInvestmentId ? 'Update' : 'Add'}
                </button>
                {editingInvestmentId && (
                  <button type="button" className="btn btn-outline" onClick={cancelEditInvestment}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: isAdmin ? '1.5rem' : 0 }}>
        <div className="section-title">Distributions</div>
        {!isAdmin && (
          <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 1rem' }}>
            Money actually paid out to you for this company.
          </p>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <ExportPanel
            companyId={id}
            companyName={company.name}
            currency={currency}
            dataType="distributions"
            isAdmin={isAdmin}
            label="Download Distributions (Excel)"
          />
        </div>

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
