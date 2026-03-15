// POST /.netlify/functions/api-sign-nda
// Body: { pilotId, displayName?, email? }
// Auth required — updates voter's NDA status and logs signer on pilot

import { airtableGet, airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';
const PILOTS_TABLE = 'Pilots';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const { pilotId, displayName, email } = JSON.parse(event.body || '{}');

    if (!pilotId) {
      return respond(400, { success: false, message: 'pilotId is required' });
    }

    // Update voter's NDA status
    await airtableUpdate(VOTERS_TABLE, voter.id, {
      ndaSigned: true,
      ndaSignedAt: new Date().toISOString()
    });

    // Log NDA signer on the pilot record
    try {
      const pilotRecord = await airtableGet(PILOTS_TABLE, pilotId);
      const currentSigners = pilotRecord.fields?.ndaSigners || '';
      const name = displayName || voter.displayName || voter.name || 'Unknown';
      const signerEmail = email || voter.email || '';
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const signerEntry = `${name}${signerEmail ? ' (' + signerEmail + ')' : ''} — ${date}`;
      const updatedSigners = currentSigners ? `${currentSigners}\n${signerEntry}` : signerEntry;
      await airtableUpdate(PILOTS_TABLE, pilotId, { ndaSigners: updatedSigners });
    } catch (e) {
      console.error('Error logging NDA signer for pilot:', e);
      // Non-fatal — voter's NDA status was still updated
    }

    return respond(200, { success: true });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Sign NDA error:', e);
    return respond(500, { success: false, message: 'Failed to sign NDA' });
  }
};
