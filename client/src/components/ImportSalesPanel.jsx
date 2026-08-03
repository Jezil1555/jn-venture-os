import React, { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import api from '../api/client.js';
import { parseSalesWorkbook } from '../utils/parseSalesFile.js';
import { formatCurrency } from '../utils/currency.js';

function downloadTemplate() {
  const csv = 'Date,Amount,Notes\n2026-01-15,1250.00,Example row - delete me\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportSalesPanel({ companyId, currency, onImported }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [parsed, setParsed] = useState(null); // { rows, errors, headerError }
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null);

  function reset() {
    setFileName(null);
    setParsed(null);
    setImportError(null);
    setImportSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = parseSalesWorkbook(evt.target.result);
        setParsed(result);
      } catch (err) {
        setParsed({ rows: [], errors: [], headerError: "Couldn't read that file. Is it a valid .xlsx, .xls, or .csv?" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const { data } = await api.post(`/companies/${companyId}/sales/bulk`, { sales: parsed.rows });
      setImportSuccess(data.inserted);
      onImported();
    } catch (err) {
      setImportError(err.response?.data?.error || 'Could not import these rows.');
    } finally {
      setImporting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        <Upload size={15} style={{ marginRight: '0.4rem', verticalAlign: '-2px' }} />
        Import from Excel / CSV
      </button>
    );
  }

  return (
    <div className="card card-pad" style={{ marginBottom: '1.5rem', background: 'var(--paper-dim)' }}>
      <div
        className="section-title"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Import Sales from a Spreadsheet</span>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          Close
        </button>
      </div>

      <p style={{ fontSize: 'var(--step-sm)', color: 'var(--slate)', margin: '0 0 1rem' }}>
        Needs a <strong>Date</strong> column and an <strong>Amount</strong> column (a{' '}
        <strong>Notes</strong> column is optional). Works with .xlsx, .xls, and .csv.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ fontSize: 'var(--step-sm)' }}
        />
        <button type="button" className="btn btn-outline" onClick={downloadTemplate}>
          <Download size={14} style={{ marginRight: '0.4rem', verticalAlign: '-2px' }} />
          Download template
        </button>
      </div>

      {parsed?.headerError && <div className="banner-error">{parsed.headerError}</div>}

      {parsed && !parsed.headerError && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: 'var(--step-sm)', marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--positive)' }}>{parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'} ready to import</strong>
            {parsed.errors.length > 0 && (
              <span style={{ color: 'var(--negative)' }}>
                {' '}
                &middot; {parsed.errors.length} row{parsed.errors.length === 1 ? '' : 's'} skipped
              </span>
            )}
            {fileName && <span style={{ color: 'var(--slate)' }}> &middot; from {fileName}</span>}
          </p>

          {parsed.rows.length > 0 && (
            <table className="data-table" style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    <td>{r.saleDate}</td>
                    <td className="num">{formatCurrency(r.amount, currency)}</td>
                    <td>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {parsed.rows.length > 8 && (
            <p style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', margin: '-0.5rem 0 1rem' }}>
              ...and {parsed.rows.length - 8} more row{parsed.rows.length - 8 === 1 ? '' : 's'}.
            </p>
          )}

          {parsed.errors.length > 0 && (
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ fontSize: 'var(--step-sm)', color: 'var(--negative)', cursor: 'pointer' }}>
                {parsed.errors.length} row{parsed.errors.length === 1 ? '' : 's'} couldn't be read — click to see why
              </summary>
              <ul style={{ fontSize: 'var(--step-xs)', color: 'var(--slate)', marginTop: '0.5rem' }}>
                {parsed.errors.slice(0, 15).map((e, i) => (
                  <li key={i}>
                    Row {e.line}: "{e.raw}" — {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {importError && <div className="banner-error">{importError}</div>}

          {importSuccess !== null ? (
            <div
              style={{
                background: '#e5f0ea',
                color: 'var(--positive)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--step-sm)',
              }}
            >
              Imported {importSuccess} row{importSuccess === 1 ? '' : 's'} successfully.
            </div>
          ) : (
            parsed.rows.length > 0 && (
              <button className="btn btn-dark" type="button" disabled={importing} onClick={handleImport}>
                {importing ? 'Importing…' : `Import ${parsed.rows.length} Row${parsed.rows.length === 1 ? '' : 's'}`}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
