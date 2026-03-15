// GET /.netlify/functions/api-get-votes
// Query params: ?voterId=X (optional), ?pilotId=X (optional)
// Auth required

import { airtableGetAll, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTES_TABLE = 'Votes';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  try {
    await authenticate(event);

    const { voterId, pilotId } = event.queryStringParameters || {};

    const records = await airtableGetAll(VOTES_TABLE);
    let votes = records.map(r => {
      const fields = r.fields;
      let pullIn = [];
      let pullBack = [];
      try { pullIn = fields.pullFactorsIn ? JSON.parse(fields.pullFactorsIn) : []; } catch (e) { pullIn = []; }
      try { pullBack = fields.pullFactorsBack ? JSON.parse(fields.pullFactorsBack) : []; } catch (e) { pullBack = []; }
      return { id: r.id, ...fields, pullFactorsIn: pullIn, pullFactorsBack: pullBack };
    });

    // Filter by voterId if provided
    if (voterId) {
      votes = votes.filter(v => {
        const vid = Array.isArray(v.voterId) ? v.voterId[0] : v.voterId;
        return vid === voterId;
      });
    }

    // Filter by pilotId if provided
    if (pilotId) {
      votes = votes.filter(v => {
        const pid = Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
        return pid === pilotId;
      });
    }

    return respond(200, { success: true, votes });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Get votes error:', e);
    return respond(500, { success: false, message: 'Failed to fetch votes' });
  }
};
