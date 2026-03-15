// Netlify Function: Check Mux Upload Status and Get Playback ID
// Call this after upload completes to get the playback ID for streaming

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get upload ID from query parameters
    const uploadId = event.queryStringParameters?.uploadId;

    if (!uploadId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing uploadId parameter' })
      };
    }

    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');

    // Check the upload status
    const response = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mux API error:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to get upload status', details: errorText })
      };
    }

    const data = await response.json();
    const upload = data.data;

    // If the upload is complete and has an asset, get the asset details
    if (upload.status === 'asset_created' && upload.asset_id) {
      // Fetch the asset to get the playback ID
      const assetResponse = await fetch(`https://api.mux.com/video/v1/assets/${upload.asset_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (assetResponse.ok) {
        const assetData = await assetResponse.json();
        const asset = assetData.data;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: upload.status,
            assetId: upload.asset_id,
            playbackId: asset.playback_ids?.[0]?.id || null,
            assetStatus: asset.status, // 'preparing', 'ready', 'errored'
            duration: asset.duration || null
          })
        };
      }
    }

    // Return current status if asset not yet created
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: upload.status, // 'waiting', 'asset_created', 'errored', 'cancelled'
        assetId: upload.asset_id || null,
        playbackId: null
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
