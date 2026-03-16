// POST /.netlify/functions/api-auth-login
// Handles multiple auth actions based on body fields:
//   { email }                          → check if email exists, has password
//   { email, memberCode }              → validate member code
//   { email, memberCode, newPassword } → activate account (set password + login)
//   { usernameOrEmail, password }      → standard login (legacy compat)
//   { email, password }                → standard login

import { airtableGetAll, airtableUpdate, corsHeaders, handleOptions, respond } from './utils/airtable.js';
import { generateToken } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

const stripSensitive = (voter) => {
  const { password: _, passwordHistory: __, sessionToken: ___, resetToken: ____, resetExpiry: _____, memberCode: ______, ...safe } = voter;
  return safe;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, usernameOrEmail, password, memberCode, newPassword } = body;

    const lookupEmail = email || usernameOrEmail;

    if (!lookupEmail && !password) {
      return respond(400, { success: false, message: 'Email is required' });
    }

    // Fetch all voters
    const records = await airtableGetAll(VOTERS_TABLE);
    const voters = records.map(r => ({ id: r.id, ...r.fields }));

    // Find voter by email or username
    const voter = voters.find(v =>
      (v.email && v.email.toLowerCase() === lookupEmail.toLowerCase()) ||
      (v.name && v.name.toLowerCase() === lookupEmail.toLowerCase())
    );

    // === ACTION: Check email (no password, no memberCode) ===
    if (lookupEmail && !password && !memberCode && !newPassword) {
      if (!voter || voter.deleted) {
        return respond(200, { success: true, found: false });
      }
      return respond(200, {
        success: true,
        found: true,
        hasPassword: !!(voter.password && voter.password.length > 0)
      });
    }

    // === ACTION: Validate member code ===
    if (lookupEmail && memberCode && !newPassword && !password) {
      if (!voter || voter.deleted) {
        return respond(401, { success: false, message: 'Account not found.' });
      }
      if (!voter.memberCode || voter.memberCode !== memberCode) {
        return respond(401, { success: false, message: 'Invalid member code.' });
      }
      return respond(200, { success: true, codeValid: true });
    }

    // === ACTION: Activate account (set password after code validation) ===
    if (lookupEmail && memberCode && newPassword) {
      if (!voter || voter.deleted) {
        return respond(401, { success: false, message: 'Account not found.' });
      }
      if (!voter.memberCode || voter.memberCode !== memberCode) {
        return respond(401, { success: false, message: 'Invalid member code.' });
      }
      if (newPassword.length < 6) {
        return respond(400, { success: false, message: 'Password must be at least 6 characters.' });
      }

      // Set password and log in
      const token = generateToken();
      await airtableUpdate(VOTERS_TABLE, voter.id, {
        password: newPassword,
        passwordHistory: JSON.stringify([newPassword]),
        sessionToken: token
      });

      return respond(200, { success: true, voter: stripSensitive(voter), token });
    }

    // === ACTION: Standard password login ===
    if (!voter) {
      return respond(401, { success: false, message: 'Account not found.' });
    }

    if (voter.deleted) {
      return respond(401, { success: false, message: 'This account has been deleted.' });
    }

    if (!password) {
      return respond(400, { success: false, message: 'Password is required.' });
    }

    if (voter.password !== password) {
      return respond(401, { success: false, message: 'Incorrect password.' });
    }

    // Generate session token and store on voter record
    const token = generateToken();
    await airtableUpdate(VOTERS_TABLE, voter.id, { sessionToken: token });

    return respond(200, { success: true, voter: stripSensitive(voter), token });
  } catch (e) {
    console.error('Login error:', e);
    return respond(500, { success: false, message: 'Login failed. Please try again.' });
  }
};
