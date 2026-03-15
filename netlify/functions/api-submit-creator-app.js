// POST /.netlify/functions/api-submit-creator-app
// Body: { applicationData: { creatorType, ... } }
// Auth required

import { airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const VOTERS_TABLE = 'Voters';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const { applicationData } = JSON.parse(event.body || '{}');

    if (!applicationData) {
      return respond(400, { success: false, message: 'applicationData is required' });
    }

    await airtableUpdate(VOTERS_TABLE, voter.id, {
      creatorStatus: 'pending',
      creatorApplication: JSON.stringify(applicationData),
      creatorAppliedAt: new Date().toISOString(),
      creatorType: applicationData.creatorType || ''
    });

    // Return updated voter data (strip sensitive fields)
    const { password: _, passwordHistory: __, sessionToken: ___, ...safeVoter } = voter;
    safeVoter.creatorStatus = 'pending';
    safeVoter.creatorApplication = JSON.stringify(applicationData);
    safeVoter.creatorType = applicationData.creatorType;

    return respond(200, { success: true, voter: safeVoter });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Submit creator app error:', e);
    return respond(500, { success: false, message: 'Failed to submit application' });
  }
};
