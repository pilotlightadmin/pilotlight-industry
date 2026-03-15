// POST /.netlify/functions/api-update-profile
// Body: { profilePicture?, displayName?, aboutMe? }
// Auth required — updates the authenticated voter's profile

import { airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const { profilePicture, displayName, aboutMe } = JSON.parse(event.body || '{}');

    const data = await airtableUpdate(VOTERS_TABLE, voter.id, {
      profilePicture: profilePicture || '',
      displayName: displayName || '',
      aboutMe: aboutMe || ''
    });

    const { password: _, passwordHistory: __, sessionToken: ___, resetToken: ____, resetExpiry: _____, ...safeVoter } = { id: data.id, ...data.fields };
    return respond(200, { success: true, voter: safeVoter });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Update profile error:', e);
    return respond(500, { success: false, message: 'Failed to update profile. Please try again.' });
  }
};
