// POST /.netlify/functions/api-submit-vote
// Body: { pilotId, curiosityScore, seriesScore, overallScore, pullFactorsIn?, pullFactorsBack?, comment? }
// Auth required — voterId comes from session token

import { airtableGetAll, airtableCreate, airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTES_TABLE = 'Votes';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const { pilotId, curiosityScore, seriesScore, overallScore, pullFactorsIn, pullFactorsBack, comment } = JSON.parse(event.body || '{}');

    if (!pilotId) {
      return respond(400, { success: false, message: 'pilotId is required' });
    }

    // Validate scores are in range
    for (const [name, score] of [['curiosityScore', curiosityScore], ['seriesScore', seriesScore], ['overallScore', overallScore]]) {
      if (score !== undefined && (score < 1 || score > 5)) {
        return respond(400, { success: false, message: `${name} must be between 1 and 5` });
      }
    }

    // Check if vote already exists for this voter+pilot
    const existingRecords = await airtableGetAll(VOTES_TABLE);
    const existingVote = existingRecords.find(r => {
      const vid = Array.isArray(r.fields.voterId) ? r.fields.voterId[0] : r.fields.voterId;
      const pid = Array.isArray(r.fields.pilotId) ? r.fields.pilotId[0] : r.fields.pilotId;
      return vid === voter.id && pid === pilotId;
    });

    const fields = {
      curiosityScore,
      seriesScore,
      overallScore,
      pullFactorsIn: JSON.stringify(pullFactorsIn || []),
      pullFactorsBack: JSON.stringify(pullFactorsBack || []),
      comment
    };

    // Remove undefined fields
    Object.keys(fields).forEach(key => fields[key] === undefined && delete fields[key]);

    let result;
    if (existingVote) {
      // Update existing vote
      result = await airtableUpdate(VOTES_TABLE, existingVote.id, fields);
    } else {
      // Create new vote with linked fields
      fields.pilotId = [pilotId];
      fields.voterId = [voter.id];
      result = await airtableCreate(VOTES_TABLE, fields);
    }

    const vote = { id: result.id, ...result.fields };
    return respond(200, { success: true, vote, isUpdate: !!existingVote });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Submit vote error:', e);
    return respond(500, { success: false, message: 'Failed to submit vote' });
  }
};
