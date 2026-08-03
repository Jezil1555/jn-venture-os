// Each company carries its own currency, so formatting has to take it as
// a parameter rather than being hardcoded to USD everywhere.
const LOCALE_BY_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
  QAR: 'en-QA',
};

export function formatCurrency(value, currency = 'USD') {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  const locale = LOCALE_BY_CURRENCY[currency] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if a browser doesn't recognize a locale/currency pairing.
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export const CURRENCY_OPTIONS = ['USD', 'INR', 'QAR'];
