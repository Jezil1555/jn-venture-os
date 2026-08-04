import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import api from '../api/client.js';

const ENDPOINT_BY_TYPE = {
  sales: 'sales',
  returns: 'returns',
  distributions: 'distributions',
};

function toDisplayDate(iso) {
  return new Date(iso).toLocaleDateString();
}

function shapeRows(dataType, rows, isAdmin) {
  if (dataType === 'sales') {
    return rows.map((r) => ({
      Date: toDisplayDate(r.sale_date),
      Amount: Number(r.amount),
      Notes: r.notes || '',
    }));
  }
  if (dataType === 'returns') {
    return rows.map((r) => ({
      Date: toDisplayDate(r.received_on),
      Amount: Number(r.amount),
      Notes: r.notes || '',
    }));
  }
  return rows.map((r) => {
    const row = {};
    if (isAdmin) row.Investor = r.investor_name;
    row.Date = toDisplayDate(r.distributed_on);
    row.Amount = Number(r.amount);
    row.Notes = r.notes || '';
    return row;
  });
}

export default function ExportPanel({ companyId, companyName, currency, dataType, isAdmin, label }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const { data } = await api.get(`/companies/${companyId}/${ENDPOINT_BY_TYPE[dataType]}`, { params });
      const rawRows = data[dataType] || data.sales || data.returns || data.distributions || [];

      if (rawRows.length === 0) {
        setError('No rows in that range — nothing to download.');
        setDownloading(false);
        return;
      }

      const shaped = shapeRows(dataType, rawRows, isAdmin);
      const ws = XLSX.utils.json_to_sheet(shaped);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, dataType);

      const rangePart = from || to ? `_${from || 'start'}_to_${to || 'now'}` : '_all-time';
      const safeCompanyName = (companyName || 'company').replace(/[^a-z0-9]+/gi, '-');
      const filename = `${safeCompanyName}_${dataType}${rangePart}.xlsx`;

      XLSX.writeFile(wb, filename);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not download this data.');
    } finally {
      setDownloading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        <Download size={14} style={{ marginRight: '0.4rem', verticalAlign: '-2px' }} />
        {label || 'Download'}
      </button>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'end',
        gap: '0.75rem',
        flexWrap: 'wrap',
        background: 'var(--paper-dim)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem',
      }}
    >
      <div className="field" style={{ marginBottom: 0 }}>
        <label>From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '0 0 0.7rem', width: '100%' }}>
        Leave both blank to download everything.
      </p>
      <button type="button" className="btn btn-dark" disabled={downloading} onClick={handleDownload}>
        {downloading ? 'Preparing…' : 'Download Excel'}
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
      >
        Cancel
      </button>
      {error && <div className="banner-error" style={{ width: '100%', marginTop: '0.5rem' }}>{error}</div>}
    </div>
  );
}
