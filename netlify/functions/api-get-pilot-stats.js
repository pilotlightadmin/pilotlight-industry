// GET /.netlify/functions/api-get-pilot-stats?pilotId=X
// Public endpoint — no auth required

import { airtableGetAll, handleOptions, respond } from './utils/airtable.js';

const VOTES_TABLE = 'Votes';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  try {
    const pilotId = event.queryStringParameters?.pilotId;
    if (!pilotId) {
      return respond(400, { success: false, message: 'pilotId is required' });
    }

    const records = await airtableGetAll(VOTES_TABLE);
    const votes = records
      .map(r => {
        let pullIn = [];
        let pullBack = [];
        try { pullIn = r.fields.pullFactorsIn ? JSON.parse(r.fields.pullFactorsIn) : []; } catch (e) { pullIn = []; }
        try { pullBack = r.fields.pullFactorsBack ? JSON.parse(r.fields.pullFactorsBack) : []; } catch (e) { pullBack = []; }
        return { ...r.fields, pullFactorsIn: pullIn, pullFactorsBack: pullBack };
      })
      .filter(v => {
        const pid = Array.isArray(v.pilotId) ? v.pilotId[0] : v.pilotId;
        return pid === pilotId;
      });

    if (votes.length === 0) {
      return respond(200, {
        success: true,
        stats: { totalVotes: 0, avgOverall: 0, avgCuriosity: 0, avgSeries: 0, topPullFactorsIn: [], topPullFactorsBack: [] }
      });
    }

    const totalVotes = votes.length;
    const avgCuriosity = votes.reduce((sum, v) => sum + (v.curiosityScore || 0), 0) / totalVotes;
    const avgSeries = votes.reduce((sum, v) => sum + (v.seriesScore || 0), 0) / totalVotes;
    const avgOverall = votes.reduce((sum, v) => sum + (v.overallScore || 0), 0) / totalVotes;

    // Calculate top pull factors
    const pullInCount = {};
    const pullBackCount = {};
    votes.forEach(vote => {
      (vote.pullFactorsIn || []).forEach(f => { pullInCount[f] = (pullInCount[f] || 0) + 1; });
      (vote.pullFactorsBack || []).forEach(f => { pullBackCount[f] = (pullBackCount[f] || 0) + 1; });
    });

    const topPullFactorsIn = Object.entries(pullInCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);
    const topPullFactorsBack = Object.entries(pullBackCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);

    return respond(200, {
      success: true,
      stats: { totalVotes, avgOverall, avgCuriosity, avgSeries, topPullFactorsIn, topPullFactorsBack }
    });
  } catch (e) {
    console.error('Get pilot stats error:', e);
    return respond(500, { success: false, message: 'Failed to fetch pilot stats' });
  }
};
