// DEPRECATED — Phase 2 migration complete.
// All Airtable calls now go through serverless functions in netlify/functions/
// This file is kept as a safety net to avoid import errors from any missed references.

const airtableFetch = async () => {
  throw new Error('Direct Airtable access has been removed. All API calls should go through serverless functions.');
};

export default airtableFetch;
