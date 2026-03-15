// POST /.netlify/functions/api-auth-login
// Body: { usernameOrEmail, password }
// Returns: { success, voter, token } or { success: false, message }

import { airtableGetAll, airtableUpdate, corsHeaders, handleOptions, respond } from './utils/airtable.js';
import { generateToken } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { usernameOrEmail, password } = JSON.parse(event.body || '{}');

    if (!usernameOrEmail || !password) {
      return respond(400, { success: false, message: 'Username/email and password are required' });
    }

    // Fetch all voters (we need to search by email OR name)
    const records = await airtableGetAll(VOTERS_TABLE);
    const voters = records.map(r => ({ id: r.id, ...r.fields }));

    const voter = voters.find(v =>
      (v.email && v.email.toLowerCase() === usernameOrEmail.toLowerCase()) ||
      (v.name && v.name.toLowerCase() === usernameOrEmail.toLowerCase())
    );

    if (!voter) {
      return respond(401, { success: false, message: 'Account not found. Please sign up first.' });
    }

    if (voter.deleted) {
      return respond(401, { success: false, message: 'This account has been deleted.' });
    }

    if (voter.password !== password) {
      return respond(401, { success: false, message: 'Incorrect password.' });
    }

    // Generate session token and store on voter record
    const token = generateToken();
    await airtableUpdate(VOTERS_TABLE, voter.id, { sessionToken: token });

    // Return voter data (strip sensitive fields)
    const { password: _, passwordHistory: __, sessionToken: ___, resetToken: ____, resetExpiry: _____, ...safeVoter } = voter;

    return respond(200, { success: true, voter: safeVoter, token });
  } catch (e) {
    console.error('Login error:', e);
    return respond(500, { success: false, message: 'Login failed. Please try again.' });
  }
};
