// POST /.netlify/functions/api-delete-account
// Auth required — soft deletes the authenticated voter's account

import { airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);

    await airtableUpdate(VOTERS_TABLE, voter.id, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      sessionToken: '' // Invalidate session
    });

    return respond(200, { success: true });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Delete account error:', e);
    return respond(500, { success: false, message: 'Failed to delete account. Please try again.' });
  }
};
