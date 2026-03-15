// POST /.netlify/functions/api-auth-signup
// Body: { name, email, password, gender?, location? }
// Returns: { success, voter, token, isNew } or { success: false, message }

import { airtableGetAll, airtableCreate, airtableUpdate, corsHeaders, handleOptions, respond } from './utils/airtable.js';
import { generateToken } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const { name, email, password, gender, location } = JSON.parse(event.body || '{}');

    if (!name || !email || !password) {
      return respond(400, { success: false, message: 'Name, email, and password are required' });
    }

    // Check for existing accounts
    const records = await airtableGetAll(VOTERS_TABLE);
    const voters = records.map(r => ({ id: r.id, ...r.fields }));

    const existingEmail = voters.find(v => v.email && v.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      return respond(409, { success: false, message: 'An account with this email already exists.' });
    }

    const existingName = voters.find(v => v.name && v.name.toLowerCase() === name.toLowerCase());
    if (existingName) {
      return respond(409, { success: false, message: 'This username is already taken.' });
    }

    // Create the voter with a session token
    const token = generateToken();
    const data = await airtableCreate(VOTERS_TABLE, {
      name,
      email: email.toLowerCase(),
      password,
      passwordHistory: JSON.stringify([password]),
      gender: gender || '',
      voterLocation: location || '',
      sessionToken: token,
      createdAt: new Date().toISOString()
    });

    const { password: _, passwordHistory: __, sessionToken: ___, ...safeVoter } = { id: data.id, ...data.fields };

    return respond(200, { success: true, voter: safeVoter, token, isNew: true });
  } catch (e) {
    console.error('Signup error:', e);
    return respond(500, { success: false, message: 'Registration failed. Please try again.' });
  }
};
