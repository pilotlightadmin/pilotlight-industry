// POST /.netlify/functions/api-admin
// Body: { action, targetId, ... }
// Auth required — checks for admin/creator status
// Actions: approveCreator, rejectCreator, revokeCreator, deletePilot, deleteVoter, deleteVote, getVoters, getCreatorApps, getApprovedCreators

import { airtableGetAll, airtableGet, airtableUpdate, airtableDelete, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';
import { sendBrevoEmail, buildCreatorWelcomeEmail } from './utils/brevo.js';

const VOTERS_TABLE = 'Voters';
const PILOTS_TABLE = 'Pilots';
const VOTES_TABLE = 'Votes';
const CREATORS_TABLE = 'Creators';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const { action, targetId } = JSON.parse(event.body || '{}');

    if (!action) {
      return respond(400, { success: false, message: 'action is required' });
    }

    // TODO: Add proper admin role checking when admin system is built
    // For now, creator status serves as elevated permissions (matches current behavior)

    switch (action) {
      case 'getVoters': {
        const records = await airtableGetAll(VOTERS_TABLE);
        const voters = records.map(r => {
          const { password, passwordHistory, sessionToken, resetToken, resetExpiry, ...safe } = r.fields;
          return { id: r.id, ...safe };
        });
        return respond(200, { success: true, voters });
      }

      case 'getCreatorApps': {
        const records = await airtableGetAll(VOTERS_TABLE);
        const pending = records
          .map(r => ({ id: r.id, ...r.fields }))
          .filter(v => v.creatorStatus === 'pending')
          .map(v => {
            const { password, passwordHistory, sessionToken, resetToken, resetExpiry, ...safe } = v;
            try { safe.creatorApplication = JSON.parse(safe.creatorApplication || '{}'); } catch (e) { safe.creatorApplication = {}; }
            return safe;
          });
        return respond(200, { success: true, applications: pending });
      }

      case 'getApprovedCreators': {
        const records = await airtableGetAll(VOTERS_TABLE);
        const approved = records
          .map(r => ({ id: r.id, ...r.fields }))
          .filter(v => v.creatorStatus === 'approved')
          .map(v => {
            const { password, passwordHistory, sessionToken, resetToken, resetExpiry, ...safe } = v;
            try { safe.creatorApplication = JSON.parse(safe.creatorApplication || '{}'); } catch (e) { safe.creatorApplication = {}; }
            return safe;
          });
        return respond(200, { success: true, creators: approved });
      }

      case 'approveCreator': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableUpdate(VOTERS_TABLE, targetId, {
          creatorStatus: 'approved',
          creatorApprovedAt: new Date().toISOString(),
          Creator: true
        });

        // Send creator welcome email directly via Brevo
        try {
          const voterRecord = await airtableGet(VOTERS_TABLE, targetId);
          if (voterRecord.fields.email) {
            const name = voterRecord.fields.name || 'Creator';
            const html = buildCreatorWelcomeEmail(name);
            const result = await sendBrevoEmail(
              voterRecord.fields.email,
              name,
              "You're in — welcome to Pilot Light as a Creator!",
              html
            );
            console.log('Creator welcome email result:', JSON.stringify(result));
          }
        } catch (emailErr) {
          // Log but don't fail the approval if email fails
          console.error('Creator welcome email failed:', emailErr);
        }

        return respond(200, { success: true });
      }

      case 'rejectCreator': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableUpdate(VOTERS_TABLE, targetId, {
          creatorStatus: 'rejected',
          creatorRejectedAt: new Date().toISOString()
        });
        return respond(200, { success: true });
      }

      case 'revokeCreator': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableUpdate(VOTERS_TABLE, targetId, {
          creatorStatus: 'none',
          Creator: false
        });
        return respond(200, { success: true });
      }

      case 'deletePilot': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableDelete(PILOTS_TABLE, targetId);
        return respond(200, { success: true });
      }

      case 'deleteVoter': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableDelete(VOTERS_TABLE, targetId);
        return respond(200, { success: true });
      }

      case 'deleteVote': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableDelete(VOTES_TABLE, targetId);
        return respond(200, { success: true });
      }

      case 'deleteCreator': {
        if (!targetId) return respond(400, { success: false, message: 'targetId is required' });
        await airtableDelete(CREATORS_TABLE, targetId);
        return respond(200, { success: true });
      }

      default:
        return respond(400, { success: false, message: `Unknown action: ${action}` });
    }
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Admin action error:', e);
    return respond(500, { success: false, message: 'Admin action failed' });
  }
};
