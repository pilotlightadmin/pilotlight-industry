// POST /.netlify/functions/api-send-message
// Body: { toCreatorUserId, pilotId, pilotTitle, messageText, senderName, fromUserId }
//   OR: { action: 'markRead', messageId }
// Auth required

import { airtableGetAll, airtableCreate, airtableUpdate, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const MESSAGES_TABLE = 'Messages';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const body = JSON.parse(event.body || '{}');

    // Mark message as read
    if (body.action === 'markRead' && body.messageId) {
      const result = await airtableUpdate(MESSAGES_TABLE, body.messageId, { isRead: true });
      return respond(200, { success: true, message: { id: result.id, ...result.fields } });
    }

    // Send new message
    const { toCreatorUserId, pilotId, pilotTitle, messageText, senderName, fromUserId } = body;

    if (!toCreatorUserId || !pilotId || !messageText) {
      return respond(400, { success: false, message: 'toCreatorUserId, pilotId, and messageText are required' });
    }

    if (messageText.length > 2000) {
      return respond(400, { success: false, message: 'Message must be under 2000 characters' });
    }

    const fields = {
      fromUserId: fromUserId || voter.id,
      toCreatorUserId,
      pilotId,
      pilotTitle: pilotTitle || '',
      messageText,
      senderName: senderName || '',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const result = await airtableCreate(MESSAGES_TABLE, fields);
    const message = { id: result.id, ...result.fields };

    return respond(200, { success: true, message });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Send message error:', e);
    return respond(500, { success: false, message: 'Failed to send message' });
  }
};
