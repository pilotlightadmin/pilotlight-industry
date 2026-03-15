// POST /.netlify/functions/api-update-pilot
// Body: { pilotId, updates: { ... } } OR { pilotId, action: 'incrementFunding' }
// Auth required

import { airtableGet, airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const PILOTS_TABLE = 'Pilots';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    await authenticate(event);
    const { pilotId, updates, action } = JSON.parse(event.body || '{}');

    if (!pilotId) {
      return respond(400, { success: false, message: 'pilotId is required' });
    }

    // Handle funding interest increment
    if (action === 'incrementFunding') {
      const record = await airtableGet(PILOTS_TABLE, pilotId);
      const current = record.fields?.fundingInterest || 0;
      const data = await airtableUpdate(PILOTS_TABLE, pilotId, { fundingInterest: current + 1 });
      return respond(200, { success: true, count: current + 1 });
    }

    // Regular update
    if (!updates || Object.keys(updates).length === 0) {
      return respond(400, { success: false, message: 'updates object is required' });
    }

    const data = await airtableUpdate(PILOTS_TABLE, pilotId, updates);
    return respond(200, { success: true, pilot: { id: data.id, ...data.fields } });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Update pilot error:', e);
    return respond(500, { success: false, message: 'Failed to update pilot' });
  }
};
