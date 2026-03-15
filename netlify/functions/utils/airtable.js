// Shared Airtable helper for all serverless functions
// Reads credentials from process.env — never exposed to client

// Node 18+ has native fetch — no need for node-fetch

const AIRTABLE_API_KEY = () => process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = () => process.env.AIRTABLE_BASE_ID;

const baseUrl = (table, recordId) =>
  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID()}/${encodeURIComponent(table)}${recordId ? '/' + recordId : ''}`;

const headers = () => ({
  'Authorization': `Bearer ${AIRTABLE_API_KEY()}`,
  'Content-Type': 'application/json'
});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Handle OPTIONS preflight
const handleOptions = () => ({ statusCode: 204, headers: corsHeaders, body: '' });

// JSON response helper
const respond = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

// Fetch all records with pagination
const airtableGetAll = async (table, filterFormula = null) => {
  let allRecords = [];
  let offset = null;
  do {
    let url = baseUrl(table);
    const params = [];
    if (offset) params.push(`offset=${offset}`);
    if (filterFormula) params.push(`filterByFormula=${encodeURIComponent(filterFormula)}`);
    if (params.length) url += '?' + params.join('&');

    const resp = await fetch(url, { headers: headers() });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || `Airtable GET failed: ${resp.status}`);
    }
    const data = await resp.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return allRecords;
};

// Get a single record
const airtableGet = async (table, recordId) => {
  const resp = await fetch(baseUrl(table, recordId), { headers: headers() });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message || `Airtable GET failed: ${resp.status}`);
  }
  return resp.json();
};

// Create a record
const airtableCreate = async (table, fields) => {
  const resp = await fetch(baseUrl(table), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error?.message || `Airtable CREATE failed: ${resp.status}`);
  }
  return data;
};

// Update a record
const airtableUpdate = async (table, recordId, fields) => {
  const resp = await fetch(baseUrl(table, recordId), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error?.message || `Airtable UPDATE failed: ${resp.status}`);
  }
  return data;
};

// Delete a record
const airtableDelete = async (table, recordId) => {
  const resp = await fetch(baseUrl(table, recordId), {
    method: 'DELETE',
    headers: headers()
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message || `Airtable DELETE failed: ${resp.status}`);
  }
  return resp.json();
};

export {
  airtableGetAll,
  airtableGet,
  airtableCreate,
  airtableUpdate,
  airtableDelete,
  corsHeaders,
  handleOptions,
  respond
};
