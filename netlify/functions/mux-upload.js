// Netlify Function: Create Mux Direct Upload URL
// This function securely communicates with Mux API using your credentials

exports.handler = async (event, context) => {
  // CORS headers for local development and production
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Mux API credentials from environment variables
    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      console.error('Missing Mux credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');

    // Request a direct upload URL from Mux
    const response = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline' // Use 'smart' for higher quality (costs more)
        },
        cors_origin: '*' // Allow uploads from any origin (restrict in production)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Inline billing check (billing-alert.js uses ESM which breaks esbuild CJS bundling)
      if (response.status === 402 || /billing|payment|credits|quota|suspended/i.test(JSON.stringify(errorText))) {
        console.error(`[BILLING] billing/quota error: HTTP ${response.status}`, JSON.stringify(errorText).slice(0, 300));
      }
      console.error('Mux API error:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to create upload URL', details: errorText })
      };
    }

    const data = await response.json();

    // Return the upload URL and upload ID to the client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl: data.data.url,
        uploadId: data.data.id
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
