// Billing/quota error detection + admin email notification
// Detects when paid API services (Replicate, RunPod, Mux, AWS S3) return
// payment-related errors and sends an alert email via Brevo.

import { sendBrevoEmail } from './brevo.js';

const BILLING_PATTERNS = {
  replicate: [
    /insufficient.?credits?/i,
    /payment.?required/i,
    /billing/i,
    /spend.?limit/i,
    /quota.?exceeded/i,
    /account.?suspended/i
  ],
  runpod: [
    /insufficient.?funds?/i,
    /insufficient.?credits?/i,
    /payment.?required/i,
    /billing/i,
    /quota.?exceeded/i,
    /spending.?limit/i,
    /account.?suspended/i
  ],
  mux: [
    /payment.?required/i,
    /billing/i,
    /subscription.?expired/i,
    /quota/i,
    /account.?suspended/i
  ],
  's3': [
    /AccountProblem/,
    /InvalidPayer/,
    /account.?suspended/i
  ]
};

const DASHBOARD_LINKS = {
  replicate: 'https://replicate.com/account/billing',
  runpod: 'https://www.runpod.io/console/user/billing',
  mux: 'https://dashboard.mux.com',
  's3': 'https://console.aws.amazon.com/billing'
};

function isBillingError(service, httpStatus, bodyString) {
  if (httpStatus === 402) return true;

  const patterns = BILLING_PATTERNS[service] || [];
  return patterns.some(re => re.test(bodyString));
}

function buildAlertHtml(service, functionName, httpStatus, errorText, context) {
  const timestamp = new Date().toISOString();
  const dashboardLink = DASHBOARD_LINKS[service] || '#';
  const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Billing Alert: ${serviceName}</h2>
      </div>
      <div style="background: #1a1a2e; color: #e0e0e0; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #999;">Service</td><td style="padding: 8px 0;"><strong>${serviceName}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Function</td><td style="padding: 8px 0;">${functionName}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">HTTP Status</td><td style="padding: 8px 0;">${httpStatus}</td></tr>
          ${context ? `<tr><td style="padding: 8px 0; color: #999;">Context</td><td style="padding: 8px 0;">${context}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #999;">Timestamp</td><td style="padding: 8px 0;">${timestamp}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 12px; background: #2a2a3e; border-radius: 4px; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-all;">
${errorText.slice(0, 500)}
        </div>
        <div style="margin-top: 20px;">
          <a href="${dashboardLink}" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Check ${serviceName} Billing</a>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #666;">You may receive multiple copies of this alert until the billing issue is resolved.</p>
      </div>
    </div>
  `;
}

/**
 * Check an API response for billing/quota errors and notify admin if detected.
 * Safe to call on every error path — only sends email for billing-specific errors.
 * Never throws — failures are logged silently.
 *
 * @param {Object} opts
 * @param {string} opts.service - 'replicate' | 'runpod' | 'mux' | 's3'
 * @param {string} opts.functionName - e.g. 'start-prediction'
 * @param {number} opts.httpStatus - HTTP status code from the API response
 * @param {string|object} opts.responseBody - The API response body
 * @param {string} [opts.context] - Optional extra context (model name, etc.)
 * @returns {Promise<boolean>} true if billing error detected and notification attempted
 */
export async function checkBillingError({ service, functionName, httpStatus, responseBody, context }) {
  try {
    const bodyString = typeof responseBody === 'string'
      ? responseBody
      : JSON.stringify(responseBody || '');

    if (!isBillingError(service, httpStatus, bodyString)) {
      return false;
    }

    console.error(`[BILLING ALERT] ${service} billing error in ${functionName}: HTTP ${httpStatus}`);

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@pilotlighthq.com';
    const subject = `[Pilot Light] Billing Alert: ${service} — ${functionName}`;
    const html = buildAlertHtml(service, functionName, httpStatus, bodyString, context);

    await sendBrevoEmail(adminEmail, 'Pilot Light Admin', subject, html);
    console.log(`[BILLING ALERT] Notification sent to ${adminEmail}`);

    return true;
  } catch (err) {
    console.error('[BILLING ALERT] Failed to send notification:', err.message);
    return false;
  }
}
