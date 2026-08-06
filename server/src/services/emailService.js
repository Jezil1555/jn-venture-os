import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const LOCALE_BY_CURRENCY = { USD: 'en-US', INR: 'en-IN', QAR: 'en-QA' };
function formatCurrency(value, currency = 'USD') {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  const locale = LOCALE_BY_CURRENCY[currency] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      amount
    );
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function wrapEmail(bodyHtml) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F6F4EF; color: #081320;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 22px; letter-spacing: 0.08em; font-weight: bold;">EVERCREST</div>
        <div style="font-size: 12px; letter-spacing: 0.25em; color: #C9A227; margin-top: 2px;">HOLDINGS</div>
      </div>
      <div style="background: #ffffff; border-radius: 6px; padding: 24px; border: 1px solid #E7D8B2;">
        ${bodyHtml}
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
        Enduring Trust. Lasting Value.
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email:', subject);
    return { success: false, error: 'RESEND_API_KEY is not set on the backend yet.' };
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Evercrest Holdings <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    if (error) {
      const message = error.message || JSON.stringify(error);
      console.error('[email] send failed:', subject, message);
      return { success: false, error: message };
    }
    return { success: true };
  } catch (err) {
    console.error('[email] send failed:', subject, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendSaleNotification({ investorEmail, investorName, companyName, sale, currency }) {
  const html = wrapEmail(`
    <p style="margin: 0 0 16px;">Hi ${investorName},</p>
    <p style="margin: 0 0 16px;">A new sale was just logged for <strong>${companyName}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; text-align: right;">${formatDate(sale.sale_date)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Amount</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${formatCurrency(sale.amount, currency)}</td></tr>
      ${sale.notes ? `<tr><td style="padding: 6px 0; color: #6b7280;">Notes</td><td style="padding: 6px 0; text-align: right;">${sale.notes}</td></tr>` : ''}
    </table>
    <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">Log in to your portfolio to see the full picture.</p>
  `);
  return sendEmail({ to: investorEmail, subject: `New sale logged — ${companyName}`, html });
}

export async function sendDistributionNotification({
  investorEmail,
  investorName,
  companyName,
  distribution,
  currency,
}) {
  const html = wrapEmail(`
    <p style="margin: 0 0 16px;">Hi ${investorName},</p>
    <p style="margin: 0 0 16px;">A distribution has been recorded for you from <strong>${companyName}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; text-align: right;">${formatDate(distribution.distributed_on)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Amount</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${formatCurrency(distribution.amount, currency)}</td></tr>
      ${distribution.notes ? `<tr><td style="padding: 6px 0; color: #6b7280;">Notes</td><td style="padding: 6px 0; text-align: right;">${distribution.notes}</td></tr>` : ''}
    </table>
    <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">Log in to your portfolio for the complete history.</p>
  `);
  return sendEmail({
    to: investorEmail,
    subject: `You've received a distribution — ${companyName}`,
    html,
  });
}

export async function sendTestEmail(toEmail) {
  const html = wrapEmail(`
    <p style="margin: 0 0 16px;">This is a test email from your Evercrest Holdings platform.</p>
    <p style="margin: 0;">If you're reading this, email notifications are working correctly.</p>
  `);
  return sendEmail({ to: toEmail, subject: 'Test email — Evercrest Holdings', html });
}
