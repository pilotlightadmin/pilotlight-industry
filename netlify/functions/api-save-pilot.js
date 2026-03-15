// POST /.netlify/functions/api-save-pilot
// Body: { pilotTitle, logline, genre, playbackId, creatorName, ... }
// Auth required

import { airtableCreate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const PILOTS_TABLE = 'Pilots';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const pilotData = JSON.parse(event.body || '{}');

    if (!pilotData.pilotTitle) {
      return respond(400, { success: false, message: 'pilotTitle is required' });
    }

    // Ensure creatorUserId matches authenticated user
    pilotData.creatorUserId = voter.id;

    const data = await airtableCreate(PILOTS_TABLE, pilotData);
    return respond(200, { success: true, pilot: { id: data.id, ...data.fields } });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Save pilot error:', e);
    return respond(500, { success: false, message: e.message || 'Database error' });
  }
};
