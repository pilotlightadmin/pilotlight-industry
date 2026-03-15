// POST /.netlify/functions/api-reset-password
// Body: { token, newPassword }
// Returns: { success, message }

import { airtableGetAll, airtableUpdate, handleOptions, respond } from './utils/airtable.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { token, newPassword } = JSON.parse(event.body || '{}');

    if (!token || !newPassword) {
      return respond(400, { success: false, message: 'Token and new password are required' });
    }

    const records = await airtableGetAll(VOTERS_TABLE);
    const voters = records.map(r => ({ id: r.id, ...r.fields }));
    const voter = voters.find(v => v.resetToken === token);

    if (!voter) {
      return respond(400, { success: false, message: 'Invalid or expired reset link.' });
    }

    if (voter.resetExpiry && new Date(voter.resetExpiry) < new Date()) {
      return respond(400, { success: false, message: 'This reset link has expired. Please request a new one.' });
    }

    // Check against last 3 passwords
    let passwordHistory = [];
    try { passwordHistory = JSON.parse(voter.passwordHistory || '[]'); } catch (e) { passwordHistory = []; }

    if (passwordHistory.slice(-3).includes(newPassword)) {
      return respond(400, { success: false, message: 'You cannot reuse one of your last 3 passwords.' });
    }

    passwordHistory.push(newPassword);
    if (passwordHistory.length > 3) passwordHistory = passwordHistory.slice(-3);

    await airtableUpdate(VOTERS_TABLE, voter.id, {
      password: newPassword,
      passwordHistory: JSON.stringify(passwordHistory),
      resetToken: '',
      resetExpiry: ''
    });

    return respond(200, { success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (e) {
    console.error('Reset password error:', e);
    return respond(500, { success: false, message: 'Failed to reset password. Please try again.' });
  }
};
