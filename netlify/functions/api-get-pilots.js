// GET /.netlify/functions/api-get-pilots
// Query params: ?userId=X (optional, for "my pilots" filtering)
// Public endpoint — no auth required

import { airtableGetAll, handleOptions, respond } from './utils/airtable.js';

const PILOTS_TABLE = 'Pilots';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  try {
    const userId = event.queryStringParameters?.userId;
    const records = await airtableGetAll(PILOTS_TABLE);
    let pilots = records.map(r => ({ id: r.id, ...r.fields }));

    // If userId provided, filter to their pilots
    if (userId) {
      pilots = pilots.filter(p => p.creatorUserId === userId);
    }

    // Format for frontend (match getPilotsForVoting shape)
    const formatted = pilots
      .filter(p => !p.hidden)
      .map(p => ({
        id: p.id,
        pilotTitle: p.pilotTitle,
        videoUrl: p.videoUrl,
        playbackId: p.playbackId,
        logline: p.logline,
        genre: p.genre || '',
        createdAt: p.createdAt,
        version: p.version || 1,
        previousVersionId: p.previousVersionId || null,
        creatorName: p.creatorName || '',
        creatorUserId: p.creatorUserId || '',
        fundingUrl: p.fundingUrl || '',
        fundingInterest: p.fundingInterest || 0,
        ndaRequired: !!p.ndaRequired,
        hidden: !!p.hidden,
        stats: {
          totalVotes: parseInt(p.voteCount) || 0,
          avgOverall: parseFloat(p.avgOverall) || 0,
          avgCuriosity: parseFloat(p.avgCuriosity) || 0,
          avgSeries: parseFloat(p.avgSeriesPotential) || 0
        }
      }));

    return respond(200, { success: true, pilots: formatted });
  } catch (e) {
    console.error('Get pilots error:', e);
    return respond(500, { success: false, message: 'Failed to fetch pilots' });
  }
};
