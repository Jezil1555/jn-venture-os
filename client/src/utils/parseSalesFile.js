import * as XLSX from 'xlsx';

const HEADER_PATTERNS = {
  date: /^date$|sale.?date|transaction.?date/i,
  amount: /^amount$|sales?$|revenue|total/i,
  notes: /^notes?$|description|memo|remarks?/i,
};

function findColumn(headerRow, pattern) {
  return headerRow.findIndex((h) => typeof h === 'string' && pattern.test(h.trim()));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateFromExcelDate(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function parseDateString(str) {
  const trimmed = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  if (year < 1990 || year > 2100) return null;
  return `${year}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function parseDateCell(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatDateFromExcelDate(value);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
  }
  if (typeof value === 'string') {
    return parseDateString(value);
  }
  return null;
}

function parseAmountCell(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    if (cleaned === '') return null;
    const num = Number(cleaned);
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

function parseDateAmountNotesWorkbook(arrayBuffer, dateFieldKey) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  if (grid.length === 0) {
    return { rows: [], errors: [], headerError: 'The file appears to be empty.' };
  }

  const headerRow = grid[0];
  const dateCol = findColumn(headerRow, HEADER_PATTERNS.date);
  const amountCol = findColumn(headerRow, HEADER_PATTERNS.amount);
  const notesCol = findColumn(headerRow, HEADER_PATTERNS.notes);

  if (dateCol === -1 || amountCol === -1) {
    return {
      rows: [],
      errors: [],
      headerError:
        "Couldn't find both a Date column and an Amount column in the first row. " +
        'Expected headers like "Date" and "Amount" (Notes is optional).',
    };
  }

  const rows = [];
  const errors = [];

  for (let i = 1; i < grid.length; i += 1) {
    const raw = grid[i];
    if (!raw || raw.every((cell) => cell === '' || cell === undefined || cell === null)) {
      continue;
    }

    const lineNo = i + 1;
    const dateValue = raw[dateCol];
    const amountValue = raw[amountCol];
    const notesValue = notesCol !== -1 ? raw[notesCol] : '';

    const parsedDate = parseDateCell(dateValue);
    if (!parsedDate) {
      errors.push({ line: lineNo, raw: String(dateValue ?? ''), reason: 'Could not read this date.' });
      continue;
    }

    const amount = parseAmountCell(amountValue);
    if (amount === null || amount < 0) {
      errors.push({ line: lineNo, raw: String(amountValue ?? ''), reason: 'Amount must be a positive number.' });
      continue;
    }

    rows.push({ [dateFieldKey]: parsedDate, amount, notes: notesValue ? String(notesValue).slice(0, 500) : '' });
  }

  return { rows, errors, headerError: null };
}

export function parseSalesWorkbook(arrayBuffer) {
  return parseDateAmountNotesWorkbook(arrayBuffer, 'saleDate');
}

export function parseReturnsWorkbook(arrayBuffer) {
  return parseDateAmountNotesWorkbook(arrayBuffer, 'receivedOn');
}
