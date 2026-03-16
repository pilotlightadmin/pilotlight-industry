// GET /.netlify/functions/api-get-messages?creatorUserId=xxx
// Auth required — returns messages for the authenticated creator

import { airtableGetAll, handleOptions, respond } from './utils/airtable.js';
import { authenticate } from './utils/auth.js';

const MESSAGES_TABLE = 'Messages';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  try {
    const voter = await authenticate(event);
    const creatorUserId = event.queryStringParameters?.creatorUserId;

    if (!creatorUserId) {
      return respond(400, { success: false, message: 'creatorUserId is required' });
    }

    // Security: only allow fetching own messages
    if (creatorUserId !== voter.id) {
      return respond(403, { success: false, message: 'Not authorized to view these messages' });
    }

    const allRecords = await airtableGetAll(MESSAGES_TABLE);
    const messages = allRecords
      .filter(r => r.fields.toCreatorUserId === creatorUserId)
      .map(r => ({
        id: r.id,
        fromUserId: r.fields.fromUserId || '',
        toCreatorUserId: r.fields.toCreatorUserId || '',
        pilotId: r.fields.pilotId || '',
        pilotTitle: r.fields.pilotTitle || '',
        messageText: r.fields.messageText || '',
        senderName: r.fields.senderName || '',
        createdAt: r.fields.createdAt || '',
        isRead: r.fields.isRead || false
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return respond(200, { success: true, messages });
  } catch (e) {
    if (e.statusCode === 401) return respond(401, { success: false, message: e.message });
    console.error('Get messages error:', e);
    return respond(500, { success: false, message: 'Failed to fetch messages' });
  }
};
