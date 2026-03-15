// Session token authentication for serverless functions
// Tokens are stored on the voter's Airtable record — easy to revoke

import crypto from 'crypto';
import { airtableGetAll } from './airtable.js';

const VOTERS_TABLE = 'Voters';

// Generate a secure random session token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Authenticate a request by looking up the session token in Airtable
// Returns the voter record if valid, throws if not
const authenticate = async (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    const err = new Error('No authorization token provided');
    err.statusCode = 401;
    throw err;
  }

  // Look up voter by session token
  const records = await airtableGetAll(VOTERS_TABLE, `{sessionToken} = '${token}'`);

  if (!records.length) {
    const err = new Error('Invalid or expired session token');
    err.statusCode = 401;
    throw err;
  }

  const voter = { id: records[0].id, ...records[0].fields };

  if (voter.deleted) {
    const err = new Error('Account has been deleted');
    err.statusCode = 401;
    throw err;
  }

  return voter;
};

export { generateToken, authenticate };
