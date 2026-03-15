// Phase 2: Airtable credentials removed from client code.
// All API calls now go through serverless functions in netlify/functions/
// API keys are stored as environment variables on Netlify (and in .env for local dev)

export const NETLIFY_FUNCTIONS_URL = ''; // empty string = same origin (works for both local and production)
