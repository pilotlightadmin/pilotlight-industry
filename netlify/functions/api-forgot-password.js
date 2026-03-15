// POST /.netlify/functions/api-forgot-password
// Body: { email }
// Returns: { success, message }

import { airtableGetAll, airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { sendBrevoEmail, buildPasswordResetEmail } from './utils/brevo.js';
import crypto from 'crypto';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return respond(400, { success: false, message: 'Email is required' });
    }

    const records = await airtableGetAll(VOTERS_TABLE);
    const voters = records.map(r => ({ id: r.id, ...r.fields }));
    const existing = voters.find(v => v.email && v.email.toLowerCase() === email.toLowerCase());

    // Always return success to avoid revealing whether email exists
    const genericMessage = 'If an account exists with this email, a reset link has been sent.';

    if (!existing) {
      return respond(200, { success: true, message: genericMessage });
    }

    // Generate reset token
    const resetToken = 'reset_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await airtableUpdate(VOTERS_TABLE, existing.id, { resetToken, resetExpiry });

    // Send password reset email via Brevo
    try {
      const name = existing.name || 'there';
      const resetUrl = `https://pilotlighthq.com/#reset-password?token=${resetToken}`;
      const html = buildPasswordResetEmail(name, resetUrl);
      const result = await sendBrevoEmail(
        existing.email,
        name,
        'Reset your Pilot Light password',
        html
      );
      console.log('Password reset email result:', JSON.stringify(result));
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr);
      // Still return success — don't reveal email sending issues
    }

    return respond(200, { success: true, message: genericMessage });
  } catch (e) {
    console.error('Forgot password error:', e);
    return respond(500, { success: false, message: 'Failed to process request. Please try again.' });
  }
};
